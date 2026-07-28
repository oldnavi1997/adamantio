// Fuente única del orden del catálogo: la consumen el menú de escritorio
// (`SortSelect`), el drawer móvil (`SortDrawer`) y el servidor (`app/joyas/page.tsx`).
// Antes cada uno tenía su propia lista y se desincronizaron: el menú ofrecía
// "Destacados" y "Más vendidos", que no existían en el mapa de orden del servidor.

export const DEFAULT_SORT = "newest";

export const SORT_OPTIONS = [
  { value: "newest",     label: "Fecha: nuevo a antiguo" },
  { value: "oldest",     label: "Fecha: antiguo a nuevo" },
  { value: "name_asc",   label: "Alfabéticamente, A-Z" },
  { value: "name_desc",  label: "Alfabéticamente, Z-A" },
  { value: "price_asc",  label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
] as const;

/**
 * Devuelve un `sort` válido. Los enlaces viejos con `?sort=featured` o
 * `?sort=best_selling` —indexados o guardados en favoritos— caen en el default,
 * igual que hace el servidor, para que el menú marque la opción correcta.
 */
export function normalizeSort(value: string | null | undefined): string {
  return SORT_OPTIONS.some((o) => o.value === value) ? value! : DEFAULT_SORT;
}
