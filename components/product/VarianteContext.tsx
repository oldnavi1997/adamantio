"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { OpcionesDeVariante, Variante, VarianteOfertada } from "@/lib/variantes";

type Valor = {
  opciones: OpcionesDeVariante;
  variante: Variante | null;
  elegir: (v: Variante) => void;
  /** La opción completa elegida, o `null` si el producto no se vende por variante. */
  seleccionada: VarianteOfertada | null;
};

const Ctx = createContext<Valor | null>(null);

/**
 * Envuelve la columna derecha de la ficha.
 *
 * El precio de cabecera y los controles de compra son dos bloques separados por
 * la descripción, que se sigue renderizando en el servidor y llega aquí como
 * `children`. Un proveedor de cliente con hijos de servidor deja que los dos
 * compartan la variante elegida sin mover a cliente ni la descripción, ni el
 * JSON-LD, ni la consulta a la base.
 *
 * `opciones` se calcula en el servidor y llega ya como objeto plano: así no
 * viaja el `Decimal` de Prisma ni se repite el cálculo en el navegador.
 */
export function VarianteProvider({
  opciones,
  children,
}: {
  opciones: OpcionesDeVariante;
  children: React.ReactNode;
}) {
  const [variante, setVariante] = useState<Variante | null>(opciones.predeterminada);

  const valor = useMemo<Valor>(
    () => ({
      opciones,
      variante,
      elegir: setVariante,
      seleccionada: opciones.variantes.find((v) => v.id === variante) ?? null,
    }),
    [opciones, variante]
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

/** Fuera del proveedor devuelve el estado neutro: el producto no tiene variantes. */
export function useVariante(): Valor {
  return (
    useContext(Ctx) ?? {
      opciones: { porVariante: false, variantes: [], predeterminada: null },
      variante: null,
      elegir: () => {},
      seleccionada: null,
    }
  );
}
