"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatPEN } from "@/lib/utils";

type Producto = { id: string; name: string; price: number; fotos: string[] };
type Item = { productId: string; imagen: number };

interface Props {
  inicial: Item[];
  automaticoInicial: boolean;
  productos: Producto[];
  maximo: number;
}

export function HeroCarruselPanel({ inicial, automaticoInicial, productos, maximo }: Props) {
  const [items, setItems] = useState<Item[]>(inicial);
  const [automatico, setAutomatico] = useState(automaticoInicial);
  const [busqueda, setBusqueda] = useState("");
  const [guardando, setGuardando] = useState(false);

  const porId = new Map(productos.map((p) => [p.id, p]));
  const texto = busqueda.trim().toLowerCase();
  const resultados = texto
    ? productos
        .filter((p) => p.name.toLowerCase().includes(texto) && !items.some((i) => i.productId === p.id))
        .slice(0, 20)
    : [];

  function agregar(productId: string) {
    setItems((prev) => [...prev, { productId, imagen: 0 }]);
    setBusqueda("");
  }

  function mover(indice: number, delta: -1 | 1) {
    setItems((prev) => {
      const destino = indice + delta;
      if (destino < 0 || destino >= prev.length) return prev;
      const copia = [...prev];
      [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
      return copia;
    });
  }

  async function guardar(productos: Item[]) {
    setGuardando(true);
    try {
      const res = await fetch("/api/admin/hero-carrusel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productos }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAutomatico(data.automatico);
      toast.success(data.automatico ? "El carrusel volvió a ser automático" : "Carrusel actualizado");
      return true;
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "Error al guardar el carrusel");
      return false;
    } finally {
      setGuardando(false);
    }
  }

  // El editor ya no refleja la selección automática: la home la recalculará.
  async function volverAutomatico() {
    if (await guardar([])) window.location.reload();
  }

  const lleno = items.length >= maximo;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-[#111111]">Productos del carrusel</h2>
          <p className="text-sm text-gray-400 mt-1">
            {automatico
              ? "Ahora es automático: si guardas, esta lista pasa a ser fija."
              : "Lista fija. El nombre y el precio se toman en vivo de cada producto."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!automatico && (
            <Button variant="ghost" onClick={volverAutomatico} disabled={guardando}>
              Volver a automático
            </Button>
          )}
          <Button onClick={() => guardar(items)} loading={guardando} disabled={items.length === 0}>
            Guardar
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#111111]/30" aria-hidden="true" />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          disabled={lleno}
          placeholder={lleno ? `Máximo ${maximo} productos` : "Buscar producto para agregar…"}
          aria-label="Buscar producto para agregar"
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#111111] disabled:bg-gray-50"
        />
        {resultados.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
            {resultados.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => agregar(p.id)}
                  className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-gray-50"
                >
                  <Image src={p.fotos[0]} alt="" width={36} height={36} className="h-9 w-9 rounded object-cover shrink-0" />
                  <span className="flex-1 min-w-0 truncate text-sm text-[#111111]">{p.name}</span>
                  <span className="text-xs text-gray-400 shrink-0">{formatPEN(p.price)}</span>
                  <Plus className="h-4 w-4 text-gray-400 shrink-0" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {texto && resultados.length === 0 && (
          <p className="mt-2 text-sm text-gray-400">Sin productos para esa búsqueda.</p>
        )}
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">Busca un producto para empezar la lista.</p>
      ) : (
        <ol className="divide-y divide-gray-100">
          {items.map((item, i) => {
            const p = porId.get(item.productId);
            if (!p) return null;
            return (
              <li key={item.productId} className="flex gap-4 py-4">
                <span className="w-5 pt-1 text-sm tabular-nums text-gray-400">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-[#111111]">{p.name}</p>
                  <p className="text-xs text-gray-400">{formatPEN(p.price)}</p>
                  <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={`Foto de ${p.name}`}>
                    {p.fotos.map((foto, f) => (
                      <button
                        key={foto}
                        type="button"
                        onClick={() =>
                          setItems((prev) => prev.map((x, j) => (j === i ? { ...x, imagen: f } : x)))
                        }
                        aria-label={`Usar foto ${f + 1}`}
                        aria-pressed={item.imagen === f}
                        className={`relative h-14 w-14 overflow-hidden rounded border-2 ${
                          item.imagen === f ? "border-[#d4af37]" : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <Image src={foto} alt="" fill sizes="56px" className="object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-start gap-1 shrink-0">
                  <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Subir" className="p-2 text-gray-400 hover:text-[#111111] disabled:opacity-30">
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => mover(i, 1)} disabled={i === items.length - 1} aria-label="Bajar" className="p-2 text-gray-400 hover:text-[#111111] disabled:opacity-30">
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}
                    aria-label={`Quitar ${p.name}`}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
