import { CartItem } from "@/types";
import { formatPEN } from "@/lib/utils";
import Image from "next/image";

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shippingCost?: number;
  mpCommission?: number;
  total?: number;
}

export function OrderSummary({ items, subtotal, shippingCost, mpCommission, total }: OrderSummaryProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
      <h3 className="font-semibold text-[#111111] mb-4">Tu orden</h3>
      <div className="space-y-3">
        {items.map((item) => {
          const img = item.image ?? item.imageUrl;
          return (
            <div key={item.cartKey ?? item.id} className="flex gap-3">
              {img && (
                <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                  <Image src={img} alt={item.name} fill className="object-cover" sizes="56px" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#111111] font-medium leading-tight line-clamp-2">{item.name}</p>
                {item.size && <p className="text-xs text-gray-400 mt-0.5">Talla: {item.size}</p>}
                {item.engravingText && <p className="text-xs text-gray-400 mt-0.5">Grabado: {item.engravingText}</p>}
                <p className="text-xs text-gray-500 mt-1">×{item.quantity}</p>
              </div>
              <span className="text-sm font-medium text-[#111111] flex-shrink-0">
                {formatPEN(item.price * item.quantity)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="border-t border-gray-100 mt-4 pt-4 space-y-2">
        <div className="flex justify-between text-sm text-[#111111]/60">
          <span>Subtotal</span>
          <span>{formatPEN(subtotal)}</span>
        </div>
        {total !== undefined ? (
          <>
            <div className="flex justify-between text-sm text-[#111111]/60">
              <span>Envío</span>
              <span>{shippingCost === 0 ? "Gratis" : formatPEN(shippingCost ?? 0)}</span>
            </div>
            <div className="flex justify-between text-sm text-[#111111]/60">
              <span>Comisión de pago</span>
              <span>{formatPEN(mpCommission ?? 0)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-[#111111] border-t border-gray-100 pt-2 mt-1">
              <span>Total</span>
              <span>{formatPEN(total)}</span>
            </div>
          </>
        ) : (
          <p className="text-xs text-[#111111]/40">Envío y comisión se calculan al confirmar tu dirección</p>
        )}
      </div>
    </div>
  );
}
