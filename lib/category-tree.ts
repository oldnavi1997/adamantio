/**
 * Reglas de la jerarquía de categorías, sin base de datos.
 *
 * Todo lo que decide si un árbol es válido vive aquí como funciones puras: el
 * servicio (lib/categorias.ts) lee las categorías dentro de una transacción,
 * pregunta a estas funciones y solo entonces escribe. Así las reglas se pueden
 * probar sin Postgres y no hay dos implementaciones que puedan divergir.
 */

export const MAX_NIVEL = 3;

/** Lo mínimo que necesitan las reglas. Cualquier fila de `categories` lo cumple. */
export type NodoCategoria = {
  id: string;
  parentId: string | null;
  slug?: string | null;
  name?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export class CategoryRuleError extends Error {
  constructor(
    message: string,
    /** HTTP que le corresponde: 400 entrada inválida, 404 no existe, 409 conflicto. */
    readonly status: 400 | 404 | 409 = 400
  ) {
    super(message);
    this.name = "CategoryRuleError";
  }
}

function indexar<T extends NodoCategoria>(todas: readonly T[]) {
  const porId = new Map<string, T>();
  const hijasDe = new Map<string | null, T[]>();
  for (const c of todas) {
    porId.set(c.id, c);
    const k = c.parentId ?? null;
    const lista = hijasDe.get(k);
    if (lista) lista.push(c);
    else hijasDe.set(k, [c]);
  }
  return { porId, hijasDe };
}

/** Nivel de una categoría contando desde la raíz (1). Lanza si hay un ciclo. */
export function nivelDe(todas: readonly NodoCategoria[], id: string): number {
  const { porId } = indexar(todas);
  let nivel = 0;
  let actual: string | null = id;
  const vistos = new Set<string>();
  while (actual) {
    if (vistos.has(actual)) throw new CategoryRuleError("La jerarquía tiene un ciclo", 409);
    vistos.add(actual);
    const nodo = porId.get(actual);
    if (!nodo) throw new CategoryRuleError("Categoría no encontrada", 404);
    nivel++;
    actual = nodo.parentId;
  }
  return nivel;
}

/** Ids de toda la descendencia de `id`, sin incluirla. */
export function idsDescendientes(todas: readonly NodoCategoria[], id: string): string[] {
  const { hijasDe } = indexar(todas);
  const out: string[] = [];
  const pendientes = [id];
  const vistos = new Set<string>([id]);
  while (pendientes.length) {
    const p = pendientes.pop()!;
    for (const h of hijasDe.get(p) ?? []) {
      if (vistos.has(h.id)) continue; // ciclo: no se recorre dos veces
      vistos.add(h.id);
      out.push(h.id);
      pendientes.push(h.id);
    }
  }
  return out;
}

/** Cuántos niveles cuelgan por debajo de `id`: 0 si no tiene hijas. */
export function alturaSubarbol(todas: readonly NodoCategoria[], id: string): number {
  const { hijasDe } = indexar(todas);
  const medir = (n: string, vistos: Set<string>): number => {
    let max = 0;
    for (const h of hijasDe.get(n) ?? []) {
      if (vistos.has(h.id)) continue;
      vistos.add(h.id);
      max = Math.max(max, 1 + medir(h.id, vistos));
    }
    return max;
  };
  return medir(id, new Set([id]));
}

/** Nivel que tendría una categoría nueva colgada de `parentId`. */
export function nivelParaCrear(todas: readonly NodoCategoria[], parentId: string | null): number {
  if (!parentId) return 1;
  if (!todas.some((c) => c.id === parentId)) {
    throw new CategoryRuleError("La categoría padre no existe", 404);
  }
  const nivel = nivelDe(todas, parentId) + 1;
  if (nivel > MAX_NIVEL) {
    throw new CategoryRuleError(`Máximo ${MAX_NIVEL} niveles: esa categoría ya está en el último`);
  }
  return nivel;
}

/**
 * Valida mover `id` debajo de `nuevoPadreId` (null = a la raíz) y devuelve el
 * nivel nuevo de la categoría y de cada descendiente que cambia.
 *
 * Rechaza moverla dentro de sí misma o de su descendencia (crearía un ciclo) y
 * que el subárbol entero, una vez movido, pase del nivel 3.
 */
export function planMover(
  todas: readonly NodoCategoria[],
  id: string,
  nuevoPadreId: string | null
): { id: string; level: number }[] {
  if (!todas.some((c) => c.id === id)) throw new CategoryRuleError("Categoría no encontrada", 404);
  if (nuevoPadreId === id) throw new CategoryRuleError("Una categoría no puede ser su propio padre");
  const descendencia = idsDescendientes(todas, id);
  if (nuevoPadreId && descendencia.includes(nuevoPadreId)) {
    throw new CategoryRuleError("No se puede mover una categoría dentro de su propia descendencia");
  }

  const nivelNuevo = nivelParaCrear(todas, nuevoPadreId);
  const altura = alturaSubarbol(todas, id);
  if (nivelNuevo + altura > MAX_NIVEL) {
    throw new CategoryRuleError(
      `Máximo ${MAX_NIVEL} niveles: con sus subcategorías quedaría en el nivel ${nivelNuevo + altura}`
    );
  }

  // Niveles recalculados sobre el árbol ya movido.
  const movido = todas.map((c) => (c.id === id ? { ...c, parentId: nuevoPadreId } : c));
  return [id, ...descendencia].map((d) => ({ id: d, level: nivelDe(movido, d) }));
}

/** Padres válidos para `id` (o para una categoría nueva si `id` es null). */
export function padresPosibles<T extends NodoCategoria>(todas: readonly T[], id: string | null): T[] {
  return todas.filter((c) => {
    try {
      if (id) planMover(todas, id, c.id);
      else nivelParaCrear(todas, c.id);
      return true;
    } catch {
      return false;
    }
  });
}

/** Una categoría solo se borra vacía: sin subcategorías y sin productos. */
export function motivoParaNoBorrar(hijas: number, productos: number): string | null {
  if (hijas > 0) {
    return `Tiene ${hijas} subcategoría${hijas === 1 ? "" : "s"}: muévelas o elimínalas primero`;
  }
  if (productos > 0) {
    return `Tiene ${productos} producto${productos === 1 ? "" : "s"} asignado${productos === 1 ? "" : "s"}: quítalos o desactívala`;
  }
  return null;
}

// ─── URLs ────────────────────────────────────────────────────────────────────

export const BASE_CATEGORIAS = "/categorias";

/** El tramo de URL de una categoría: su slug, o el `id` si el POS la dejó sin él. */
export function segmentoCategoria(c: { id: string; slug?: string | null }): string {
  return c.slug || c.id;
}

/** La cadena raíz → `id`, inclusive. */
export function ancestros<T extends NodoCategoria>(todas: readonly T[], id: string): T[] {
  const { porId } = indexar(todas);
  const cadena: T[] = [];
  const vistos = new Set<string>();
  let actual = porId.get(id);
  while (actual && !vistos.has(actual.id)) {
    vistos.add(actual.id);
    cadena.unshift(actual);
    actual = actual.parentId ? porId.get(actual.parentId) : undefined;
  }
  return cadena;
}

/** `/categorias/joyas/anillos/de-promesa`. */
export function rutaCategoria(todas: readonly NodoCategoria[], id: string): string {
  return `${BASE_CATEGORIAS}/${ancestros(todas, id).map(segmentoCategoria).join("/")}`;
}

/**
 * Resuelve `/categorias/a/b/c` validando la cadena entera: `a` tiene que ser
 * raíz, `b` hija de `a` y `c` hija de `b`. Cada tramo se acepta por slug o por
 * id —el id es lo que llevan los enlaces de una categoría sin slug—.
 *
 * Devuelve la cadena y si la URL pedida es la canónica; si no lo es, quien
 * llama redirige. `null` si algún tramo no encaja.
 */
export function resolverRuta<T extends NodoCategoria>(
  todas: readonly T[],
  segmentos: readonly string[]
): { cadena: T[]; canonica: boolean } | null {
  if (segmentos.length === 0 || segmentos.length > MAX_NIVEL) return null;
  const { hijasDe } = indexar(todas);
  const cadena: T[] = [];
  let padre: string | null = null;
  let canonica = true;
  for (const seg of segmentos) {
    const s = decodeURIComponent(seg).toLowerCase();
    const candidatas: T[] = hijasDe.get(padre) ?? [];
    const porSlug = candidatas.find((c) => c.slug && c.slug.toLowerCase() === s);
    const nodo = porSlug ?? candidatas.find((c) => c.id.toLowerCase() === s);
    if (!nodo) return null;
    if (seg !== segmentoCategoria(nodo)) canonica = false;
    cadena.push(nodo);
    padre = nodo.id;
  }
  return { cadena, canonica };
}

// ─── Árbol ───────────────────────────────────────────────────────────────────

export type NodoArbol<T> = T & { children: NodoArbol<T>[] };

/** Arma el árbol ordenado por `sortOrder` y nombre. */
export function construirArbol<T extends NodoCategoria>(todas: readonly T[]): NodoArbol<T>[] {
  const { hijasDe } = indexar(todas);
  const orden = (a: T, b: T) =>
    (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || (a.name ?? "").localeCompare(b.name ?? "", "es");
  const armar = (padre: string | null, vistos: Set<string>): NodoArbol<T>[] =>
    [...(hijasDe.get(padre) ?? [])]
      .filter((c) => !vistos.has(c.id))
      .sort(orden)
      .map((c) => ({ ...c, children: armar(c.id, new Set(vistos).add(c.id)) }));
  return armar(null, new Set());
}

/** Quita las inactivas y, con ellas, toda su descendencia. */
export function soloActivas<T extends NodoCategoria>(todas: readonly T[]): T[] {
  const inactivas = new Set(todas.filter((c) => c.isActive === false).map((c) => c.id));
  const ocultas = new Set(inactivas);
  for (const id of inactivas) for (const d of idsDescendientes(todas, id)) ocultas.add(d);
  return todas.filter((c) => !ocultas.has(c.id));
}

// ─── Asignación de productos ─────────────────────────────────────────────────

/**
 * El conjunto de categorías de un producto después de una operación en lote.
 * La principal es la primera de la lista: es la que va a `Product.categoryId`.
 * Nunca hay duplicados.
 */
export function aplicarAsignacion(
  actuales: readonly string[],
  categoryIds: readonly string[],
  modo: "add" | "set" | "remove",
  principal?: string | null
): string[] {
  const unicos = (ids: readonly string[]) => [...new Set(ids)];
  let resultado: string[];
  if (modo === "set") resultado = unicos(categoryIds);
  else if (modo === "add") resultado = unicos([...actuales, ...categoryIds]);
  else resultado = actuales.filter((id) => !categoryIds.includes(id));
  if (principal && resultado.includes(principal)) {
    resultado = [principal, ...resultado.filter((id) => id !== principal)];
  }
  return resultado;
}
