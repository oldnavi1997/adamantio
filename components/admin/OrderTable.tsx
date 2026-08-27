"use client";

import Link from "next/link";
import Image from "next/image";
import { Eye } from "lucide-react";
import { OrderWithItems } from "@/types";
import { formatPEN } from "@/lib/utils";
import { productThumbnail } from "@/lib/media";
import { COURIER_LABELS, type Courier } from "@/lib/shipping";
import { OrderStatusBadge, PaymentStatusBadge } from "./OrderStatusBadge";

interface OrderTableProps {
  orders: OrderWithItems[];
}

const ALIGN = { left: "text-left", center: "text-center", right: "text-right" } as const;

/**
 * La columna de acciones se ancla al borde derecho del contenedor con scroll.
 * Con nueve columnas la tabla desborda el `max-w-5xl` del layout, y antes el
 * botón de ver quedaba fuera de la pantalla hasta que arrastrabas la tabla.
 *
 * El fondo tiene que ser opaco para que las celdas pasen por debajo, así que no
 * puede heredar el `hover:bg-[#f8f7f4]/60` de la fila: `#fbfaf8` es ese mismo
 * tono ya compuesto sobre blanco, para que no se vea la costura al pasar por
 * encima.
 */
const STICKY =
  "sticky right-0 bg-white group-hover:bg-[#fbfaf8] border-l border-[#111111]/6";

/** Cabeceras con su alineación; la última es la columna de acciones. */
const COLUMNS: { label: string; align: "left" | "center" | "right" }[] = [
  { label: "ID", align: "left" },
  { label: "Productos", align: "left" },
  { label: "Cliente", align: "left" },
  { label: "Envío", align: "left" },
  { label: "Total", align: "right" },
  { label: "Pago", align: "center" },
  { label: "Estado", align: "center" },
  { label: "Fecha", align: "left" },
  { label: "Ver", align: "right" },
];

/** Miniaturas apiladas: hasta dos, y el resto como contador. */
function ItemThumbnails({ items }: { items: OrderWithItems["items"] }) {
  const shown = items.slice(0, 2);
  const rest = items.length - shown.length;

  return (
    <div className="flex items-center">
      {shown.map((item, i) => {
        const src = item.product ? productThumbnail(item.product) : null;
        return (
          <div
            key={item.id}
            className={`relative h-11 w-11 flex-shrink-0 overflow-hidden bg-[#f8f7f4] ring-1 ring-white ${
              i > 0 ? "-ml-3" : ""
            }`}
            style={{ zIndex: shown.length - i }}
            title={`${item.productName} ×${item.quantity}`}
          >
            {src ? (
              <Image src={src} alt={item.productName} fill className="object-cover" sizes="44px" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-[10px] text-[#111111]/20">
                —
              </span>
            )}
          </div>
        );
      })}
      {rest > 0 && (
        <span className="-ml-3 relative z-0 flex h-11 w-11 flex-shrink-0 items-center justify-center bg-[#f8f7f4] text-[11px] tabular-nums text-[#111111]/50 ring-1 ring-white">
          +{rest}
        </span>
      )}
    </div>
  );
}

export function OrderTable({ orders }: OrderTableProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-16 text-[#111111]/30">
        <p className="text-sm font-light" style={{ fontFamily: "var(--font-sans, sans-serif)" }}>
          No hay pedidos todavía
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="px-5 py-4 border-b border-[#111111]/6">
        <p className="text-[11px] text-[#111111]/40 uppercase tracking-[0.2em]">
          {orders.length} {orders.length === 1 ? "pedido" : "pedidos"}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#111111]/6">
              {COLUMNS.map((col, i) => (
                <th
                  key={col.label}
                  scope="col"
                  className={`py-3 px-4 text-[11px] font-medium text-[#111111]/40 uppercase tracking-[0.2em] ${ALIGN[col.align]} ${
                    i === COLUMNS.length - 1 ? STICKY : ""
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const latestPayment = order.payments?.[0];
              const clientName = order.address?.fullName ?? order.user?.fullName ?? "—";
              // Manda el correo escrito en el checkout; el de la cuenta sólo es
              // respaldo para las órdenes anteriores a que se empezara a guardar.
              const clientEmail = order.contactEmail ?? order.user?.email ?? null;
              const courierLabel = order.courier
                ? COURIER_LABELS[order.courier as Courier] ?? order.courier
                : null;
              const units = order.items.reduce((sum, item) => sum + item.quantity, 0);

              return (
                <tr
                  key={order.id}
                  className="group border-b border-[#111111]/4 hover:bg-[#f8f7f4]/60 transition-[background-color] duration-150"
                >
                  <td className="py-3.5 px-4 font-mono text-xs text-[#111111]/60 tabular-nums">
                    {order.id.slice(0, 8)}…
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <ItemThumbnails items={order.items} />
                      <div className="min-w-0">
                        <p className="text-sm text-[#111111] line-clamp-1 max-w-[200px]">
                          {order.items[0]?.productName ?? "—"}
                        </p>
                        <p className="text-xs text-[#111111]/35 mt-0.5 tabular-nums">
                          {units} {units === 1 ? "unidad" : "unidades"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-medium text-[#111111] text-sm">{clientName}</p>
                    {clientEmail ? (
                      <a
                        href={`mailto:${clientEmail}`}
                        className="text-xs text-[#111111]/45 mt-0.5 block hover:text-[#111111] transition-[color] duration-150 focus-visible:outline-none focus-visible:underline"
                      >
                        {clientEmail}
                      </a>
                    ) : (
                      <p className="text-xs text-[#111111]/35 mt-0.5">
                        {order.address?.phone ?? "—"}
                      </p>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {courierLabel ? (
                      <span className="inline-block border border-[#111111]/15 px-2 py-1 text-[10px] uppercase tracking-wider text-[#111111]/70">
                        {courierLabel}
                      </span>
                    ) : (
                      <span className="text-xs text-[#111111]/30">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-sm text-[#111111] tabular-nums">
                    {formatPEN(Number(order.total))}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {latestPayment ? (
                      <PaymentStatusBadge status={latestPayment.status} />
                    ) : (
                      <span className="text-xs text-[#111111]/30">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="py-3.5 px-4 text-xs text-[#111111]/40 tabular-nums">
                    {new Date(order.createdAt).toLocaleDateString("es-PE", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className={`py-3.5 px-4 ${STICKY}`}>
                    <div className="flex justify-end">
                      <Link
                        href={`/admin/pedidos/${order.id}`}
                        className="inline-flex items-center gap-1.5 border border-[#111111]/15 px-2.5 py-1.5 text-[11px] uppercase tracking-wider text-[#111111]/70 hover:border-[#111111] hover:text-[#111111] transition-[color,border-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/20"
                        aria-label={`Ver pedido ${order.id.slice(0, 8)}`}
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        Ver
                      </Link>
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
