"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Plus, Tag, GripVertical, Navigation, ChevronRight, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  parent: { id: string; name: string } | null;
  _count: { children: number };
}

interface CategoryTableProps {
  categories: Category[];
}

// ─── Panel 1: Root category row ───────────────────────────────────────────────

interface SortableMenuRowProps {
  cat: Category;
  childCount: number;
  expanded: boolean;
  onToggle: () => void;
}

function SortableMenuRow({ cat, childCount, expanded, onToggle }: SortableMenuRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-5 py-3.5 border-b border-[#111111]/4 hover:bg-[#f8f7f4]/50 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-[#111111]/20 hover:text-[#111111]/50 transition-colors touch-none flex-shrink-0"
        title="Arrastrar para reordenar"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <p className="flex-1 text-sm font-medium text-[#111111] leading-tight">{cat.name}</p>
      {childCount > 0 ? (
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 text-[10px] text-[#111111]/40 hover:text-[#111111]/70 bg-[#f8f7f4] hover:bg-[#f0ede6] px-2 py-0.5 transition-colors flex-shrink-0"
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {childCount} sub{childCount === 1 ? "cat." : "cats."}
        </button>
      ) : (
        <span className="text-[10px] text-[#111111]/25 bg-[#f8f7f4] px-2 py-0.5 flex-shrink-0">
          Sin subcats.
        </span>
      )}
    </div>
  );
}

// ─── Panel 1: Subcategory row ─────────────────────────────────────────────────

function SortableSubRow({ cat }: { cat: Category }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 pl-12 pr-5 py-2.5 border-b border-[#111111]/4 bg-[#fafaf8] hover:bg-[#f5f3ef] transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-[#111111]/20 hover:text-[#111111]/50 transition-colors touch-none flex-shrink-0"
        title="Arrastrar para reordenar"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <span className="text-[11px] text-[#111111]/40 flex-shrink-0">↳</span>
      <p className="flex-1 text-sm text-[#111111]/80">{cat.name}</p>
    </div>
  );
}

// ─── Panel 2: Full table row ──────────────────────────────────────────────────

interface SortableRowProps {
  cat: Category;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
}

function SortableRow({ cat, onEdit, onDelete }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: isDragging ? ("relative" as const) : undefined,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b border-[#111111]/4 hover:bg-[#f8f7f4]/60 transition-colors"
    >
      <td className="py-3.5 pl-3 pr-1 w-8">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-[#111111]/20 hover:text-[#111111]/50 transition-colors touch-none"
          title="Arrastrar para reordenar"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
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
            onClick={() => onEdit(cat)}
            className="p-1.5 text-[#111111]/30 hover:text-[#111111] hover:bg-[#f8f7f4] transition-colors"
            title="Editar"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(cat)}
            className="p-1.5 text-[#111111]/30 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CategoryTable({ categories }: CategoryTableProps) {
  const router = useRouter();
  const [items, setItems] = useState<Category[]>(categories);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", parentId: "" });

  const sensors = useSensors(useSensor(PointerSensor));

  // Derived maps
  const rootItems = items.filter((c) => c.parentId === null);
  const childrenOf = new Map<string | null, Category[]>();
  for (const cat of items) {
    const key = cat.parentId ?? null;
    if (!childrenOf.has(key)) childrenOf.set(key, []);
    childrenOf.get(key)!.push(cat);
  }

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Panel 1: reorder root categories ──
  const handleMenuDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = rootItems.findIndex((c) => c.id === active.id);
    const newIndex = rootItems.findIndex((c) => c.id === over.id);
    const newRootItems = arrayMove(rootItems, oldIndex, newIndex);
    const nonRootItems = items.filter((c) => c.parentId !== null);
    setItems([...newRootItems, ...nonRootItems]);

    try {
      const res = await fetch("/api/categories/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRootItems.map((c, idx) => ({ id: c.id, sortOrder: idx }))),
      });
      if (!res.ok) throw new Error();
      toast.success("Orden del menú guardado");
      router.refresh();
    } catch {
      toast.error("Error al guardar el orden");
      setItems(categories);
    }
  };

  // ── Panel 1: reorder subcategories within a parent ──
  const handleSubDragEnd = async (parentId: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const subs = childrenOf.get(parentId) ?? [];
    const oldIndex = subs.findIndex((c) => c.id === active.id);
    const newIndex = subs.findIndex((c) => c.id === over.id);
    const newSubs = arrayMove(subs, oldIndex, newIndex);

    setItems((prev) => {
      const others = prev.filter((c) => c.parentId !== parentId);
      return [...others, ...newSubs];
    });

    try {
      const res = await fetch("/api/categories/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSubs.map((c, idx) => ({ id: c.id, sortOrder: idx }))),
      });
      if (!res.ok) throw new Error();
      toast.success("Orden guardado");
      router.refresh();
    } catch {
      toast.error("Error al guardar el orden");
      setItems(categories);
    }
  };

  // ── Panel 2: reorder all categories in flat table ──
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((c) => c.id === active.id);
    const newIndex = items.findIndex((c) => c.id === over.id);
    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);

    try {
      const res = await fetch("/api/categories/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItems.map((c, idx) => ({ id: c.id, sortOrder: idx }))),
      });
      if (!res.ok) throw new Error();
      toast.success("Orden guardado");
      router.refresh();
    } catch {
      toast.error("Error al guardar el orden");
      setItems(categories);
    }
  };

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
      {/* ── Panel 1: Nav menu order ─────────────────────────────────────────── */}
      <div className="border-b border-[#111111]/8">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#111111]/6">
          <Navigation className="h-3.5 w-3.5 text-[#d4af37]" />
          <div>
            <p className="text-[10px] font-medium text-[#111111]/60 uppercase tracking-[0.2em]">
              Orden del menú de navegación
            </p>
            <p className="text-[10px] text-[#111111]/30 mt-0.5">
              Arrastrá para cambiar el orden en que aparecen en el header del sitio
            </p>
          </div>
        </div>

        {rootItems.length === 0 ? (
          <div className="px-5 py-6 text-[11px] text-[#111111]/30">Sin categorías raíz todavía</div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleMenuDragEnd}>
            <SortableContext items={rootItems.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              {rootItems.map((cat) => {
                const subs = childrenOf.get(cat.id) ?? [];
                const isExpanded = expanded.has(cat.id);
                return (
                  <div key={cat.id}>
                    <SortableMenuRow
                      cat={cat}
                      childCount={subs.length}
                      expanded={isExpanded}
                      onToggle={() => toggleExpand(cat.id)}
                    />
                    {isExpanded && subs.length > 0 && (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(e) => handleSubDragEnd(cat.id, e)}
                      >
                        <SortableContext items={subs.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                          {subs.map((sub) => (
                            <SortableSubRow key={sub.id} cat={sub} />
                          ))}
                        </SortableContext>
                      </DndContext>
                    )}
                  </div>
                );
              })}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* ── Panel 2: Full category table ────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#111111]/6">
        <div>
          <p className="text-[10px] text-[#111111]/40 uppercase tracking-[0.2em]">
            {items.length} {items.length === 1 ? "categoría" : "categorías"}
          </p>
          <p className="text-[10px] text-[#111111]/30 mt-0.5">Gestión completa de categorías y subcategorías</p>
        </div>
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Nueva categoría
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-[#111111]/30">
          <Tag className="h-8 w-8 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-light" style={{ fontFamily: "var(--font-sans, sans-serif)" }}>
            No hay categorías todavía
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#111111]/6">
                    <th className="py-3 pl-3 pr-1 w-8" />
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
                  {items.map((cat) => (
                    <SortableRow
                      key={cat.id}
                      cat={cat}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </SortableContext>
          </DndContext>
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
