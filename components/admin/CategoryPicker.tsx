"use client";

import { useMemo, useState } from "react";
import { Star, X } from "lucide-react";
import { construirArbol, type NodoArbol } from "@/lib/category-tree";

export type CategoriaElegible = {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
};

/**
 * Elige las categorías de un producto. La primera de `value` es la principal:
 * la que va a `Product.categoryId`, la que lee el POS y la que sale en la miga
 * de pan de la ficha. La estrella cambia cuál es.
 */
export function CategoryPicker({
  categories,
  value,
  onChange,
}: {
  categories: CategoriaElegible[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const [filtro, setFiltro] = useState("");
  const porId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const arbol = useMemo(() => construirArbol(categories), [categories]);

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  const hacerPrincipal = (id: string) => onChange([id, ...value.filter((v) => v !== id)]);

  const q = filtro.trim().toLowerCase();
  const coincide = (n: NodoArbol<CategoriaElegible>): boolean =>
    !q || n.name.toLowerCase().includes(q) || n.children.some(coincide);

  const fila = (n: NodoArbol<CategoriaElegible>, nivel: number) =>
    coincide(n) ? (
      <div key={n.id}>
        <label
          className="flex items-center gap-2 py-1.5 pr-2 text-sm cursor-pointer hover:bg-gray-50"
          style={{ paddingLeft: `${8 + nivel * 18}px` }}
        >
          <input
            type="checkbox"
            checked={value.includes(n.id)}
            onChange={() => toggle(n.id)}
            className="h-3.5 w-3.5 accent-[#111111]"
          />
          <span className={n.isActive ? "text-gray-800" : "text-gray-400"}>
            {n.name}
            {!n.isActive && <span className="ml-1 text-[10px] uppercase">(inactiva)</span>}
          </span>
        </label>
        {n.children.map((h) => fila(h, nivel + 1))}
      </div>
    ) : null;

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 min-h-[34px] mb-2">
        {value.length === 0 && <span className="text-xs text-gray-400 py-2">Sin categoría</span>}
        {value.map((id, i) => {
          const c = porId.get(id);
          return (
            <span
              key={id}
              className={`inline-flex items-center gap-1 pl-2 pr-1 py-1 text-xs rounded-md border ${
                i === 0 ? "border-[#d4af37] bg-[#d4af37]/10 text-[#111111]" : "border-gray-300 text-gray-700"
              }`}
            >
              <button
                type="button"
                onClick={() => hacerPrincipal(id)}
                title={i === 0 ? "Categoría principal" : "Hacer principal"}
                className={i === 0 ? "text-[#d4af37]" : "text-gray-300 hover:text-[#d4af37]"}
              >
                <Star className="h-3 w-3" fill={i === 0 ? "currentColor" : "none"} />
              </button>
              {c?.name ?? "(eliminada)"}
              <button
                type="button"
                onClick={() => toggle(id)}
                title="Quitar"
                className="p-0.5 text-gray-400 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          );
        })}
      </div>
      <div className="border border-gray-300 rounded-lg">
        <input
          type="search"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Buscar categoría…"
          className="w-full px-3 py-2 text-sm border-b border-gray-200 rounded-t-lg focus:outline-none"
        />
        <div className="max-h-48 overflow-y-auto py-1">
          {arbol.length === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-400">No hay categorías</p>
          ) : (
            arbol.map((n) => fila(n, 0))
          )}
        </div>
      </div>
      <p className="mt-1 text-xs text-gray-400">
        La de la estrella es la principal. El producto aparece en todas las marcadas y en sus categorías superiores.
      </p>
    </div>
  );
}
