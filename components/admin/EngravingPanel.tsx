"use client";

import { useState } from "react";
import { toast } from "sonner";

type Product = { id: string; name: string; category?: string | null; engravingEnabled: boolean };
type Category = { id: string; name: string };
type Scope = "all" | "category" | "product";

interface Props {
  products: Product[];
  categories: Category[];
}

export function EngravingPanel({ products: initialProducts, categories }: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [scope, setScope] = useState<Scope>("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const engravingCount = products.filter((p) => p.engravingEnabled).length;

  async function refresh() {
    const res = await fetch("/api/products?admin=1&limit=500");
    if (res.ok) {
      const data = await res.json();
      setProducts(data.products);
    }
  }

  async function applyAll(enabled: boolean) {
    setSaving(true);
    try {
      const res = await fetch("/api/products/engraving/all", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engravingEnabled: enabled }),
      });
      if (!res.ok) throw new Error();
      await refresh();
      toast.success(enabled ? "Grabado activado en todos los productos" : "Grabado desactivado en todos los productos");
    } catch {
      toast.error("Error al aplicar cambios");
    } finally {
      setSaving(false);
    }
  }

  async function applyCategory(enabled: boolean) {
    if (selectedCategories.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/products/engraving/category", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engravingEnabled: enabled, categories: selectedCategories }),
      });
      if (!res.ok) throw new Error();
      await refresh();
      setSelectedCategories([]);
      toast.success(enabled ? "Grabado activado en categorías seleccionadas" : "Grabado desactivado en categorías seleccionadas");
    } catch {
      toast.error("Error al aplicar cambios");
    } finally {
      setSaving(false);
    }
  }

  async function applyBulk(enabled: boolean) {
    if (selectedProductIds.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/products/engraving/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engravingEnabled: enabled, productIds: selectedProductIds }),
      });
      if (!res.ok) throw new Error();
      await refresh();
      setSelectedProductIds([]);
      toast.success(enabled ? "Grabado activado en productos seleccionados" : "Grabado desactivado en productos seleccionados");
    } catch {
      toast.error("Error al aplicar cambios");
    } finally {
      setSaving(false);
    }
  }

  const filteredProducts = search.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()))
    : products;

  const scopeLabels: Record<Scope, string> = {
    all: "Todos los productos",
    category: "Por categoría",
    product: "Por producto",
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <p className="text-sm text-gray-500">
          <span className="text-2xl font-semibold text-[#111111]">{engravingCount}</span>
          <span className="mx-1.5 text-gray-300">/</span>
          <span className="text-lg font-medium text-gray-400">{products.length}</span>
          <span className="ml-2">productos con grabado activo</span>
        </p>
        <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#111111] rounded-full transition-all duration-500"
            style={{ width: products.length ? `${(engravingCount / products.length) * 100}%` : "0%" }}
          />
        </div>
      </div>

      {/* Scope selector + actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-100">
          {(["all", "category", "product"] as Scope[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScope(s)}
              className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                scope === s
                  ? "border-[#111111] text-[#111111]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {scopeLabels[s]}
            </button>
          ))}
        </div>

        {/* All */}
        {scope === "all" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Activa o desactiva la opción de grabado personalizado en todos los productos de la tienda de una vez.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => applyAll(true)}
                disabled={saving}
                className="px-5 py-2.5 bg-[#111111] text-white text-sm font-medium rounded-lg hover:bg-[#333] disabled:opacity-50 transition-colors"
              >
                Activar en todos
              </button>
              <button
                type="button"
                onClick={() => applyAll(false)}
                disabled={saving}
                className="px-5 py-2.5 border border-gray-200 text-sm font-medium rounded-lg hover:border-gray-400 disabled:opacity-50 transition-colors"
              >
                Desactivar en todos
              </button>
            </div>
          </div>
        )}

        {/* Category */}
        {scope === "category" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Selecciona las categorías para aplicar el cambio:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => {
                const checked = selectedCategories.includes(cat.name);
                const count = products.filter((p) => p.category === cat.name && p.engravingEnabled).length;
                const total = products.filter((p) => p.category === cat.name).length;
                return (
                  <label
                    key={cat.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      checked ? "border-[#111111] bg-gray-50" : "border-gray-100 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedCategories((prev) =>
                          prev.includes(cat.name) ? prev.filter((x) => x !== cat.name) : [...prev, cat.name]
                        )
                      }
                      className="accent-[#111111]"
                    />
                    <div>
                      <p className="text-sm font-medium text-[#111111]">{cat.name}</p>
                      <p className="text-xs text-gray-400">{count}/{total} con grabado</p>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => applyCategory(true)}
                disabled={saving || selectedCategories.length === 0}
                className="px-5 py-2.5 bg-[#111111] text-white text-sm font-medium rounded-lg hover:bg-[#333] disabled:opacity-50 transition-colors"
              >
                Activar en seleccionadas
              </button>
              <button
                type="button"
                onClick={() => applyCategory(false)}
                disabled={saving || selectedCategories.length === 0}
                className="px-5 py-2.5 border border-gray-200 text-sm font-medium rounded-lg hover:border-gray-400 disabled:opacity-50 transition-colors"
              >
                Desactivar en seleccionadas
              </button>
            </div>
          </div>
        )}

        {/* Product */}
        {scope === "product" && (
          <div className="space-y-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full max-w-sm px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
            />
            <div className="border border-gray-100 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <p className="p-4 text-sm text-gray-400 text-center">No se encontraron productos.</p>
              ) : (
                filteredProducts.map((p) => {
                  const checked = selectedProductIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-50 last:border-0 transition-colors ${
                        checked ? "bg-gray-50" : "hover:bg-gray-50/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelectedProductIds((prev) =>
                            prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id]
                          )
                        }
                        className="accent-[#111111]"
                      />
                      <span className="flex-1 text-sm text-[#111111]">{p.name}</span>
                      {p.category && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {p.category}
                        </span>
                      )}
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          p.engravingEnabled
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {p.engravingEnabled ? "Activo" : "Inactivo"}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
            <div className="flex gap-3 items-center">
              <button
                type="button"
                onClick={() => applyBulk(true)}
                disabled={saving || selectedProductIds.length === 0}
                className="px-5 py-2.5 bg-[#111111] text-white text-sm font-medium rounded-lg hover:bg-[#333] disabled:opacity-50 transition-colors"
              >
                Activar en seleccionados
              </button>
              <button
                type="button"
                onClick={() => applyBulk(false)}
                disabled={saving || selectedProductIds.length === 0}
                className="px-5 py-2.5 border border-gray-200 text-sm font-medium rounded-lg hover:border-gray-400 disabled:opacity-50 transition-colors"
              >
                Desactivar en seleccionados
              </button>
              {selectedProductIds.length > 0 && (
                <span className="text-sm text-gray-400">{selectedProductIds.length} seleccionados</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
