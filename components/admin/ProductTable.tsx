"use client";

import Link from "next/link";
import Image from "next/image";
import { Edit, Trash2, Search, X, Tag, ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ProductWithCategory } from "@/types";
import { formatPEN, getPrimaryCategory } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Category } from "@/app/generated/prisma/client";
import { PosStockData } from "@/app/admin/productos/page";

type SortCol = "name" | "price";
type SortDir = "asc" | "desc";

interface ProductTableProps {
  products: ProductWithCategory[];
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
  const orderedCategories = sortedCategories(categories);
  const indent = (depth: number) => (depth > 0 ? "\u00a0".repeat(depth * 2) + "↳ " : "");
  const [query, setQuery] = useState("");
  const [sortCol, setSortCol] = useState<SortCol | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
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
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const uniqueCategories = Array.from(
    new Set(products.map((p) => p.category ?? "").filter(Boolean))
  ).sort();

  const q = query.trim().toLowerCase();
  let filtered = products.filter((p) => {
    if (q && !p.name.toLowerCase().includes(q) && !(p.category ?? "").toLowerCase().includes(q)) return false;
    if (filterCategory && (p.category ?? "") !== filterCategory) return false;
    if (filterStatus === "active" && !p.isActive) return false;
    if (filterStatus === "inactive" && p.isActive) return false;
    return true;
  });

  if (sortCol) {
    filtered = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortCol === "name") cmp = a.name.localeCompare(b.name);
      if (sortCol === "price") cmp = Number(a.price) - Number(b.price);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }

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
        <p className="text-[10px] text-[#111111]/40 uppercase tracking-[0.2em] shrink-0">
          {filtered.length} {filtered.length === 1 ? "producto" : "productos"}
          {products.length !== filtered.length && (
            <span className="ml-1 text-[#111111]/25">de {products.length}</span>
          )}
        </p>
        {(filterCategory || filterStatus !== "all") && (
          <button
            type="button"
            onClick={() => { setFilterCategory(""); setFilterStatus("all"); }}
            className="text-[9px] uppercase tracking-[0.15em] text-[#111111]/40 hover:text-[#111111] flex items-center gap-1 transition-colors"
          >
            <X className="h-2.5 w-2.5" /> Limpiar filtros
          </button>
        )}
        <div className="relative ml-auto w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#111111]/30 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, marca..."
            className="w-full pl-8 pr-7 py-1.5 text-[11px] bg-[#f8f7f4] border border-[#111111]/8 text-[#111111] placeholder-[#111111]/30 focus:outline-none focus:border-[#111111]/25 transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#111111]/30 hover:text-[#111111]/60"
            >
              <X className="h-3 w-3" />
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
                  className="inline-flex items-center gap-1 text-[9px] font-medium uppercase tracking-[0.2em] text-[#111111]/40 hover:text-[#111111]/70 transition-colors"
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
                  className="inline-flex items-center gap-1 text-[9px] font-medium uppercase tracking-[0.2em] text-[#111111]/40 hover:text-[#111111]/70 transition-colors ml-auto"
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
                <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-[#111111]/40">
                  Tienda
                </span>
              </th>

              {/* Stock Almacén POS */}
              <th className="text-right py-3 px-4">
                <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-[#111111]/40">
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
              const primaryCat = getPrimaryCategory(product);
              const isSelected = selectedIds.has(product.id);
              return (
                <tr
                  key={product.id}
                  className={cn(
                    "border-b border-[#111111]/4 hover:bg-[#f8f7f4]/60 transition-colors",
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
                      <div className="relative w-9 h-9 bg-[#f8f7f4] overflow-hidden flex-shrink-0">
                        {product.imageUrls?.[0] ?? product.imageUrl ? (
                          <Image
                            src={product.imageUrls?.[0] ?? product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="36px"
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
                  <td className="py-3.5 px-4 text-right font-medium text-sm">
                    {formatPEN(Number(product.price))}
                  </td>
                  {/* Stock Tienda POS */}
                  <td className="py-3.5 px-4 text-right">
                    {product.sku && posStock[product.sku] ? (() => {
                      const p = posStock[product.sku];
                      const total = p.stockHombre + p.stockMujer;
                      return (
                        <div className="text-right">
                          <span className={cn(
                            "text-sm font-medium",
                            total === 0 ? "text-red-500" : total < 5 ? "text-amber-600" : "text-[#111111]/70"
                          )}>
                            {total}
                          </span>
                          {product.esPar && total > 0 && (
                            <p className="text-[10px] text-[#111111]/35 leading-tight">
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
                      const total = p.stockAlmacenHombre + p.stockAlmacenMujer;
                      return (
                        <div className="text-right">
                          <span className={cn(
                            "text-sm font-medium",
                            total === 0 ? "text-[#111111]/30" : "text-[#111111]/70"
                          )}>
                            {total}
                          </span>
                          {product.esPar && total > 0 && (
                            <p className="text-[10px] text-[#111111]/35 leading-tight">
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
                        className="p-1.5 text-[#111111]/30 hover:text-[#111111] hover:bg-[#f8f7f4] transition-colors"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="p-1.5 text-[#111111]/30 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
