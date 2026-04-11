"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OrderWithItems } from "@/types";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/OrderStatusBadge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { formatPEN } from "@/lib/utils";
import { OrderStatus } from "@/app/generated/prisma/client";

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus | "">("");
  const router = useRouter();

  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/orders/${id}`)
        .then((r) => r.json())
        .then((data) => {
          setOrder(data);
          setNewStatus(data.status ?? "");
          setLoading(false);
        });
    });
  }, [params]);

  const handleUpdateStatus = async () => {
    if (!order || !newStatus) return;
    setUpdating(true);
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setUpdating(false);
    if (res.ok) {
      toast.success("Estado actualizado");
      router.refresh();
    } else {
      toast.error("Error al actualizar");
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Cargando...</div>;
  if (!order) return <div className="text-center py-12 text-gray-400">Orden no encontrada</div>;

  const latestPayment = order.payments?.[0];
  const addr = order.address;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#111111] font-mono tabular-nums text-pretty">{order.id.slice(0, 12)}…</h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(order.createdAt).toLocaleDateString("es-PE", { dateStyle: "full" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {latestPayment && <PaymentStatusBadge status={latestPayment.status} />}
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shipping info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-[#111111] mb-4 text-pretty">Datos de envío</h2>
          {addr ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Nombre</dt>
                <dd className="font-medium">{addr.fullName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Teléfono</dt>
                <dd className="font-medium">{addr.phone}</dd>
              </div>
              {(addr.documentType || addr.documentNumber) && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Documento</dt>
                  <dd className="font-medium">{addr.documentType} {addr.documentNumber}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500">Dirección</dt>
                <dd className="font-medium text-right max-w-[220px]">
                  {addr.street}{addr.district ? `, ${addr.district}` : ""}, {addr.city}, {addr.state} ({addr.postalCode})
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">País</dt>
                <dd className="font-medium">{addr.country}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-gray-400">
              {order.guestEmail ? `Email invitado: ${order.guestEmail}` : "Sin datos de dirección"}
            </p>
          )}
        </div>

        {/* Status update */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-[#111111] mb-4 text-pretty">Actualizar estado</h2>
          <div className="space-y-3">
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
            >
              <option value="PENDING">Pendiente</option>
              <option value="PAID">Pagado</option>
              <option value="SHIPPED">Enviado</option>
              <option value="CANCELLED">Cancelado</option>
            </Select>
            <Button onClick={handleUpdateStatus} loading={updating} className="w-full touch-manipulation">
              Actualizar estado
            </Button>
          </div>
          {latestPayment && (
            <div className="mt-4 pt-4 border-t border-gray-100 text-sm space-y-1">
              {latestPayment.mpPaymentId && (
                <p className="text-gray-500">ID pago MP: <span className="font-mono">{latestPayment.mpPaymentId}</span></p>
              )}
              {latestPayment.paymentMethodId && (
                <p className="text-gray-500">Método: <span className="font-medium">{latestPayment.paymentMethodId}</span></p>
              )}
              {latestPayment.statusDetail && (
                <p className="text-gray-500">Detalle: <span className="font-medium">{latestPayment.statusDetail}</span></p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stock note */}
      {order.stockNote && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-800 mb-1">Stock descontado al aprobar pago</p>
          {order.stockNote.split(" | ").map((note, i) => (
            <p key={i} className="text-sm text-amber-700">{note}</p>
          ))}
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-[#111111] mb-4">Productos</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-start border border-gray-100 rounded-lg p-4 text-sm">
              <div>
                <p className="font-medium text-gray-800">
                  {item.productName} <span className="text-gray-400 font-normal">x{item.quantity}</span>
                </p>
                {item.selectedSize && (
                  <p className="text-xs text-gray-500 mt-0.5">Talla: {item.selectedSize}</p>
                )}
                {item.engravingText && (
                  <p className="text-xs text-gray-500 mt-0.5">Grabado: "{item.engravingText}"</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">{formatPEN(Number(item.productPrice))} c/u</p>
              </div>
              <span className="font-semibold">
                {formatPEN(Number(item.productPrice) * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-1 text-sm">
          {Number(order.shippingCost) > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Envío</span>
              <span>{formatPEN(Number(order.shippingCost))}</span>
            </div>
          )}
          {Number(order.mpCommission) > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Comisión MP</span>
              <span>{formatPEN(Number(order.mpCommission))}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-[#111111] text-base mt-2">
            <span>Total</span>
            <span className="tabular-nums">{formatPEN(Number(order.total))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
