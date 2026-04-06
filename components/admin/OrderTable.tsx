"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { OrderWithItems } from "@/types";
import { formatPEN } from "@/lib/utils";
import { OrderStatusBadge, PaymentStatusBadge } from "./OrderStatusBadge";

interface OrderTableProps {
  orders: OrderWithItems[];
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
        <p className="text-[10px] text-[#111111]/40 uppercase tracking-[0.2em]">
          {orders.length} {orders.length === 1 ? "pedido" : "pedidos"}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#111111]/6">
              {["ID", "Cliente", "Total", "Pago", "Estado", "Fecha", ""].map((h) => (
                <th
                  key={h}
                  className={`py-3 px-4 text-[9px] font-medium text-[#111111]/40 uppercase tracking-[0.2em] ${
                    h === "Total" ? "text-right" : h === "Pago" || h === "Estado" ? "text-center" : h === "" ? "" : "text-left"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const latestPayment = order.payments?.[0];
              const clientName = order.address?.fullName ?? order.guestEmail ?? "—";
              const clientContact = order.guestEmail ?? order.address?.phone ?? "—";
              return (
                <tr
                  key={order.id}
                  className="border-b border-[#111111]/4 hover:bg-[#f8f7f4]/60 transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono text-xs text-[#111111]/60">
                    {order.id.slice(0, 8)}…
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-medium text-[#111111] text-sm">{clientName}</p>
                    <p className="text-[10px] text-[#111111]/35 mt-0.5">{clientContact}</p>
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-sm text-[#111111]">
                    {formatPEN(Number(order.total))}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {latestPayment ? (
                      <PaymentStatusBadge status={latestPayment.status} />
                    ) : (
                      <span className="text-[10px] text-[#111111]/30">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="py-3.5 px-4 text-[10px] text-[#111111]/40">
                    {new Date(order.createdAt).toLocaleDateString("es-PE", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex justify-end">
                      <Link
                        href={`/admin/pedidos/${order.id}`}
                        className="p-1.5 text-[#111111]/30 hover:text-[#111111] hover:bg-[#f8f7f4] transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
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
