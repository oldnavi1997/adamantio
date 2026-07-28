"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useWishlistStore } from "@/stores/wishlist";
import { ProductWithCategory } from "@/types";
import { productThumbnail } from "@/lib/media";

interface Props {
  product: ProductWithCategory;
  variant?: "card" | "detail";
}

export function WishlistButton({ product, variant = "card" }: Props) {
  const toggle = useWishlistStore((s) => s.toggle);
  const inList = useWishlistStore((s) => s.has(product.id));

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const active = mounted && inList;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const wasIn = useWishlistStore.getState().has(product.id);
    toggle({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      imageUrl: productThumbnail(product) ?? undefined,
      stock: product.stock,
      sizes: product.sizes ?? undefined,
    });
    toast(wasIn ? "Eliminado de favoritos" : "Agregado a favoritos");
  };

  if (variant === "detail") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={active}
        className="w-full flex items-center justify-center gap-2 rounded-full border border-[#111111]/20 px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.2em] text-[#111111]/70 hover:border-[#111111]/60 hover:text-[#111111] transition-colors"
      >
        <Heart className={`h-4 w-4 ${active ? "fill-current text-red-500" : ""}`} />
        {active ? "Quitar de favoritos" : "Agregar a favoritos"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={active ? "Quitar de favoritos" : "Agregar a favoritos"}
      aria-pressed={active}
      className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-[#111111]/60 backdrop-blur-sm transition-colors hover:bg-white hover:text-[#111111]"
    >
      <Heart className={`h-[18px] w-[18px] ${active ? "fill-current text-red-500" : ""}`} />
    </button>
  );
}
