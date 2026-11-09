"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { formatPEN } from "@/lib/utils";

/** La foto se pide la primera vez que se abre y se conserva para la animación de cierre. */
function useDesplegable() {
  const [abierto, setAbierto] = useState(false);
  const [cargada, setCargada] = useState(false);
  const alternar = () => {
    setCargada(true);
    setAbierto((v) => !v);
  };
  return { abierto, cargada, alternar };
}

function BotonFoto({ nombre, abierto, alternar }: { nombre: string; abierto: boolean; alternar: () => void }) {
  return (
    <button
      type="button"
      onClick={alternar}
      aria-expanded={abierto}
      aria-label={`${abierto ? "Ocultar" : "Ver"} imagen de ${nombre}`}
      className="flex h-7 w-7 items-center justify-center text-[#111111]/50 hover:text-[#111111]"
    >
      <ChevronDown
        aria-hidden="true"
        className={`h-4 w-4 motion-safe:transition-transform motion-safe:duration-300 ${abierto ? "rotate-180" : ""}`}
      />
    </button>
  );
}

function FotoDeslizable({ foto, nombre, abierto, cargada }: { foto: string; nombre: string; abierto: boolean; cargada: boolean }) {
  return (
    <div
      className={`grid motion-safe:transition-[grid-template-rows] motion-safe:duration-300 ${
        abierto ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div className="overflow-hidden">
        {cargada && (
          <div className="relative my-2 h-40 w-40 overflow-hidden bg-[#f8f7f4]">
            <Image src={foto} alt={nombre} fill sizes="160px" className="object-cover" />
          </div>
        )}
      </div>
    </div>
  );
}

export function FilaProductoInsight({
  nombre,
  href,
  foto,
  detalle,
}: {
  nombre: string;
  href: string;
  foto: string | null;
  detalle: string;
}) {
  const { abierto, cargada, alternar } = useDesplegable();

  return (
    <li className="py-2">
      <div className="flex items-center justify-between gap-3">
        <Link href={href} className="min-w-0 truncate text-[#111111] hover:underline">
          {nombre}
        </Link>
        <span className="flex shrink-0 items-center gap-1 text-xs tabular-nums text-[#111111]/60">
          {detalle}
          {foto && <BotonFoto nombre={nombre} abierto={abierto} alternar={alternar} />}
        </span>
      </div>
      {foto && <FotoDeslizable foto={foto} nombre={nombre} abierto={abierto} cargada={cargada} />}
    </li>
  );
}

export function FilaTopInsight({
  posicion,
  nombre,
  href,
  foto,
  uds,
  web,
  ingresos,
  stock,
}: {
  posicion: number;
  nombre: string;
  href: string;
  foto: string | null;
  uds: number;
  web: number;
  ingresos: number;
  stock: number;
}) {
  const { abierto, cargada, alternar } = useDesplegable();

  return (
    <>
      <tr className="border-t border-[#111111]/6">
        <td className="py-2 pr-3 text-[#111111]/40">{posicion}</td>
        <td className="py-2 pr-3 max-w-[360px]">
          <Link href={href} className="flex items-center gap-3 text-[#111111] hover:underline">
            <span className="relative h-10 w-10 shrink-0 overflow-hidden bg-[#f8f7f4]">
              {foto && <Image src={foto} alt="" fill sizes="40px" className="object-cover" />}
            </span>
            <span className="min-w-0 truncate">{nombre}</span>
          </Link>
        </td>
        <td className="py-2 pr-3 text-right font-medium text-[#111111]">{uds}</td>
        <td className="py-2 pr-3 text-right text-[#111111]/60">{web}</td>
        <td className="py-2 pr-3 text-right text-[#111111]/80">{formatPEN(ingresos)}</td>
        <td className={`py-2 pr-1 text-right ${stock <= 0 ? "font-semibold text-red-700" : "text-[#111111]/60"}`}>
          {stock <= 0 ? "Agotado" : stock}
        </td>
        <td className="py-2 w-8">{foto && <BotonFoto nombre={nombre} abierto={abierto} alternar={alternar} />}</td>
      </tr>
      {foto && (
        <tr>
          <td colSpan={7} className="p-0">
            <FotoDeslizable foto={foto} nombre={nombre} abierto={abierto} cargada={cargada} />
          </td>
        </tr>
      )}
    </>
  );
}
