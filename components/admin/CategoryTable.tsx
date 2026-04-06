"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Plus, Tag } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  parent: { id: string; name: string } | null;
  _count: { children: number };
}

interface CategoryTableProps {
  categories: Category[];
}

export function CategoryTable({ categories }: CategoryTableProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", parentId: "" });

  const childrenOf = new Map<string | null, Category[]>();
  for (const cat of categories) {
    const key = cat.parentId ?? null;
    if (!childrenOf.has(key)) childrenOf.set(key, []);
    childrenOf.get(key)!.push(cat);
  }
  for (const list of childrenOf.values()) list.sort((a, b) => a.name.localeCompare(b.name));

  const parentOptions: { cat: Category; depth: number }[] = [];
  function walkCats(parentId: string | null, depth: number) {
    for (const cat of childrenOf.get(parentId) ?? []) {
      parentOptions.push({ cat, depth });
      walkCats(cat.id, depth + 1);
    }
  }
  walkCats(null, 0);
  const indent = (depth: number) => (depth > 0 ? "\u00a0".repeat(depth * 2) + "↳ " : "");

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", parentId: "" });
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, parentId: cat.parentId ?? "" });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editing ? `/api/categories/${editing.id}` : "/api/categories";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, parentId: form.parentId || null }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error desconocido");
      }
      toast.success(editing ? "Categoría actualizada" : "Categoría creada");
      setModalOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (cat._count.children > 0) {
      toast.error(`No se puede eliminar: tiene ${cat._count.children} subcategoría(s)`);
      return;
    }
    if (!confirm(`¿Eliminar la categoría "${cat.name}"?`)) return;
    const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Categoría eliminada");
      router.refresh();
    } else {
      const data = await res.json();
      toast.error(data.error || "Error al eliminar");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#111111]/6">
        <p className="text-[10px] text-[#111111]/40 uppercase tracking-[0.2em]">
          {categories.length} {categories.length === 1 ? "categoría" : "categorías"}
        </p>
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Nueva categoría
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-16 text-[#111111]/30">
          <Tag className="h-8 w-8 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-light" style={{ fontFamily: "var(--font-sans, sans-serif)" }}>
            No hay categorías todavía
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#111111]/6">
                <th className="text-left py-3 px-5 text-[9px] font-medium text-[#111111]/40 uppercase tracking-[0.2em]">
                  Nombre
                </th>
                <th className="text-left py-3 px-5 text-[9px] font-medium text-[#111111]/40 uppercase tracking-[0.2em]">
                  Categoría padre
                </th>
                <th className="text-center py-3 px-5 text-[9px] font-medium text-[#111111]/40 uppercase tracking-[0.2em]">
                  Subcategorías
                </th>
                <th className="py-3 px-5" />
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr
                  key={cat.id}
                  className="border-b border-[#111111]/4 hover:bg-[#f8f7f4]/60 transition-colors"
                >
                  <td className="py-3.5 px-5 font-medium text-[#111111]">{cat.name}</td>
                  <td className="py-3.5 px-5 text-[#111111]/50">
                    {cat.parent ? (
                      <span className="text-xs text-[#d4af37]">{cat.parent.name}</span>
                    ) : (
                      <span className="text-xs text-[#111111]/25">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-center text-sm text-[#111111]/50">
                    {cat._count.children > 0 ? cat._count.children : <span className="text-[#111111]/25">0</span>}
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(cat)}
                        className="p-1.5 text-[#111111]/30 hover:text-[#111111] hover:bg-[#f8f7f4] transition-colors"
                        title="Editar"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-1.5 text-[#111111]/30 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar categoría" : "Nueva categoría"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre *"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ej: Anillos"
            required
          />
          <div className="space-y-1.5">
            <label className="block text-[10px] font-medium text-[#111111]/60 uppercase tracking-[0.15em]">
              Categoría padre
            </label>
            <select
              value={form.parentId}
              onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-white border border-[#111111]/15 text-sm text-[#111111] focus:outline-none focus:border-[#d4af37] transition-colors appearance-none"
            >
              <option value="">Sin padre (categoría raíz)</option>
              {parentOptions
                .filter(({ cat }) => !editing || cat.id !== editing.id)
                .map(({ cat, depth }) => (
                  <option key={cat.id} value={cat.id}>
                    {indent(depth)}{cat.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" loading={loading}>
              {editing ? "Guardar cambios" : "Crear categoría"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
