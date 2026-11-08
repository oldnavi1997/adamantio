import { randomUUID } from "crypto";
import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { slugFromName, slugify } from "@/lib/utils";
import { Prisma } from "@/app/generated/prisma/client";
import {
  CategoryRuleError,
  aplicarAsignacion,
  construirArbol,
  idsDescendientes,
  motivoParaNoBorrar,
  nivelParaCrear,
  planMover,
  rutaCategoria,
  soloActivas,
  type NodoCategoria,
} from "@/lib/category-tree";
import { listarProductos, enCategorias } from "@/lib/catalog-query";
import type { CrearCategoria, EditarCategoria } from "@/lib/categorias-schema";

/**
 * Servicio de categorías: la única puerta de escritura sobre `categories` y
 * `product_categories`. Las reglas (niveles, ciclos, qué se puede borrar) están
 * en lib/category-tree.ts; aquí se aplican dentro de una transacción.
 *
 * Toda escritura que toque la jerarquía toma el mismo advisory lock. Sin él,
 * dos admins moviendo A dentro de B y B dentro de A a la vez pasarían cada uno
 * su validación —leyendo el árbol de antes— y dejarían un ciclo.
 */

export { CategoryRuleError } from "@/lib/category-tree";

export const CATEGORIAS_TAG = "categories";

type Tx = Prisma.TransactionClient;

const SELECT_NODO = {
  id: true,
  name: true,
  slug: true,
  parentId: true,
  sortOrder: true,
  isActive: true,
} as const;

async function conArbolBloqueado<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('categories_tree'))`;
    return fn(tx);
  });
}

/** Tras cualquier escritura: el menú, las páginas públicas y el sitemap leen la caché. */
export function invalidarCategorias() {
  try {
    revalidateTag(CATEGORIAS_TAG, { expire: 0 });
  } catch {
    // Fuera de una petición (scripts tsx) no hay caché que invalidar.
  }
}

async function slugLibre(tx: Tx, base: string, excluirId?: string): Promise<string> {
  const raiz = slugFromName(base) || "categoria";
  for (let n = 1; ; n++) {
    const candidato = n === 1 ? raiz : `${raiz}-${n}`;
    const ocupado = await tx.category.findFirst({
      where: { slug: candidato, ...(excluirId && { id: { not: excluirId } }) },
      select: { id: true },
    });
    if (!ocupado) return candidato;
  }
}

// ─── Escritura ───────────────────────────────────────────────────────────────

export async function createCategory(input: CrearCategoria) {
  const categoria = await conArbolBloqueado(async (tx) => {
    const todas = await tx.category.findMany({ select: SELECT_NODO });
    const parentId = input.parentId ?? null;
    const level = nivelParaCrear(todas, parentId);
    const ultima = await tx.category.aggregate({
      where: { parentId },
      _max: { sortOrder: true },
    });
    return tx.category.create({
      data: {
        id: randomUUID(),
        name: input.name,
        slug: await slugLibre(tx, input.slug || input.name),
        description: input.description ?? null,
        image: input.image ?? null,
        banner: input.banner ?? null,
        metaTitle: input.metaTitle ?? null,
        metaDescription: input.metaDescription ?? null,
        isActive: input.isActive ?? true,
        parentId,
        level,
        sortOrder: (ultima._max.sortOrder ?? -1) + 1,
      },
    });
  });
  invalidarCategorias();
  return categoria;
}

/**
 * Edita campos y, si cambia `parentId`, mueve la categoría con toda su
 * descendencia. El slug no sigue al nombre —igual que el de los productos, la
 * URL ya publicada no se mueve—; solo cambia si se manda explícitamente.
 */
export async function updateCategory(id: string, patch: Partial<EditarCategoria>) {
  const categoria = await conArbolBloqueado(async (tx) => {
    const actual = await tx.category.findUnique({ where: { id } });
    if (!actual) throw new CategoryRuleError("Categoría no encontrada", 404);

    const data: Prisma.CategoryUncheckedUpdateInput = {};
    for (const k of ["name", "description", "image", "banner", "metaTitle", "metaDescription", "isActive"] as const) {
      if (patch[k] !== undefined) (data as Record<string, unknown>)[k] = patch[k];
    }
    if (patch.slug !== undefined) {
      data.slug = patch.slug ? await slugLibre(tx, patch.slug, id) : await slugLibre(tx, patch.name ?? actual.name, id);
    }

    const nuevoPadre = patch.parentId === undefined ? actual.parentId : patch.parentId ?? null;
    if (nuevoPadre !== actual.parentId) {
      const todas = await tx.category.findMany({ select: SELECT_NODO });
      const niveles = planMover(todas, id, nuevoPadre);
      for (const n of niveles) {
        if (n.id !== id) await tx.category.update({ where: { id: n.id }, data: { level: n.level } });
      }
      const ultima = await tx.category.aggregate({ where: { parentId: nuevoPadre }, _max: { sortOrder: true } });
      data.parentId = nuevoPadre;
      data.level = niveles[0].level;
      data.sortOrder = (ultima._max.sortOrder ?? -1) + 1;
    }

    const actualizada = await tx.category.update({ where: { id }, data });

    // `Product.category` es el nombre de la principal, denormalizado: lo leen
    // Algolia, el feed, el POS y el panel de grabado. Si cambia el nombre se
    // propaga, o esos productos quedarían con un nombre que ya no existe.
    if (patch.name && patch.name !== actual.name) {
      await tx.product.updateMany({
        where: { OR: [{ categoryId: id }, { category: actual.name }] },
        data: { category: patch.name },
      });
    }
    return actualizada;
  });
  invalidarCategorias();
  return categoria;
}

/** Solo borra categorías vacías. Con productos, se desactiva. */
export async function deleteCategory(id: string) {
  await conArbolBloqueado(async (tx) => {
    const cat = await tx.category.findUnique({
      where: { id },
      select: { _count: { select: { children: true, productLinks: true, products: true } } },
    });
    if (!cat) throw new CategoryRuleError("Categoría no encontrada", 404);
    const productos = Math.max(cat._count.productLinks, cat._count.products);
    const motivo = motivoParaNoBorrar(cat._count.children, productos);
    if (motivo) throw new CategoryRuleError(`No se puede eliminar: ${motivo.charAt(0).toLowerCase()}${motivo.slice(1)}`, 409);
    await tx.category.delete({ where: { id } });
  });
  invalidarCategorias();
}

export async function deactivateCategory(id: string) {
  return updateCategory(id, { isActive: false });
}

/**
 * Guarda el orden. Solo importa el orden relativo entre hermanas, así que el
 * admin puede mandar índices de cualquier lista que las contenga.
 */
export async function reorderCategories(items: { id: string; sortOrder: number }[]) {
  await conArbolBloqueado(async (tx) => {
    const existentes = await tx.category.count({ where: { id: { in: items.map((i) => i.id) } } });
    if (existentes !== new Set(items.map((i) => i.id)).size) {
      throw new CategoryRuleError("Alguna categoría ya no existe; recarga la página", 404);
    }
    for (const { id, sortOrder } of items) {
      await tx.category.update({ where: { id }, data: { sortOrder } });
    }
  });
  invalidarCategorias();
}

// ─── Productos ───────────────────────────────────────────────────────────────

/**
 * Deja al producto exactamente en `categoryIds`; la primera es la principal.
 *
 * El orden importa por el trigger de "Product": primero se escribe la
 * principal en el producto (el trigger crea su fila y borra la de la principal
 * anterior) y después se reconcilia el conjunto completo, que es lo que gana.
 */
export async function setProductCategories(tx: Tx, productId: string, categoryIds: string[]) {
  const ids = [...new Set(categoryIds)];
  const principal = ids[0]
    ? await tx.category.findUnique({ where: { id: ids[0] }, select: { id: true, name: true } })
    : null;
  await tx.product.update({
    where: { id: productId },
    data: { categoryId: principal?.id ?? null, category: principal?.name ?? null },
  });
  await tx.productCategory.deleteMany({ where: { productId, categoryId: { notIn: ids } } });
  if (ids.length) {
    await tx.productCategory.createMany({
      data: ids.map((categoryId) => ({ productId, categoryId })),
      skipDuplicates: true,
    });
  }
}

/** Comprueba que existan y devuelve los ids en el orden pedido, sin repetidos. */
export async function validarCategoryIds(ids: string[], db: Tx | typeof prisma = prisma): Promise<string[]> {
  const unicos = [...new Set(ids)];
  if (unicos.length === 0) return [];
  const encontrados = await db.category.count({ where: { id: { in: unicos } } });
  if (encontrados !== unicos.length) throw new CategoryRuleError("Alguna de las categorías elegidas no existe", 400);
  return unicos;
}

/** Cambio en lote desde la tabla de productos: añadir, reemplazar o quitar. */
export async function assignProductsToCategory(
  productIds: string[],
  categoryIds: string[],
  mode: "add" | "set" | "remove",
  primaryCategoryId?: string
) {
  await validarCategoryIds([...categoryIds, ...(primaryCategoryId ? [primaryCategoryId] : [])]);
  const productos = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, categoryId: true, categories: { select: { categoryId: true } } },
  });
  if (productos.length !== new Set(productIds).size) {
    throw new CategoryRuleError("Algún producto ya no existe; recarga la página", 404);
  }
  await prisma.$transaction(async (tx) => {
    for (const p of productos) {
      // La principal va primero para que siga siéndolo si no se toca.
      const actuales = [
        ...(p.categoryId ? [p.categoryId] : []),
        ...p.categories.map((c) => c.categoryId).filter((id) => id !== p.categoryId),
      ];
      await setProductCategories(tx, p.id, aplicarAsignacion(actuales, categoryIds, mode, primaryCategoryId));
    }
  });
  invalidarCategorias();
  return productos.length;
}

// ─── Lectura ─────────────────────────────────────────────────────────────────

export async function getCategoryById(id: string) {
  return prisma.category.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      _count: { select: { children: true, productLinks: true } },
    },
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}

export async function getCategoryChildren(id: string | null, { includeInactive = false } = {}) {
  return prisma.category.findMany({
    where: { parentId: id, ...(includeInactive ? {} : { isActive: true }) },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

/** La categoría y toda su descendencia. */
export async function getCategoryDescendantIds(id: string, { includeInactive = true } = {}) {
  const todas = await prisma.category.findMany({ select: SELECT_NODO });
  const visibles = includeInactive ? todas : soloActivas(todas);
  if (!visibles.some((c) => c.id === id)) return [];
  return [id, ...idsDescendientes(visibles, id)];
}

/**
 * Productos de la categoría y de todas sus subcategorías, paginados. Un
 * producto en dos subcategorías aparece una vez: se filtran productos, no
 * filas de la tabla intermedia.
 */
export async function getProductsByCategory(
  id: string,
  { page = 1, limit = 24, sort = "newest", includeInactive = false } = {}
) {
  const ids = await getCategoryDescendantIds(id, { includeInactive });
  if (ids.length === 0) return null;
  return listarProductos({
    where: { ...enCategorias(ids), ...(includeInactive ? {} : { isActive: true }) },
    page,
    limit,
    sort,
  });
}

/**
 * Árbol completo para el admin: con inactivas, nivel, y dos conteos —los
 * productos asignados directamente y los del subárbol sin repetir—.
 */
export async function getCategoryTree({ includeInactive = false } = {}) {
  const [todas, links] = await Promise.all([
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.productCategory.findMany({ select: { productId: true, categoryId: true } }),
  ]);
  const visibles = includeInactive ? todas : soloActivas(todas);
  const productosDe = new Map<string, Set<string>>();
  for (const l of links) {
    const s = productosDe.get(l.categoryId) ?? new Set<string>();
    s.add(l.productId);
    productosDe.set(l.categoryId, s);
  }
  const conConteo = visibles.map((c) => {
    const subarbol = new Set<string>();
    for (const id of [c.id, ...idsDescendientes(visibles, c.id)]) {
      for (const p of productosDe.get(id) ?? []) subarbol.add(p);
    }
    return {
      ...c,
      path: rutaCategoria(visibles, c.id),
      productCount: productosDe.get(c.id)?.size ?? 0,
      totalProductCount: subarbol.size,
    };
  });
  return construirArbol(conConteo);
}

// ─── Tienda (con caché) ──────────────────────────────────────────────────────

export type CategoriaPublica = {
  id: string;
  name: string;
  slug: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  level: number;
  description: string | null;
  image: string | null;
  banner: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  updatedAt: string;
};

/**
 * Todas las categorías activas, cacheadas hasta la próxima escritura. Es lo
 * que leen el menú (en cada página), /categorias y el sitemap: una sola
 * consulta compartida en vez de una por petición.
 */
export const getCategoriasPublicas = unstable_cache(
  async (): Promise<CategoriaPublica[]> => {
    const filas = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        ...SELECT_NODO,
        level: true,
        description: true,
        image: true,
        banner: true,
        metaTitle: true,
        metaDescription: true,
        updatedAt: true,
      },
    });
    return soloActivas(filas).map((c) => ({ ...c, updatedAt: c.updatedAt.toISOString() }));
  },
  ["categorias-publicas-v1"],
  { tags: [CATEGORIAS_TAG], revalidate: 3600 }
);

export async function getPublicCategoryTree() {
  return construirArbol(await getCategoriasPublicas());
}

// ─── Enlaces viejos ──────────────────────────────────────────────────────────

/**
 * Traduce el `?category=<slug>` de los enlaces anteriores a /categorias a una
 * categoría del árbol. Esos enlaces usaban `slugify(nombre)`, que no siempre
 * coincide con la columna `slug`, así que se prueban los dos.
 */
export async function resolverCategoriaLegada(valor: string): Promise<{ path: string } | null> {
  const todas = await getCategoriasPublicas();
  const encontrada =
    todas.find((c) => c.slug === valor) ?? todas.find((c) => slugify(c.name) === valor);
  return encontrada ? { path: rutaCategoria(todas, encontrada.id) } : null;
}

export type { NodoCategoria };
