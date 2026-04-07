"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ProductWithCategory } from "@/types";
import { useCartStore } from "@/stores/cart";

const ENGRAVING_SAMPLES = [
  "https://res.cloudinary.com/dzqns7kss/image/upload/v1772765494/WhatsApp_Image_2026-03-05_at_7.44.30_PM_1__05_03_2026_gnhjn1.webp",
  "https://res.cloudinary.com/dzqns7kss/image/upload/v1772765494/WhatsApp_Image_2026-03-05_at_7.44.30_PM_2__05_03_2026_smowko.webp",
  "https://res.cloudinary.com/dzqns7kss/image/upload/v1772765493/WhatsApp_Image_2026-03-05_at_7.44.30_PM_05_03_2026_flg2ts.webp",
  "https://res.cloudinary.com/dzqns7kss/image/upload/v1772765494/WhatsApp_Image_2026-03-05_at_7.44.29_PM_1__05_03_2026_pfhikt.webp",
  "https://res.cloudinary.com/dzqns7kss/image/upload/v1772765493/WhatsApp_Image_2026-03-05_at_7.44.29_PM_05_03_2026_q10b5w.webp",
];

const MAX_ENGRAVING = 30;

interface AddToCartButtonProps {
  product: ProductWithCategory;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [engravingText, setEngravingText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasSizes = product.sizes && product.sizes.length > 0;
  const canAdd = !hasSizes || !!selectedSize;

  const scrollCarousel = (dir: "prev" | "next") => {
    if (!scrollRef.current) return;
    const w = scrollRef.current.offsetWidth;
    scrollRef.current.scrollBy({ left: dir === "next" ? w : -w, behavior: "smooth" });
  };

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
      {/* Tallas */}
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

      {/* Grabado personalizado */}
      {product.engravingEnabled && (
        <div className="border border-[#111111]/10 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-[#f8f7f4]" style={{ borderBottom: "1px solid rgba(17,17,17,0.07)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#111111]/60">
              Personaliza tu grabado
            </p>
            <p className="text-[11px] text-[#111111]/40 mt-0.5">
              Texto que aparecerá grabado en tu joya
            </p>
          </div>

          {/* Carousel de ejemplos */}
          <div className="relative bg-[#f0eeeb]">
            <div
              ref={scrollRef}
              className="flex overflow-x-auto gap-2 px-3 py-3 scroll-smooth"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {ENGRAVING_SAMPLES.map((url, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-[#e5e3e0]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Ejemplo de grabado ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
            {/* Nav buttons */}
            <button
              type="button"
              onClick={() => scrollCarousel("prev")}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/80 shadow text-[#111111]/60 hover:bg-white hover:text-[#111111] transition-all flex items-center justify-center text-sm leading-none"
              aria-label="Anterior"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scrollCarousel("next")}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/80 shadow text-[#111111]/60 hover:bg-white hover:text-[#111111] transition-all flex items-center justify-center text-sm leading-none"
              aria-label="Siguiente"
            >
              ›
            </button>
          </div>

          {/* Input */}
          <div className="px-4 py-3">
            <div className="relative">
              <input
                type="text"
                value={engravingText}
                onChange={(e) => setEngravingText(e.target.value.slice(0, MAX_ENGRAVING))}
                placeholder='Ej: "Te amo para siempre"'
                className="w-full pr-12 px-3 py-2.5 border border-[#111111]/15 rounded-lg text-sm text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:border-[#111111]/40 bg-white transition-colors"
              />
              <span
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] tabular-nums ${
                  engravingText.length >= MAX_ENGRAVING ? "text-red-400" : "text-[#111111]/30"
                }`}
              >
                {engravingText.length}/{MAX_ENGRAVING}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Botón */}
      <Button
        onClick={() => {
          if (!canAdd) return;
          const trimmed = engravingText.trim();
          const cartKey = `${product.id}__${selectedSize ?? ""}__${trimmed}`;
          addItem({
            id: product.id,
            cartKey: (selectedSize || trimmed) ? cartKey : undefined,
            name: product.name,
            price: Number(product.price),
            image: product.imageUrls?.[0] ?? product.imageUrl ?? undefined,
            imageUrl: product.imageUrls?.[0] ?? product.imageUrl ?? undefined,
            stock: product.stock,
            quantity: 1,
            size: selectedSize ?? undefined,
            engravingText: trimmed || undefined,
            testMode: product.testMode,
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
