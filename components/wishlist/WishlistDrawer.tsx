"use client";

import { useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Trash2, Heart, ArrowRight, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useWishlistStore } from "@/stores/wishlist";
import { useCartStore } from "@/stores/cart";
import { WishlistItem } from "@/types";
import { formatPEN } from "@/lib/utils";

export function WishlistDrawer() {
  const { isDrawerOpen, closeDrawer, items, removeItem, count } = useWishlistStore();
  const addToCart = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openDrawer);

  const total = count();

  const handleAddToCart = (item: WishlistItem) => {
    if (item.stock === 0) return;
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.imageUrl,
      imageUrl: item.imageUrl,
      stock: item.stock,
      quantity: 1,
    });
    closeDrawer();
    openCart();
    toast("Agregado al carrito");
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawerOpen) closeDrawer();
    },
    [isDrawerOpen, closeDrawer]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isDrawerOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeDrawer}
        className={`fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] transition-opacity duration-400 ${
          isDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Lista de deseos"
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-[420px] flex flex-col shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ backgroundColor: "#ffffff" }}
      >
        {/* Línea dorada superior */}
        <div className="h-[2px] bg-gradient-to-r from-[#d4af37]/0 via-[#d4af37] to-[#d4af37]/0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid #e5e7eb" }}>
          <div className="flex items-center gap-3">
            <h6
              className="text-sm text-[#111111] tracking-wider uppercase"
              style={{ fontFamily: "var(--font-sans, sans-serif)" }}
            >
              Tus favoritos
            </h6>
            {total > 0 && (
              <span className="bg-[#111111] text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider">
                {total}
              </span>
            )}
          </div>
          <button
            onClick={closeDrawer}
            className="w-8 h-8 flex items-center justify-center text-[#111111]/40 hover:text-[#111111] hover:bg-[#f3f4f6] rounded-full transition-all duration-200"
            aria-label="Cerrar favoritos"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Contenido */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 text-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-[#f3f4f6] flex items-center justify-center">
                <Heart className="h-8 w-8 text-[#111111]/30" />
              </div>
            </div>
            <div className="space-y-2">
              <p
                className="text-[#111111]/70 text-sm"
                style={{ fontFamily: "var(--font-sans, sans-serif)" }}
              >
                Tu lista de deseos está vacía
              </p>
              <p className="text-[#111111]/40 text-xs tracking-wider">
                Guarda tus joyas favoritas para más tarde
              </p>
            </div>
            <Link
              href="/joyas"
              onClick={closeDrawer}
              className="mt-2 flex items-center gap-2 text-[#111111] text-xs uppercase tracking-wider hover:gap-3 transition-all duration-200 group"
            >
              Ver catálogo
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-2 scrollbar-thin">
            <div className="divide-y divide-[#f3f4f6]">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 py-5">
                  {/* Imagen */}
                  <Link
                    href={`/joyas/${item.id}`}
                    onClick={closeDrawer}
                    className="relative w-[72px] h-[72px] flex-shrink-0 bg-[#f3f4f6] overflow-hidden"
                  >
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="72px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Heart className="h-6 w-6 text-[#111111]/20" />
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/joyas/${item.id}`} onClick={closeDrawer} className="min-w-0">
                        <h6
                          className="text-[#111111] text-sm leading-snug line-clamp-2"
                          style={{ fontFamily: "var(--font-sans, sans-serif)" }}
                        >
                          {item.name}
                        </h6>
                        {item.stock === 0 && (
                          <p className="text-[10px] text-[#111111]/40 mt-0.5 uppercase tracking-wider">Sin stock</p>
                        )}
                      </Link>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="flex-shrink-0 p-1 text-[#111111]/30 hover:text-red-500 transition-colors mt-0.5"
                        aria-label="Eliminar de favoritos"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {item.stock > 0 && item.sizes && item.sizes.length > 0 ? (
                        <Link
                          href={`/joyas/${item.id}`}
                          onClick={closeDrawer}
                          className="flex items-center gap-1.5 text-[10px] text-[#111111]/60 hover:text-[#111111] uppercase tracking-wider transition-colors"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                          Elegir talla
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(item)}
                          disabled={item.stock === 0}
                          className="flex items-center gap-1.5 text-[10px] text-[#111111]/60 hover:text-[#111111] uppercase tracking-wider transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                          Agregar al carrito
                        </button>
                      )}
                      <span className="text-[#d4af37] text-sm font-semibold tabular-nums">
                        {formatPEN(item.price)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
