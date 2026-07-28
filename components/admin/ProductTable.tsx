"use client";

import Link from "next/link";
import Image from "next/image";
import { Edit, Trash2, Search, X, Tag, ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useMemo } from "react";
import { formatPEN, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Category } from "@/app/generated/prisma/client";
import { PosStockData, AdminProductRow } from "@/app/admin/productos/page";
import { getSearchClient, INDEX_NAME } from "@/lib/algolia";
import { productThumbnail } from "@/lib/media";

type SortCol = "name" | "price";
type SortDir = "asc" | "desc";

const LOW_STOCK_THRESHOLD = 5;

/** Stock total en tienda (POS). null si el producto no está vinculado al POS por SKU. */
function storeStock(p: AdminProductRow, posStock: Record<string, PosStockData>): number | null {
  const s = p.sku ? posStock[p.sku] : undefined;
  if (!s) return null;
  return p.esPar ? s.stockHombre + s.stockMujer : s.stockHombre;
}

interface ProductTableProps {
  products: AdminProductRow[];
  categories?: Category[];
  posStock?: Record<string, PosStockData>;
}

function sortedCategories(cats: Category[]): { cat: Category; depth: number }[] {
  const childrenOf = new Map<string | null, Category[]>();
  for (const cat of cats) {
    const key = cat.parentId ?? null;
    if (!childrenOf.has(key)) childrenOf.set(key, []);
    childrenOf.get(key)!.push(cat);
  }
  for (const list of childrenOf.values()) list.sort((a, b) => a.name.localeCompare(b.name));

  const result: { cat: Category; depth: number }[] = [];
  function walk(parentId: string | null, depth: number) {
    for (const cat of childrenOf.get(parentId) ?? []) {
      result.push({ cat, depth });
      walk(cat.id, depth + 1);
    }
  }
  walk(null, 0);
  return result;
}

export function ProductTable({ products, categories = [], posStock = {} }: ProductTableProps) {
  const router = useRouter();
  const orderedCategories = useMemo(() => sortedCategories(categories), [categories]);
  const indent = (depth: number) => (depth > 0 ? "\u00a0".repeat(depth * 2) + "↳ " : "");
  const [query, setQuery] = useState("");
  const [sortCol, setSortCol] = useState<SortCol | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [filterStock, setFilterStock] = useState<"all" | "out" | "low">("all");
  const [catOpen, setCatOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const catRef = useRef<HTMLTableCellElement>(null);
  const statusRef = useRef<HTMLTableCellElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPanelOpen, setBulkPanelOpen] = useState(false);
  const [bulkCategoryIds, setBulkCategoryIds] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState<"add" | "set" | "remove">("add");
  const [bulkPrimaryId, setBulkPrimaryId] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [algoliaIds, setAlgoliaIds] = useState<Set<string> | null>(null);
  const [algoliaLoading, setAlgoliaLoading] = useState(false);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"?`)) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Producto eliminado");
      router.refresh();
    } else {
      toast.error("Error al eliminar");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setBulkPanelOpen(false);
  };

  const toggleBulkCategory = (id: string) => {
    setBulkCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const applyBulk = async () => {
    if (bulkCategoryIds.length === 0) {
      toast.error("Selecciona al menos una categoría");
      return;
    }
    setBulkLoading(true);
    try {
      const res = await fetch("/api/products/bulk-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: Array.from(selectedIds),
          categoryIds: bulkCategoryIds,
          mode: bulkMode,
          ...(bulkPrimaryId ? { primaryCategoryId: bulkPrimaryId } : {}),
        }),
      });
      if (!res.ok) {
        toast.error("Error al actualizar categorías");
        return;
      }
      toast.success(`Categorías actualizadas en ${selectedIds.size} productos`);
      clearSelection();
      setBulkCategoryIds([]);
      setBulkPrimaryId("");
      router.refresh();
    } catch {
      toast.error("Error inesperado");
    } finally {
      setBulkLoading(false);
    }
  };

  // Close panel / dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setBulkPanelOpen(false);
      }
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatOpen(false);
      }
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setBulkPanelOpen(false);
        setCatOpen(false);
        setStatusOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setAlgoliaIds(null);
      return;
    }
    const timer = setTimeout(async () => {
      setAlgoliaLoading(true);
      try {
        const results = await getSearchClient().searchSingleIndex({
          indexName: INDEX_NAME,
          searchParams: { query: trimmed, hitsPerPage: 200, attributesToRetrieve: ["objectID"] },
        });
        setAlgoliaIds(new Set(results.hits.map((h) => h.objectID as string)));
      } catch {
        setAlgoliaIds(null);
      } finally {
        setAlgoliaLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const uniqueCategories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category ?? "").filter(Boolean))).sort(),
    [products]
  );

  const filtered = useMemo(() => {
    const result = products.filter((p) => {
      if (algoliaIds !== null && !algoliaIds.has(p.id)) return false;
      if (filterCategory && (p.category ?? "") !== filterCategory) return false;
      if (filterStatus === "active" && !p.isActive) return false;
      if (filterStatus === "inactive" && p.isActive) return false;
      if (filterStock !== "all") {
        const stock = storeStock(p, posStock);
        if (stock === null) return false;
        if (filterStock === "out" && stock !== 0) return false;
        if (filterStock === "low" && !(stock > 0 && stock < LOW_STOCK_THRESHOLD)) return false;
      }
      return true;
    });

    if (sortCol) {
      result.sort((a, b) => {
        let cmp = 0;
        if (sortCol === "name") cmp = a.name.localeCompare(b.name);
        if (sortCol === "price") cmp = a.price - b.price;
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return result;
  }, [products, algoliaIds, filterCategory, filterStatus, filterStock, sortCol, sortDir, posStock]);

  const stockSummary = useMemo(() => {
    let out = 0;
    let low = 0;
    for (const p of products) {
      const stock = storeStock(p, posStock);
      if (stock === null) continue;
      if (stock === 0) out++;
      else if (stock < LOW_STOCK_THRESHOLD) low++;
    }
    return { out, low };
  }, [products, posStock]);

  if (products.length === 0) {
    return (
      <div className="text-center py-16 text-[#111111]/30">
        <p className="text-sm font-light" style={{ fontFamily: "var(--font-sans, sans-serif)" }}>
          No hay productos todavía
        </p>
      </div>
    );
  }

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < filtered.length;

  return (
    <div>
      <div className="px-5 py-4 border-b border-[#111111]/6 flex items-center gap-4">
        <p className="text-[11px] text-[#111111]/40 uppercase tracking-[0.2em] shrink-0 tabular-nums">
          {filtered.length} {filtered.length === 1 ? "producto" : "productos"}
          {products.length !== filtered.length && (
            <span className="ml-1 text-[#111111]/25">de {products.length}</span>
          )}
        </p>
        {(filterCategory || filterStatus !== "all" || filterStock !== "all") && (
          <button
            type="button"
            onClick={() => { setFilterCategory(""); setFilterStatus("all"); setFilterStock("all"); }}
            className="text-[11px] uppercase tracking-[0.15em] text-[#111111]/40 hover:text-[#111111] flex items-center gap-1 transition-[color] duration-150"
            aria-label="Limpiar filtros activos"
          >
            <X className="h-2.5 w-2.5" aria-hidden="true" /> Limpiar filtros
          </button>
        )}

        {/* Resumen de stock (tienda) — clic para filtrar */}
        {stockSummary.out > 0 && (
          <button
            type="button"
            onClick={() => setFilterStock((s) => (s === "out" ? "all" : "out"))}
            aria-pressed={filterStock === "out"}
            className={cn(
              "text-[11px] tabular-nums px-2 py-1 rounded-full border transition-colors",
              filterStock === "out"
                ? "bg-red-500 text-white border-red-500"
                : "border-red-200 text-red-600 hover:bg-red-50"
            )}
          >
            {stockSummary.out} sin stock
          </button>
        )}
        {stockSummary.low > 0 && (
          <button
            type="button"
            onClick={() => setFilterStock((s) => (s === "low" ? "all" : "low"))}
            aria-pressed={filterStock === "low"}
            className={cn(
              "text-[11px] tabular-nums px-2 py-1 rounded-full border transition-colors",
              filterStock === "low"
                ? "bg-amber-500 text-white border-amber-500"
                : "border-amber-200 text-amber-700 hover:bg-amber-50"
            )}
          >
            {stockSummary.low} stock bajo
          </button>
        )}

        <div className="relative ml-auto w-56">
          {algoliaLoading ? (
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 border border-[#111111]/30 border-t-[#111111]/60 rounded-full animate-spin" aria-hidden="true" />
          ) : (
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#111111]/30 pointer-events-none" aria-hidden="true" />
          )}
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar con Algolia…"
            aria-label="Buscar productos"
            className="w-full pl-8 pr-7 py-1.5 text-[11px] bg-[#f8f7f4] border border-[#111111]/8 text-[#111111] placeholder-[#111111]/30 focus:outline-none focus:border-[#111111]/25 transition-[border-color] duration-150"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#111111]/30 hover:text-[#111111]/60 transition-[color] duration-150"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="relative px-5 py-3 bg-[#111111] flex items-center gap-3">
          <span className="text-[11px] text-white/70 uppercase tracking-[0.15em]">
            {selectedIds.size} {selectedIds.size === 1 ? "producto seleccionado" : "productos seleccionados"}
          </span>

          <div className="relative ml-2" ref={panelRef}>
            <button
              type="button"
              onClick={() => setBulkPanelOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] uppercase tracking-[0.1em] transition-colors"
            >
              <Tag className="h-3 w-3" />
              Editar categorías
              <ChevronDown className="h-3 w-3" />
            </button>

            {bulkPanelOpen && (
              <div className="absolute top-full left-0 mt-1 w-96 bg-white border border-gray-200 shadow-xl z-20 p-5 space-y-4">
                <p className="text-xs font-semibold text-[#111111] uppercase tracking-[0.15em]">
                  Categorías
                </p>
                <div className="space-y-0.5 max-h-64 overflow-y-auto">
                  {orderedCategories.map(({ cat, depth }) => {
                    const selected = bulkCategoryIds.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleBulkCategory(cat.id)}
                        className={`w-full text-left px-2 py-1.5 text-sm transition-colors rounded ${
                          selected
                            ? "bg-[#d4af37]/40 text-[#111111] font-medium"
                            : "text-gray-500 hover:bg-[#d4af37]/25 hover:text-[#111111]"
                        }`}
                        style={{ paddingLeft: `${8 + depth * 16}px` }}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#111111] uppercase tracking-[0.15em] mb-1.5">
                    Modo
                  </p>
                  <div className="flex gap-2">
                    {(["add", "set", "remove"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setBulkMode(m)}
                        className={`flex-1 py-1 text-[10px] uppercase tracking-[0.1em] border transition-colors ${
                          bulkMode === m
                            ? "bg-[#111111] text-white border-[#111111]"
                            : "border-gray-200 text-gray-500 hover:border-gray-400"
                        }`}
                      >
                        {m === "add" ? "Agregar" : m === "set" ? "Reemplazar" : "Quitar"}
                      </button>
                    ))}
                  </div>
                </div>

                {orderedCategories.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[#111111] uppercase tracking-[0.15em] mb-1.5">
                      Marcar como primaria (opcional)
                    </p>
                    <select
                      value={bulkPrimaryId}
                      onChange={(e) => setBulkPrimaryId(e.target.value)}
                      className="w-full text-xs border border-gray-200 px-2 py-1.5 focus:outline-none focus:border-[#111111]"
                    >
                      <option value="">— Sin cambio —</option>
                      {orderedCategories.map(({ cat, depth }) => (
                        <option key={cat.id} value={cat.id}>{indent(depth)}{cat.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  onClick={applyBulk}
                  disabled={bulkLoading}
                  className="w-full py-2 bg-[#111111] text-white text-[11px] uppercase tracking-[0.1em] hover:bg-[#333] transition-colors disabled:opacity-50"
                >
                  {bulkLoading ? "Aplicando..." : "Aplicar"}
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={clearSelection}
            className="ml-auto text-white/40 hover:text-white transition-colors"
            aria-label="Limpiar selección"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#111111]/6">
              <th className="py-3 px-4 w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={toggleAll}
                  className="accent-[#111111]"
                />
              </th>

              {/* Producto — sortable */}
              <th className="text-left py-3 px-4">
                <button
                  type="button"
                  onClick={() => toggleSort("name")}
                  className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.2em] text-[#111111]/40 hover:text-[#111111]/70 transition-[color] duration-150"
                >
                  Producto
                  {sortCol === "name" ? (
                    sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronsUpDown className="h-3 w-3 opacity-40" />
                  )}
                </button>
              </th>

              {/* Categoría — dropdown filter */}
              <th className="text-left py-3 px-4 relative" ref={catRef}>
                <button
                  type="button"
                  onClick={() => { setCatOpen((v) => !v); setStatusOpen(false); }}
                  className={cn(
                    "inline-flex items-center gap-1 text-[9px] font-medium uppercase tracking-[0.2em] transition-colors",
                    filterCategory ? "text-[#111111]" : "text-[#111111]/40 hover:text-[#111111]/70"
                  )}
                >
                  {filterCategory || "Categoría"}
                  <ChevronDown className={cn("h-3 w-3 transition-transform", catOpen && "rotate-180")} />
                </button>
                {catOpen && (
                  <div className="absolute top-full left-0 mt-1 min-w-[160px] bg-white border border-[#111111]/10 shadow-lg z-20 py-1">
                    <button
                      type="button"
                      onClick={() => { setFilterCategory(""); setCatOpen(false); }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-[11px] transition-colors",
                        !filterCategory ? "text-[#111111] font-semibold" : "text-[#111111]/50 hover:text-[#111111] hover:bg-[#f8f7f4]"
                      )}
                    >
                      Todas
                    </button>
                    {uniqueCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => { setFilterCategory(cat); setCatOpen(false); }}
                        className={cn(
                          "w-full text-left px-3 py-1.5 text-[11px] transition-colors",
                          filterCategory === cat
                            ? "text-[#111111] font-semibold bg-[#f8f7f4]"
                            : "text-[#111111]/50 hover:text-[#111111] hover:bg-[#f8f7f4]"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </th>

              {/* Precio — sortable */}
              <th className="text-right py-3 px-4">
                <button
                  type="button"
                  onClick={() => toggleSort("price")}
                  className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.2em] text-[#111111]/40 hover:text-[#111111]/70 transition-colors ml-auto"
                >
                  Precio
                  {sortCol === "price" ? (
                    sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronsUpDown className="h-3 w-3 opacity-40" />
                  )}
                </button>
              </th>

              {/* Stock Tienda POS */}
              <th className="text-right py-3 px-4">
                <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#111111]/40">
                  Tienda
                </span>
              </th>

              {/* Stock Almacén POS */}
              <th className="text-right py-3 px-4">
                <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#111111]/40">
                  Almacén
                </span>
              </th>

              {/* Estado — dropdown filter */}
              <th className="text-center py-3 px-4 relative" ref={statusRef}>
                <button
                  type="button"
                  onClick={() => { setStatusOpen((v) => !v); setCatOpen(false); }}
                  className={cn(
                    "inline-flex items-center gap-1 text-[9px] font-medium uppercase tracking-[0.2em] transition-colors mx-auto",
                    filterStatus !== "all" ? "text-[#111111]" : "text-[#111111]/40 hover:text-[#111111]/70"
                  )}
                >
                  {filterStatus === "all" ? "Estado" : filterStatus === "active" ? "Activo" : "Inactivo"}
                  <ChevronDown className={cn("h-3 w-3 transition-transform", statusOpen && "rotate-180")} />
                </button>
                {statusOpen && (
                  <div className="absolute top-full right-0 mt-1 w-32 bg-white border border-[#111111]/10 shadow-lg z-20 py-1">
                    {(["all", "active", "inactive"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => { setFilterStatus(s); setStatusOpen(false); }}
                        className={cn(
                          "w-full text-left px-3 py-1.5 text-[11px] transition-colors",
                          filterStatus === s
                            ? "text-[#111111] font-semibold bg-[#f8f7f4]"
                            : "text-[#111111]/50 hover:text-[#111111] hover:bg-[#f8f7f4]"
                        )}
                      >
                        {s === "all" ? "Todos" : s === "active" ? "Activo" : "Inactivo"}
                      </button>
                    ))}
                  </div>
                )}
              </th>

              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[11px] text-[#111111]/30">
                  Sin resultados para &ldquo;{query}&rdquo;
                </td>
              </tr>
            )}
            {filtered.map((product) => {
              const isSelected = selectedIds.has(product.id);
              return (
                <tr
                  key={product.id}
                  className={cn(
                    "border-b border-[#111111]/4 hover:bg-[#f8f7f4]/60 transition-[background-color] duration-150",
                    isSelected && "bg-[#f8f7f4]"
                  )}
                >
                  <td className="py-3.5 px-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(product.id)}
                      className="accent-[#111111]"
                    />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-20 h-20 bg-[#f8f7f4] overflow-hidden flex-shrink-0">
                        {productThumbnail(product) ? (
                          <Image
                            src={productThumbnail(product)!}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-[#111111]/20 text-xs">
                            —
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-[#111111] text-sm line-clamp-1">{product.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[#111111]/55 text-sm">
                    {product.category ?? "—"}
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-sm tabular-nums">
                    {formatPEN(product.price)}
                  </td>
                  {/* Stock Tienda POS */}
                  <td className="py-3.5 px-4 text-right">
                    {product.sku && posStock[product.sku] ? (() => {
                      const p = posStock[product.sku];
                      const total = product.esPar ? p.stockHombre + p.stockMujer : p.stockHombre;
                      return (
                        <div className="text-right">
                          <span className={cn(
                            "text-sm font-medium",
                            total === 0 ? "text-red-500" : total < 5 ? "text-amber-600" : "text-[#111111]/70"
                          )}>
                            {total}
                          </span>
                          {product.esPar && total > 0 && (
                            <p className="text-xs text-[#111111]/35 leading-tight tabular-nums">
                              H:{p.stockHombre} / M:{p.stockMujer}
                            </p>
                          )}
                        </div>
                      );
                    })() : <span className="text-[#111111]/20 text-sm">—</span>}
                  </td>
                  {/* Stock Almacén POS */}
                  <td className="py-3.5 px-4 text-right">
                    {product.sku && posStock[product.sku] ? (() => {
                      const p = posStock[product.sku];
                      const total = product.esPar ? p.stockAlmacenHombre + p.stockAlmacenMujer : p.stockAlmacenHombre;
                      return (
                        <div className="text-right">
                          <span className={cn(
                            "text-sm font-medium",
                            total === 0 ? "text-[#111111]/30" : "text-[#111111]/70"
                          )}>
                            {total}
                          </span>
                          {product.esPar && total > 0 && (
                            <p className="text-xs text-[#111111]/35 leading-tight tabular-nums">
                              H:{p.stockAlmacenHombre} / M:{p.stockAlmacenMujer}
                            </p>
                          )}
                        </div>
                      );
                    })() : <span className="text-[#111111]/20 text-sm">—</span>}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge variant={product.isActive ? "success" : "default"}>
                      {product.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/productos/${product.id}/editar`}
                        className="p-1.5 text-[#111111]/30 hover:text-[#111111] hover:bg-[#f8f7f4] transition-[color,background-color] duration-150 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/20"
                        aria-label={`Editar ${product.name}`}
                      >
                        <Edit className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="p-1.5 text-[#111111]/30 hover:text-red-500 hover:bg-red-50 transition-[color,background-color] duration-150 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 touch-manipulation"
                        aria-label={`Eliminar ${product.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
