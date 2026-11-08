"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ImageManager } from "@/components/admin/ImageManager";
import { formatPEN, precioConOferta, slugFromName } from "@/lib/utils";
import { productThumbnail } from "@/lib/media";
import { MAX_NIVEL, motivoParaNoBorrar, padresPosibles } from "@/lib/category-tree";

export type CategoriaAdmin = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  image: string | null;
  banner: string | null;
  parentId: string | null;
  level: number;
  sortOrder: number;
  isActive: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  path: string;
  productCount: number;
  totalProductCount: number;
  children: CategoriaAdmin[];
};

interface ProductItem {
  id: string;
  name: string;
  sku: string | null;
  price: string | number;
  comparePrice?: string | number | null;
  isActive: boolean;
  imageUrl: string | null;
  imageUrls: string[];
}

type Estado = "all" | "active" | "inactive";

type Form = {
  name: string;
  slug: string;
  parentId: string;
  description: string;
  image: string | null;
  banner: string | null;
  isActive: boolean;
  metaTitle: string;
  metaDescription: string;
};

const FORM_VACIO: Form = {
  name: "",
  slug: "",
  parentId: "",
  description: "",
  image: null,
  banner: null,
  isActive: true,
  metaTitle: "",
  metaDescription: "",
};

function aplanar(nodos: CategoriaAdmin[]): CategoriaAdmin[] {
  return nodos.flatMap((n) => [n, ...aplanar(n.children)]);
}

const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

async function pedir(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Error desconocido");
  return data;
}

// ─── Fila del árbol ───────────────────────────────────────────────────────────

type FilaProps = {
  nodo: CategoriaAdmin;
  depth: number;
  arrastrable: boolean;
  expandida: boolean;
  seleccionada: boolean;
  onToggleExpand: () => void;
  onToggleSelect: () => void;
  onEdit: () => void;
  onAddChild: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  onProducts: () => void;
  children?: React.ReactNode;
};

function Fila({
  nodo,
  depth,
  arrastrable,
  expandida,
  seleccionada,
  onToggleExpand,
  onToggleSelect,
  onEdit,
  onAddChild,
  onToggleActive,
  onDelete,
  onProducts,
  children,
}: FilaProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: nodo.id,
    disabled: !arrastrable,
  });
  const bloqueo = motivoParaNoBorrar(nodo.children.length, nodo.productCount);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: "relative",
        zIndex: isDragging ? 20 : undefined,
      }}
    >
      <div
        className={`group flex items-center gap-2 pr-4 py-2.5 border-b border-[#111111]/5 transition-colors ${
          seleccionada ? "bg-[#d4af37]/8" : depth > 0 ? "bg-[#f8f7f4]/40 hover:bg-[#f8f7f4]" : "bg-white hover:bg-[#f8f7f4]/60"
        }`}
        style={{ paddingLeft: `${12 + depth * 28}px` }}
      >
        <input
          type="checkbox"
          checked={seleccionada}
          onChange={onToggleSelect}
          aria-label={`Seleccionar ${nodo.name}`}
          className="h-3.5 w-3.5 accent-[#d4af37] cursor-pointer shrink-0"
        />
        <button
          type="button"
          {...attributes}
          {...listeners}
          disabled={!arrastrable}
          className="cursor-grab active:cursor-grabbing text-[#111111]/20 hover:text-[#111111]/50 disabled:cursor-default disabled:opacity-30 touch-none shrink-0"
          title={arrastrable ? "Arrastrar para reordenar entre hermanas" : "Limpia la búsqueda y el filtro para reordenar"}
          aria-label="Reordenar"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToggleExpand}
          disabled={nodo.children.length === 0}
          className="w-4 shrink-0 text-[#111111]/40 hover:text-[#111111] disabled:invisible"
          aria-label={expandida ? "Contraer" : "Expandir"}
          aria-expanded={expandida}
        >
          {expandida ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>

        <div className="relative w-8 h-8 shrink-0 bg-[#f8f7f4] overflow-hidden flex items-center justify-center">
          {nodo.image ? (
            <Image src={nodo.image} alt="" fill sizes="32px" className="object-cover" />
          ) : (
            <Tag className="h-3.5 w-3.5 text-[#111111]/20" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-tight truncate ${nodo.isActive ? "text-[#111111]" : "text-[#111111]/40 line-through decoration-[#111111]/20"}`}>
            {nodo.name}
          </p>
          <p className="text-[10px] text-[#111111]/35 truncate">{nodo.path}</p>
        </div>

        <span className="hidden sm:inline text-[9px] uppercase tracking-wider text-[#111111]/40 bg-[#f8f7f4] px-1.5 py-0.5 shrink-0">
          Nivel {nodo.level}
        </span>

        <button
          type="button"
          onClick={onProducts}
          disabled={nodo.totalProductCount === 0}
          className="w-20 text-right text-xs tabular-nums shrink-0 text-[#111111] hover:text-[#d4af37] disabled:text-[#111111]/25 disabled:hover:text-[#111111]/25"
          title="Directos (con subcategorías)"
        >
          {nodo.productCount}
          {nodo.totalProductCount !== nodo.productCount && (
            <span className="text-[#111111]/40"> ({nodo.totalProductCount})</span>
          )}
        </button>

        <button
          type="button"
          onClick={onToggleActive}
          className={`w-20 text-[10px] font-medium px-2 py-0.5 shrink-0 transition-colors ${
            nodo.isActive
              ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
              : "text-[#111111]/40 bg-[#f8f7f4] hover:bg-[#111111]/8"
          }`}
          title={nodo.isActive ? "Desactivar: se oculta de la tienda con sus subcategorías" : "Activar"}
        >
          {nodo.isActive ? "Activa" : "Inactiva"}
        </button>

        <div className="flex items-center gap-0.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
          {nodo.level < MAX_NIVEL && (
            <button type="button" onClick={onAddChild} className="p-1.5 text-[#111111]/30 hover:text-[#111111] hover:bg-white" title="Nueva subcategoría">
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
          {nodo.isActive && (
            <a href={nodo.path} target="_blank" rel="noreferrer" className="p-1.5 text-[#111111]/30 hover:text-[#111111] hover:bg-white" title="Ver en la tienda">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <button type="button" onClick={onEdit} className="p-1.5 text-[#111111]/30 hover:text-[#111111] hover:bg-white" title="Editar">
            <Edit className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 text-[#111111]/30 hover:text-red-500 hover:bg-red-50"
            title={bloqueo ?? "Eliminar"}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

export function CategoryTable({ tree }: { tree: CategoriaAdmin[] }) {
  const router = useRouter();
  const [arbol, setArbol] = useState(tree);
  useEffect(() => setArbol(tree), [tree]);

  const planas = useMemo(() => aplanar(arbol), [arbol]);
  const porId = useMemo(() => new Map(planas.map((c) => [c.id, c])), [planas]);

  const [expandidas, setExpandidas] = useState<Set<string>>(() => new Set(tree.map((c) => c.id)));
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState<Estado>("all");
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [borrandoLote, setBorrandoLote] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<CategoriaAdmin | null>(null);
  const [form, setForm] = useState<Form>(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);

  const [productos, setProductos] = useState<{ categoria: CategoriaAdmin; items: ProductItem[]; total: number } | null>(null);
  const [cargandoProductos, setCargandoProductos] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Búsqueda y filtro: una fila se ve si coincide ella o alguna descendiente.
  const filtrando = busqueda.trim() !== "" || estado !== "all";
  const visibles = useMemo(() => {
    if (!filtrando) return null;
    const q = normalizar(busqueda.trim());
    const ok = new Set<string>();
    const recorrer = (n: CategoriaAdmin): boolean => {
      const propia =
        (!q || normalizar(`${n.name} ${n.slug ?? ""}`).includes(q)) &&
        (estado === "all" || (estado === "active") === n.isActive);
      const alguna = n.children.map(recorrer).some(Boolean);
      if (propia || alguna) ok.add(n.id);
      return propia || alguna;
    };
    arbol.forEach(recorrer);
    return ok;
  }, [arbol, busqueda, estado, filtrando]);

  const refrescar = () => router.refresh();

  // ── Orden: solo entre hermanas. Mover a otro padre se hace desde el modal.
  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const a = porId.get(String(active.id));
    const b = porId.get(String(over.id));
    if (!a || !b) return;
    if (a.parentId !== b.parentId) {
      toast.info("Para cambiar de categoría padre, edítala");
      return;
    }
    const hermanas = a.parentId ? porId.get(a.parentId)!.children : arbol;
    const nuevas = arrayMove(hermanas, hermanas.indexOf(a), hermanas.indexOf(b));

    const reemplazar = (nodos: CategoriaAdmin[]): CategoriaAdmin[] =>
      a.parentId === null ? nuevas : nodos.map((n) => (n.id === a.parentId ? { ...n, children: nuevas } : { ...n, children: reemplazar(n.children) }));
    const anterior = arbol;
    setArbol(a.parentId === null ? nuevas : reemplazar(arbol));

    try {
      await pedir("/api/categories/reorder", {
        method: "PATCH",
        body: JSON.stringify(nuevas.map((c, i) => ({ id: c.id, sortOrder: i }))),
      });
      toast.success("Orden guardado");
      refrescar();
    } catch (e) {
      setArbol(anterior);
      toast.error((e as Error).message);
    }
  };

  // ── Modal ──
  const abrirNueva = (parentId: string | null = null) => {
    setEditando(null);
    setForm({ ...FORM_VACIO, parentId: parentId ?? "" });
    setModalAbierto(true);
  };

  const abrirEdicion = (c: CategoriaAdmin) => {
    setEditando(c);
    setForm({
      name: c.name,
      slug: c.slug ?? "",
      parentId: c.parentId ?? "",
      description: c.description ?? "",
      image: c.image,
      banner: c.banner,
      isActive: c.isActive,
      metaTitle: c.metaTitle ?? "",
      metaDescription: c.metaDescription ?? "",
    });
    setModalAbierto(true);
  };

  // El selector de padre ya excluye lo inválido: la propia categoría, su
  // descendencia, el nivel 3 y cualquier padre que dejaría el subárbol en un
  // 4.º nivel. El servidor vuelve a comprobarlo todo.
  const opcionesPadre = useMemo(
    () => (modalAbierto ? padresPosibles(planas, editando?.id ?? null) : []),
    [modalAbierto, planas, editando]
  );

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const body = {
        name: form.name,
        slug: form.slug,
        parentId: form.parentId || null,
        description: form.description,
        image: form.image,
        banner: form.banner,
        isActive: form.isActive,
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
      };
      await pedir(editando ? `/api/categories/${editando.id}` : "/api/categories", {
        method: editando ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      toast.success(editando ? "Categoría actualizada" : "Categoría creada");
      if (form.parentId) setExpandidas((s) => new Set(s).add(form.parentId));
      setModalAbierto(false);
      refrescar();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  const alternarActiva = async (c: CategoriaAdmin) => {
    try {
      await pedir(`/api/categories/${c.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !c.isActive }) });
      toast.success(c.isActive ? `«${c.name}» desactivada` : `«${c.name}» activada`);
      refrescar();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const eliminar = async (c: CategoriaAdmin) => {
    const motivo = motivoParaNoBorrar(c.children.length, c.productCount);
    if (motivo) {
      toast.error(motivo);
      return;
    }
    if (!confirm(`¿Eliminar la categoría «${c.name}»?`)) return;
    try {
      await pedir(`/api/categories/${c.id}`, { method: "DELETE" });
      toast.success("Categoría eliminada");
      refrescar();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const eliminarSeleccion = async () => {
    const elegidas = planas.filter((c) => seleccion.has(c.id));
    if (!confirm(`¿Eliminar ${elegidas.length} categoría(s)? Las que no estén vacías se omiten.`)) return;
    setBorrandoLote(true);
    // Las hojas primero: así una madre cuyas hijas también se borran queda vacía a tiempo.
    elegidas.sort((x, y) => y.level - x.level);
    let ok = 0;
    const fallidas: string[] = [];
    for (const c of elegidas) {
      try {
        await pedir(`/api/categories/${c.id}`, { method: "DELETE" });
        ok++;
      } catch {
        fallidas.push(c.name);
      }
    }
    setBorrandoLote(false);
    if (ok) toast.success(`${ok} categoría(s) eliminada(s)`);
    if (fallidas.length) toast.error(`No se eliminaron (no están vacías): ${fallidas.join(", ")}`);
    setSeleccion(new Set());
    refrescar();
  };

  const verProductos = async (c: CategoriaAdmin) => {
    setCargandoProductos(true);
    try {
      const data = await pedir(`/api/categories/${c.id}/products?limit=48`);
      setProductos({ categoria: c, items: data.products ?? [], total: data.total ?? 0 });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCargandoProductos(false);
    }
  };

  const toggle = (set: Set<string>, id: string) => {
    const s = new Set(set);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    return s;
  };

  const grupo = (nodos: CategoriaAdmin[], depth: number): React.ReactNode => {
    const mostrados = visibles ? nodos.filter((n) => visibles.has(n.id)) : nodos;
    return (
      <SortableContext items={mostrados.map((n) => n.id)} strategy={verticalListSortingStrategy}>
        {mostrados.map((n) => {
          const abierta = filtrando || expandidas.has(n.id);
          return (
            <Fila
              key={n.id}
              nodo={n}
              depth={depth}
              arrastrable={!filtrando}
              expandida={abierta}
              seleccionada={seleccion.has(n.id)}
              onToggleExpand={() => setExpandidas((s) => toggle(s, n.id))}
              onToggleSelect={() => setSeleccion((s) => toggle(s, n.id))}
              onEdit={() => abrirEdicion(n)}
              onAddChild={() => abrirNueva(n.id)}
              onToggleActive={() => alternarActiva(n)}
              onDelete={() => eliminar(n)}
              onProducts={() => verProductos(n)}
            >
              {abierta && n.children.length > 0 && grupo(n.children, depth + 1)}
            </Fila>
          );
        })}
      </SortableContext>
    );
  };

  const slugSugerido = slugFromName(form.name);
  const rutaPadre = form.parentId ? porId.get(form.parentId)?.path : "/categorias";
  const seoTitulo = form.metaTitle || form.name || "Nombre de la categoría";
  const seoDescripcion =
    form.metaDescription || form.description || `${form.name || "…"} — joyería en plata 925 con mensajes secretos y envío a todo Perú.`;

  return (
    <>
      {/* ── Barra superior ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-[#111111]/6">
        {seleccion.size > 0 ? (
          <>
            <p className="text-[11px] text-[#111111]/60">
              {seleccion.size} seleccionada{seleccion.size === 1 ? "" : "s"}
            </p>
            <Button variant="danger" size="sm" className="gap-1.5" loading={borrandoLote} onClick={eliminarSeleccion}>
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar seleccionadas
            </Button>
            <button
              type="button"
              onClick={() => setSeleccion(new Set())}
              className="p-1.5 text-[#111111]/30 hover:text-[#111111]"
              title="Cancelar selección"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#111111]/30" />
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o slug…"
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#111111]/15 text-sm text-[#111111] focus:outline-none focus:border-[#d4af37]"
              />
            </div>
            <div className="flex border border-[#111111]/15 text-[10px] uppercase tracking-wider">
              {(
                [
                  ["all", "Todas"],
                  ["active", "Activas"],
                  ["inactive", "Inactivas"],
                ] as const
              ).map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setEstado(v)}
                  className={`px-3 py-2 transition-colors ${estado === v ? "bg-[#111111] text-white" : "text-[#111111]/50 hover:text-[#111111]"}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={() =>
                  setExpandidas((s) => (s.size >= planas.filter((c) => c.children.length).length ? new Set() : new Set(planas.map((c) => c.id))))
                }
                className="text-[10px] uppercase tracking-wider text-[#111111]/40 hover:text-[#111111]"
              >
                Expandir / contraer
              </button>
              <Button size="sm" onClick={() => abrirNueva()} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Nueva categoría
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 px-5 py-2 border-b border-[#111111]/6 text-[9px] uppercase tracking-[0.2em] text-[#111111]/40">
        <span className="flex-1">
          {planas.length} {planas.length === 1 ? "categoría" : "categorías"} · máximo {MAX_NIVEL} niveles · arrastrá para ordenar el menú
        </span>
        <span className="w-20 text-right">Productos</span>
        <span className="w-20 text-center">Estado</span>
        <span className="hidden sm:block w-[104px]" />
      </div>

      {/* ── Árbol ────────────────────────────────────────────────────────── */}
      {planas.length === 0 ? (
        <div className="text-center py-16 text-[#111111]/30">
          <Tag className="h-8 w-8 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-light">No hay categorías todavía</p>
        </div>
      ) : visibles && visibles.size === 0 ? (
        <p className="text-center py-12 text-sm text-[#111111]/40">Ninguna categoría coincide con el filtro</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              {grupo(arbol, 0)}
            </DndContext>
          </div>
        </div>
      )}

      {/* ── Crear / editar ───────────────────────────────────────────────── */}
      <Modal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={editando ? `Editar «${editando.name}»` : form.parentId ? "Nueva subcategoría" : "Nueva categoría"}
        className="max-w-2xl"
      >
        <form onSubmit={guardar} className="space-y-6">
          <section className="space-y-4">
            <Input
              label="Nombre *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ej: Anillos de promesa"
              required
              minLength={2}
              maxLength={80}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-medium text-[#111111]/60 uppercase tracking-[0.15em]">Categoría padre</label>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#111111]/15 text-sm text-[#111111] focus:outline-none focus:border-[#d4af37]"
                >
                  <option value="">Ninguna (categoría principal)</option>
                  {opcionesPadre
                    .map((c) => porId.get(c.id)!)
                    .sort((x, y) => x.path.localeCompare(y.path))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {"  ".repeat(c.level - 1)}
                        {c.level > 1 ? "↳ " : ""}
                        {c.name}
                      </option>
                    ))}
                </select>
                {editando && editando.children.length > 0 && (
                  <p className="text-[10px] text-[#111111]/40">Sus subcategorías se mueven con ella.</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-medium text-[#111111]/60 uppercase tracking-[0.15em]">Slug (URL)</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder={slugSugerido || "se-genera-del-nombre"}
                  maxLength={80}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#111111]/15 text-sm text-[#111111] focus:outline-none focus:border-[#d4af37]"
                />
                <p className="text-[10px] text-[#111111]/40 truncate">
                  {rutaPadre}/{slugFromName(form.slug) || slugSugerido || "…"}
                  {editando && " · cambiarlo rompe los enlaces ya compartidos"}
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-medium text-[#111111]/60 uppercase tracking-[0.15em]">Descripción</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                maxLength={2000}
                placeholder="Se muestra bajo el título en la página de la categoría"
                className="w-full px-3.5 py-2.5 bg-white border border-[#111111]/15 text-sm text-[#111111] focus:outline-none focus:border-[#d4af37]"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-[#111111]/80 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-3.5 w-3.5 accent-[#d4af37]"
              />
              Activa (visible en la tienda)
            </label>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#111111]/6">
            <div>
              <p className="text-[10px] font-medium text-[#111111]/60 uppercase tracking-[0.15em] mb-1">Imagen</p>
              <p className="text-[10px] text-[#111111]/40 mb-2">Miniatura en la página de su categoría padre. Cuadrada.</p>
              <ImageManager
                images={form.image ? [form.image] : []}
                onChange={(urls) => setForm((f) => ({ ...f, image: urls[urls.length - 1] ?? null }))}
              />
            </div>
            <div>
              <p className="text-[10px] font-medium text-[#111111]/60 uppercase tracking-[0.15em] mb-1">Banner</p>
              <p className="text-[10px] text-[#111111]/40 mb-2">Cabecera de la página. Apaisado, ~16:5.</p>
              <ImageManager
                images={form.banner ? [form.banner] : []}
                onChange={(urls) => setForm((f) => ({ ...f, banner: urls[urls.length - 1] ?? null }))}
              />
            </div>
          </section>

          <section className="space-y-4 pt-4 border-t border-[#111111]/6">
            <p className="text-[10px] font-medium text-[#111111]/60 uppercase tracking-[0.15em]">SEO</p>
            <div>
              <Input
                label="Meta title"
                value={form.metaTitle}
                onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))}
                placeholder={form.name || "Por defecto, el nombre"}
                maxLength={70}
              />
              <p className="mt-1 text-[10px] text-right text-[#111111]/35">{form.metaTitle.length}/70</p>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-medium text-[#111111]/60 uppercase tracking-[0.15em]">Meta description</label>
              <textarea
                value={form.metaDescription}
                onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))}
                rows={2}
                maxLength={170}
                placeholder="Por defecto, la descripción"
                className="w-full px-3.5 py-2.5 bg-white border border-[#111111]/15 text-sm text-[#111111] focus:outline-none focus:border-[#d4af37]"
              />
              <p className="text-[10px] text-right text-[#111111]/35">{form.metaDescription.length}/170</p>
            </div>
            <div className="p-3 bg-[#f8f7f4] text-xs">
              <p className="text-[10px] uppercase tracking-wider text-[#111111]/35 mb-1.5">Vista previa en Google</p>
              <p className="text-[#1a0dab] text-sm truncate">{seoTitulo} | Adamantio</p>
              <p className="text-[#006621] truncate">
                adamantio.pe{rutaPadre}/{slugFromName(form.slug) || slugSugerido}
              </p>
              <p className="text-[#111111]/60 line-clamp-2">{seoDescripcion}</p>
            </div>
          </section>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" loading={guardando}>
              {editando ? "Guardar cambios" : "Crear"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Productos de la categoría ────────────────────────────────────── */}
      <Modal
        open={!!productos || cargandoProductos}
        onClose={() => setProductos(null)}
        title={productos ? `Productos en «${productos.categoria.name}»` : "Cargando…"}
      >
        <div className="overflow-y-auto max-h-[60vh]">
          {!productos ? (
            <p className="text-sm text-[#111111]/40 text-center py-8">Cargando…</p>
          ) : productos.items.length === 0 ? (
            <p className="text-sm text-[#111111]/40 text-center py-8">Sin productos</p>
          ) : (
            <>
              <p className="text-[10px] text-[#111111]/40 mb-2">
                {productos.total} producto{productos.total === 1 ? "" : "s"}, incluidas sus subcategorías
                {productos.total > productos.items.length && ` (se muestran ${productos.items.length})`}
              </p>
              <table className="w-full text-sm">
                <tbody>
                  {productos.items.map((p) => {
                    const img = productThumbnail(p);
                    const { precio, antes } = precioConOferta(p);
                    return (
                      <tr key={p.id} className="border-b border-[#111111]/4">
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-2.5">
                            <div className="relative w-8 h-8 shrink-0 bg-[#f8f7f4] overflow-hidden">
                              {img && <Image src={img} alt="" fill className="object-cover" sizes="32px" />}
                            </div>
                            <div>
                              <a href={`/admin/productos/${p.id}/editar`} className="font-medium text-[#111111] leading-tight hover:text-[#d4af37]">
                                {p.name}
                              </a>
                              {p.sku && <p className="text-[11px] text-[#111111]/40">{p.sku}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-right text-[#111111]/70">
                          {formatPEN(precio)}
                          {antes !== null && <span className="block text-[11px] text-[#111111]/40 line-through">{formatPEN(antes)}</span>}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {p.isActive ? (
                            <Eye className="h-3.5 w-3.5 inline text-emerald-600" aria-label="Activo" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5 inline text-[#111111]/30" aria-label="Inactivo" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
