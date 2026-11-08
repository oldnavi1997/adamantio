import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * El servicio contra un Prisma falso: comprueba qué se escribe y qué no, sin
 * tocar la base (que es compartida con el POS). La transacción entrega el
 * mismo objeto como `tx`.
 */
const db = vi.hoisted(() => {
  const fn = () => vi.fn();
  const d = {
    category: {
      findMany: fn(),
      findUnique: fn(),
      findFirst: fn(),
      aggregate: fn(),
      create: fn(),
      update: fn(),
      delete: fn(),
      count: fn(),
    },
    product: { findMany: fn(), count: fn(), update: fn(), updateMany: fn() },
    productCategory: { deleteMany: fn(), createMany: fn(), findMany: fn() },
    $executeRaw: fn(),
    $transaction: fn(),
  };
  return d;
});

vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("next/cache", () => ({
  unstable_cache: <T>(f: T) => f,
  revalidateTag: vi.fn(),
}));

import {
  assignProductsToCategory,
  createCategory,
  deleteCategory,
  getProductsByCategory,
  updateCategory,
} from "@/lib/categorias";
import { CategoryRuleError } from "@/lib/category-tree";

const arbol = [
  { id: "joyas", name: "Joyas", slug: "joyas", parentId: null, sortOrder: 0, isActive: true },
  { id: "anillos", name: "Anillos", slug: "anillos", parentId: "joyas", sortOrder: 0, isActive: true },
  { id: "promesa", name: "Anillos de promesa", slug: "anillos-de-promesa", parentId: "anillos", sortOrder: 0, isActive: true },
  { id: "plata", name: "Anillos de plata", slug: "anillos-de-plata", parentId: "anillos", sortOrder: 1, isActive: false },
  { id: "collares", name: "Collares", slug: "collares", parentId: "joyas", sortOrder: 1, isActive: true },
];

beforeEach(() => {
  vi.clearAllMocks();
  db.$transaction.mockImplementation(async (f: (tx: typeof db) => unknown) => f(db));
  db.category.findMany.mockResolvedValue(arbol);
  db.category.findFirst.mockResolvedValue(null); // slug libre
  db.category.aggregate.mockResolvedValue({ _max: { sortOrder: 4 } });
  db.category.create.mockImplementation(async ({ data }: { data: unknown }) => data);
  db.category.update.mockImplementation(async ({ data }: { data: unknown }) => data);
});

describe("createCategory", () => {
  it("crea en los tres niveles con su nivel y al final de sus hermanas", async () => {
    const n1 = await createCategory({ name: "Relojes", parentId: null } as never);
    const n3 = await createCategory({ name: "Anillos de oro", parentId: "anillos" } as never);
    expect(n1).toMatchObject({ level: 1, parentId: null, slug: "relojes", sortOrder: 5 });
    expect(n3).toMatchObject({ level: 3, parentId: "anillos", slug: "anillos-de-oro" });
    // Siempre bajo el advisory lock del árbol.
    expect(db.$executeRaw).toHaveBeenCalledTimes(2);
  });

  it("impide un cuarto nivel sin escribir nada", async () => {
    await expect(createCategory({ name: "Demasiado", parentId: "promesa" } as never)).rejects.toThrow(/Máximo 3 niveles/);
    expect(db.category.create).not.toHaveBeenCalled();
  });

  it("numera el slug si ya está ocupado", async () => {
    db.category.findFirst.mockResolvedValueOnce({ id: "otra" }).mockResolvedValueOnce(null);
    const c = await createCategory({ name: "Collares", parentId: "anillos" } as never);
    expect(c).toMatchObject({ slug: "collares-2" });
  });
});

describe("updateCategory: mover", () => {
  it("recalcula los niveles de la descendencia", async () => {
    db.category.findUnique.mockResolvedValue(arbol[1]); // anillos
    await updateCategory("anillos", { parentId: null });
    const niveles = Object.fromEntries(
      db.category.update.mock.calls.map((args) => {
        const a = args[0] as { where: { id: string }; data: { level?: number } };
        return [a.where.id, a.data.level];
      })
    );
    expect(niveles).toEqual({ promesa: 2, plata: 2, anillos: 1 });
  });

  it("impide moverla dentro de su descendencia", async () => {
    db.category.findUnique.mockResolvedValue(arbol[0]); // joyas
    await expect(updateCategory("joyas", { parentId: "promesa" })).rejects.toBeInstanceOf(CategoryRuleError);
    expect(db.category.update).not.toHaveBeenCalled();
  });

  it("propaga un cambio de nombre al texto denormalizado de los productos", async () => {
    db.category.findUnique.mockResolvedValue(arbol[4]); // collares
    await updateCategory("collares", { name: "Collares de plata" });
    expect(db.product.updateMany).toHaveBeenCalledWith({
      where: { OR: [{ categoryId: "collares" }, { category: "Collares" }] },
      data: { category: "Collares de plata" },
    });
  });
});

describe("deleteCategory", () => {
  it("no borra una categoría con productos", async () => {
    db.category.findUnique.mockResolvedValue({ _count: { children: 0, productLinks: 3, products: 3 } });
    const e = await deleteCategory("collares").catch((x) => x);
    expect(e).toBeInstanceOf(CategoryRuleError);
    expect(e.status).toBe(409);
    expect(db.category.delete).not.toHaveBeenCalled();
  });

  it("no borra una categoría con subcategorías", async () => {
    db.category.findUnique.mockResolvedValue({ _count: { children: 2, productLinks: 0, products: 0 } });
    await expect(deleteCategory("anillos")).rejects.toThrow(/subcategorías/);
  });

  it("borra una vacía", async () => {
    db.category.findUnique.mockResolvedValue({ _count: { children: 0, productLinks: 0, products: 0 } });
    await deleteCategory("collares");
    expect(db.category.delete).toHaveBeenCalledWith({ where: { id: "collares" } });
  });
});

describe("assignProductsToCategory", () => {
  it("asigna varias categorías sin duplicar y conserva la principal", async () => {
    db.category.count.mockResolvedValue(2);
    db.product.findMany.mockResolvedValue([
      { id: "p1", categoryId: "collares", categories: [{ categoryId: "collares" }] },
    ]);
    db.category.findUnique.mockResolvedValue({ id: "collares", name: "Collares" });

    await assignProductsToCategory(["p1"], ["promesa", "collares"], "add");

    // Primero la principal en el producto (el trigger de "Product" depende de este orden)…
    expect(db.product.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { categoryId: "collares", category: "Collares" },
    });
    // …después el conjunto completo, sin repetidos.
    expect(db.productCategory.deleteMany).toHaveBeenCalledWith({
      where: { productId: "p1", categoryId: { notIn: ["collares", "promesa"] } },
    });
    expect(db.productCategory.createMany).toHaveBeenCalledWith({
      data: [
        { productId: "p1", categoryId: "collares" },
        { productId: "p1", categoryId: "promesa" },
      ],
      skipDuplicates: true,
    });
    expect(db.product.update.mock.invocationCallOrder[0]).toBeLessThan(
      db.productCategory.createMany.mock.invocationCallOrder[0]
    );
  });

  it("rechaza categorías inexistentes antes de escribir", async () => {
    db.category.count.mockResolvedValue(1);
    await expect(assignProductsToCategory(["p1"], ["promesa", "fantasma"], "set")).rejects.toThrow(/no existe/);
    expect(db.product.update).not.toHaveBeenCalled();
  });
});

describe("getProductsByCategory", () => {
  it("una categoría principal incluye los productos de todas sus subcategorías activas", async () => {
    db.product.count.mockResolvedValue(0);
    db.product.findMany.mockResolvedValue([]);
    await getProductsByCategory("joyas");
    const where = db.product.count.mock.calls[0][0].where.AND[0];
    expect(where.isActive).toBe(true);
    expect(new Set(where.categories.some.categoryId.in)).toEqual(new Set(["joyas", "anillos", "promesa", "collares"]));
  });

  it("el admin ve también las subcategorías inactivas", async () => {
    db.product.count.mockResolvedValue(0);
    db.product.findMany.mockResolvedValue([]);
    await getProductsByCategory("anillos", { includeInactive: true });
    const where = db.product.count.mock.calls[0][0].where.AND[0];
    expect(where.isActive).toBeUndefined();
    expect(new Set(where.categories.some.categoryId.in)).toEqual(new Set(["anillos", "promesa", "plata"]));
  });

  it("null si la categoría no existe o está oculta", async () => {
    expect(await getProductsByCategory("plata")).toBeNull();
    expect(await getProductsByCategory("fantasma")).toBeNull();
  });
});
