"use client";

import Link from "next/link";
import { useCartStore } from "@/stores/cart";
import { CartItemComponent } from "@/components/cart/CartItemComponent";
import { CartSummary } from "@/components/cart/CartSummary";
import { Button } from "@/components/ui/Button";
import { ShoppingBag } from "lucide-react";

export default function CartPage() {
  const { items, itemCount, subtotal } = useCartStore();
  const count = itemCount();
  const total = subtotal();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-24 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 border border-[#111111]/10 mb-8">
          <ShoppingBag className="h-8 w-8 text-[#111111]/20" />
        </div>
        <h1
          className="text-2xl font-light text-[#111111] mb-3"
          style={{ fontFamily: "var(--font-sans, sans-serif)" }}
        >
          Tu carrito está vacío
        </h1>
        <p className="text-sm text-[#111111]/45 mb-10">
          Explora nuestro catálogo y encuentra tus lentes perfectos.
        </p>
        <Link href="/joyas">
          <Button size="lg" variant="secondary">Ver catálogo</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <h1
          className="text-2xl font-light text-[#111111]"
          style={{ fontFamily: "var(--font-sans, sans-serif)" }}
        >
          Carrito
        </h1>
        <span className="text-[10px] font-medium text-[#111111]/40 uppercase tracking-[0.15em]">
          {count} {count === 1 ? "producto" : "productos"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 bg-white border border-[#111111]/6 px-6">
          {items.map((item) => (
            <CartItemComponent key={item.id} item={item} />
          ))}
        </div>

        {/* Summary */}
        <div>
          <CartSummary subtotal={total} itemCount={count} />
        </div>
      </div>
    </div>
  );
}
