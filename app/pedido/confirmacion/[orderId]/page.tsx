import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPEN } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orderId: string }>;
}

export default async function OrderConfirmationPage({ params }: Props) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
      address: true,
      user: { select: { email: true } },
    },
  });

  if (!order) notFound();

  const isApproved = order.status === "PAID";
  const shortId = order.id.slice(-8).toUpperCase();
  const recipientEmail = order.user?.email ?? order.guestEmail ?? "";
  const address = order.address;

  const total = Number(order.total);
  const shippingCost = Number(order.shippingCost);
  const subtotal = total - shippingCost - Number(order.mpCommission);
  const freeShipping = shippingCost === 0;

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        {/* Status badge */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          {isApproved ? (
            <>
              <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-[#1a1a2e] mb-1">¡Pago aprobado!</h1>
              <p className="text-gray-500 text-sm">Tu pedido fue confirmado exitosamente.</p>
            </>
          ) : (
            <>
              <Clock className="h-14 w-14 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-[#1a1a2e] mb-1">Pago en proceso</h1>
              <p className="text-gray-500 text-sm">
                Tu pago está siendo procesado. Te notificaremos por email cuando se confirme.
              </p>
            </>
          )}
          <p className="mt-4 text-xs text-gray-400 font-mono tracking-wider">
            N.° de pedido: #{shortId}
          </p>
        </div>

        {/* Order items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-[#1a1a2e]">Detalle del pedido</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {order.items.map((item) => {
              const imageUrl = item.product?.imageUrl ?? null;
              const lineTotal = Number(item.productPrice) * item.quantity;
              return (
                <div key={item.id} className="px-6 py-4 flex gap-4">
                  {/* Thumbnail */}
                  <div className="flex-none">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={item.productName}
                        width={56}
                        height={56}
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
                        <span className="text-[10px] text-gray-300 uppercase">IMG</span>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1a1a2e] leading-tight">{item.productName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Cant.: {item.quantity} × {formatPEN(Number(item.productPrice).toString())}
                    </p>
                    {item.selectedSize && (
                      <p className="text-xs text-gray-500 mt-0.5">Talla: {item.selectedSize}</p>
                    )}
                    {item.engravingText && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Grabado: &ldquo;{item.engravingText}&rdquo;
                      </p>
                    )}
                  </div>
                  {/* Line total */}
                  <div className="flex-none text-right">
                    <span className="text-sm font-semibold text-[#1a1a2e]">
                      {formatPEN(lineTotal.toString())}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="px-6 py-4 border-t border-gray-100 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{formatPEN(subtotal.toString())}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Envío</span>
              <span>{freeShipping ? "Gratis" : formatPEN(shippingCost.toString())}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-sm font-semibold text-[#1a1a2e]">Total</span>
              <span className="text-lg font-bold text-[#c9a84c]">{formatPEN(total.toString())}</span>
            </div>
          </div>
        </div>

        {/* Shipping & contact data */}
        {address && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#1a1a2e]">Datos de entrega</h2>
            </div>
            <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-5">

              {/* Contacto */}
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Contacto</p>
                <Row label="Nombre" value={address.fullName} />
                {recipientEmail && <Row label="Email" value={recipientEmail} />}
                {address.phone && <Row label="Teléfono" value={address.phone} />}
                {address.documentType && address.documentNumber && (
                  <Row label={address.documentType} value={address.documentNumber} />
                )}
              </div>

              {/* Dirección */}
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Dirección</p>
                <Row label="Calle" value={address.street} />
                {address.district && <Row label="Distrito" value={address.district} />}
                <Row label="Provincia" value={address.city} />
                <Row label="Departamento" value={address.state} />
                <Row label="Código postal" value={address.postalCode} />
                <Row label="País" value={address.country} />
              </div>

            </div>
          </div>
        )}

        {/* Footer note + CTA */}
        <div className="text-center space-y-4 pb-6">
          {recipientEmail && (
            <p className="text-sm text-gray-500">
              Te enviaremos un email de confirmación a{" "}
              <span className="font-medium text-[#1a1a2e]">{recipientEmail}</span>.
            </p>
          )}
          <Link
            href="/joyas"
            className="inline-block bg-[#1a1a2e] text-white text-sm font-semibold px-8 py-3 rounded-lg hover:bg-[#c9a84c] transition-colors"
          >
            Seguir comprando
          </Link>
        </div>

      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-400 min-w-[90px] flex-shrink-0">{label}:</span>
      <span className="text-gray-700 font-medium">{value}</span>
    </div>
  );
}
