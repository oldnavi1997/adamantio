"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductWithCategory } from "@/types";

interface Props {
  products: ProductWithCategory[];
  categorySlug: string;
  categoryName: string;
  label?: string;
}

export function CategoryGridCarousel({
  products,
  categorySlug,
  categoryName,
  label = "Colección",
}: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    dragFree: true,
    align: "start",
    containScroll: "trimSnaps",
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollState = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    updateScrollState();
    emblaApi.on("select", updateScrollState);
    emblaApi.on("reInit", updateScrollState);
    return () => {
      emblaApi.off("select", updateScrollState);
      emblaApi.off("reInit", updateScrollState);
    };
  }, [emblaApi, updateScrollState]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
      {/* Header row */}
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#c9a84c] mb-1">
            {label}
          </p>
          <h2
            className="text-3xl text-[#1a1a2e] leading-tight"
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
          >
            {categoryName}
          </h2>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <Link
            href={`/joyas?category=${categorySlug}`}
            className="hidden sm:flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[#111111]/60 hover:text-[#c9a84c] transition-colors duration-200 whitespace-nowrap"
          >
            Ver todos
            <span className="w-8 h-px bg-current inline-block" />
          </Link>

          {/* Nav buttons */}
          <div className="flex gap-2">
            <button
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              aria-label="Anterior"
              className="w-10 h-10 flex items-center justify-center border border-[#dadadd] bg-white text-[#111111]/60 hover:border-[#c9a84c] hover:text-[#c9a84c] disabled:opacity-30 disabled:pointer-events-none transition-colors duration-200"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={scrollNext}
              disabled={!canScrollNext}
              aria-label="Siguiente"
              className="w-10 h-10 flex items-center justify-center border border-[#dadadd] bg-white text-[#111111]/60 hover:border-[#c9a84c] hover:text-[#c9a84c] disabled:opacity-30 disabled:pointer-events-none transition-colors duration-200"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-[0_0_calc(66.667%-8px)] sm:flex-[0_0_calc(50%-8px)] md:flex-[0_0_calc(33.333%-10px)] lg:flex-[0_0_calc(25%-12px)] min-w-0"
            >
              <ProductCard product={product} view="normal" />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile "Ver todos" link */}
      <div className="mt-6 sm:hidden text-center">
        <Link
          href={`/joyas?category=${categorySlug}`}
          className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-[#111111]/60 hover:text-[#c9a84c] transition-colors duration-200"
        >
          Ver todos
          <span className="w-8 h-px bg-current inline-block" />
        </Link>
      </div>
    </div>
  );
}
