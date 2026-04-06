"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ProductWithCategory } from "@/types";
import { useCartStore } from "@/stores/cart";

interface AddToCartButtonProps {
  product: ProductWithCategory;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const hasSizes = product.sizes && product.sizes.length > 0;
  const canAdd = !hasSizes || !!selectedSize;

  if (product.stock === 0) {
    return (
      <div className="border border-[#111111]/10 px-6 py-3.5 text-center rounded-full">
        <span className="text-[10px] font-medium text-[#111111]/40 uppercase tracking-[0.2em]">
          Sin stock disponible
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasSizes && (
        <div className="space-y-2.5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#111111]/50">
            Talla{selectedSize ? <span className="text-[#111111] font-semibold">: {selectedSize}</span> : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size === selectedSize ? null : size)}
                className={`w-10 h-10 rounded-full border text-xs font-medium transition-colors ${
                  selectedSize === size
                    ? "bg-[#111111] text-white border-[#111111]"
                    : "border-[#111111]/20 text-[#111111]/60 hover:border-[#111111]/60 hover:text-[#111111]"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
          {!selectedSize && (
            <p className="text-[10px] text-[#111111]/35">Selecciona una talla para continuar</p>
          )}
        </div>
      )}

      <Button
        onClick={() => {
          if (!canAdd) return;
          addItem({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            image: product.imageUrls?.[0] ?? product.imageUrl ?? undefined,
            imageUrl: product.imageUrls?.[0] ?? product.imageUrl ?? undefined,
            stock: product.stock,
            quantity: 1,
            size: selectedSize ?? undefined,
          });
          openDrawer();
        }}
        disabled={!canAdd}
        className="w-full rounded-full"
        size="lg"
        variant="outline"
      >
        Agregar al carrito
      </Button>
    </div>
  );
}
