"use client";

import Image from "next/image";
import { Trash2, Plus, Minus } from "lucide-react";
import { CartItem } from "@/types";
import { formatPEN } from "@/lib/utils";
import { useCartStore } from "@/stores/cart";

interface CartItemProps {
  item: CartItem;
}

export function CartItemComponent({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();

  return (
    <div className="flex gap-4 py-5 border-b border-[#111111]/6 last:border-0">
      {/* Image */}
      <div className="relative w-20 h-20 flex-shrink-0 bg-[#f8f7f4] overflow-hidden">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="80px" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 48 48" fill="none" className="text-[#111111]/20">
              <path d="M6 24C6 24 10 16 24 16C38 16 42 24 42 24C42 24 38 32 24 32C10 32 6 24 6 24Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <circle cx="24" cy="24" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </svg>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h3
          className="font-light text-[#111111] text-sm line-clamp-2 leading-snug"
          style={{ fontFamily: "var(--font-sans, sans-serif)" }}
        >
          {item.name}
        </h3>
        <p className="text-[#d4af37] text-sm font-semibold mt-1">{formatPEN(item.price)}</p>

        {/* Quantity controls */}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center border border-[#111111]/12">
            <button
              onClick={() => updateQuantity(item.cartKey ?? item.id, item.quantity - 1)}
              className="w-7 h-7 flex items-center justify-center text-[#111111]/50 hover:text-[#111111] hover:bg-[#f8f7f4] transition-colors"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="px-3 text-sm font-medium text-[#111111] min-w-[2rem] text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.cartKey ?? item.id, item.quantity + 1)}
              className="w-7 h-7 flex items-center justify-center text-[#111111]/50 hover:text-[#111111] hover:bg-[#f8f7f4] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={item.quantity >= item.stock}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <button
            onClick={() => removeItem(item.cartKey ?? item.id)}
            className="p-1.5 text-[#111111]/25 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Total */}
      <div className="text-right flex-shrink-0">
        <span className="font-semibold text-sm text-[#111111]">
          {formatPEN(item.price * item.quantity)}
        </span>
      </div>
    </div>
  );
}
