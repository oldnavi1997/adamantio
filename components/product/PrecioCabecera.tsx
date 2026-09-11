"use client";

import { formatPEN } from "@/lib/utils";
import { useVariante } from "@/components/product/VarianteContext";

type Oferta = { precio: number; antes: number | null; descuento: number };

/**
 * El precio grande de la ficha.
 *
 * Sin variantes, o con la pareja elegida, pinta exactamente lo de siempre: el
 * precio de `Product.price`, el tachado y el porcentaje de oferta. Con un
 * anillo suelto pinta su precio a secas, porque `comparePrice` solo existe
 * frente al precio de la pareja y repartirlo sería inventarse un descuento.
 */
export function PrecioCabecera({
  oferta,
  freeShipping,
}: {
  oferta: Oferta;
  freeShipping: boolean;
}) {
  const { variante, seleccionada, opciones } = useVariante();
  const individual = seleccionada !== null && seleccionada.id !== "PAREJA";
  const precio = individual ? seleccionada.precio : oferta.precio;

  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-4">
        <span className="text-xl font-normal text-[#111111]">{formatPEN(precio)}</span>
        {!individual && oferta.antes !== null && (
          <>
            <span className="text-base text-[#111111]/35 line-through">
              {formatPEN(oferta.antes)}
            </span>
            <span className="bg-[#d4af37] text-[#111111] text-[9px] font-semibold uppercase tracking-[0.15em] px-2 py-1 rounded-full">
              -{oferta.descuento}%
            </span>
          </>
        )}
        {freeShipping && (
          <span className="bg-green-50 text-green-700 text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-1 rounded-full">
            Envío gratis
          </span>
        )}
      </div>

      {/* Sin esta línea el precio cambia de golpe y no se sabe por qué. */}
      {opciones.porVariante && variante && (
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#111111]/40">
          {opciones.variantes.find((v) => v.id === variante)?.etiqueta}
        </p>
      )}
    </div>
  );
}
