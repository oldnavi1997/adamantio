"use client";

import { useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { formatPEN } from "@/lib/utils";

export function CartDrawer() {
  const {
    isDrawerOpen,
    closeDrawer,
    items,
    updateQuantity,
    removeItem,
    itemCount,
    subtotal,
  } = useCartStore();

  const count = itemCount();
  const total = subtotal();

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
        aria-label="Carrito de compras"
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
              Tu carrito
            </h6>
            {count > 0 && (
              <span className="bg-[#111111] text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider">
                {count}
              </span>
            )}
          </div>
          <button
            onClick={closeDrawer}
            className="w-8 h-8 flex items-center justify-center text-[#111111]/40 hover:text-[#111111] hover:bg-[#f3f4f6] rounded-full transition-all duration-200"
            aria-label="Cerrar carrito"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Contenido */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 text-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-[#f3f4f6] flex items-center justify-center">
                <ShoppingBag className="h-8 w-8 text-[#111111]/30" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#d4af37]/20 flex items-center justify-center">
                <span className="text-[#d4af37] text-xs">0</span>
              </div>
            </div>
            <div className="space-y-2">
              <p
                className="text-[#111111]/70 text-sm"
                style={{ fontFamily: "var(--font-sans, sans-serif)" }}
              >
                Tu carrito está vacío
              </p>
              <p className="text-[#111111]/40 text-xs tracking-wider">
                Descubre nuestra colección de joyería
              </p>
            </div>
            {/* Link y no button: cerrar el drawer dejaba al comprador donde
                estaba, con una flecha prometiendo lo contrario. Mismo elemento
                que el equivalente de favoritos. */}
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
          <>
            {/* Lista de items */}
            <div className="flex-1 overflow-y-auto px-6 py-2 scrollbar-thin">
              <div className="divide-y divide-[#f3f4f6]">
                {items.map((item) => (
                  <div key={item.cartKey ?? item.id} className="flex gap-4 py-5">
                    {/* Imagen */}
                    <div className="relative w-[72px] h-[72px] flex-shrink-0 bg-[#f3f4f6] overflow-hidden">
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
                          <ShoppingBag className="h-6 w-6 text-[#111111]/20" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h6
                            className="text-[#111111] text-sm leading-snug line-clamp-2"
                            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
                          >
                            {item.name}
                          </h6>
                          {item.size && (
                            <p className="text-[10px] text-[#111111]/40 mt-0.5">Talla: {item.size}</p>
                          )}
                          {item.engravingText && (
                            <p className="text-[10px] text-[#111111]/40 mt-0.5 italic">
                              Grabado: &ldquo;{item.engravingText}&rdquo;
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(item.cartKey ?? item.id)}
                          className="flex-shrink-0 p-1 text-[#111111]/30 hover:text-red-500 transition-colors mt-0.5"
                          aria-label="Eliminar producto"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        {/* Controles de cantidad */}
                        <div className="flex items-center border border-[#e5e7eb] bg-white">
                          <button
                            onClick={() => updateQuantity(item.cartKey ?? item.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center text-[#111111]/50 hover:text-[#111111] hover:bg-[#f3f4f6] transition-all"
                            aria-label="Reducir cantidad"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-3 text-sm font-medium text-[#111111] min-w-[2rem] text-center tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.cartKey ?? item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                            className="w-7 h-7 flex items-center justify-center text-[#111111]/50 hover:text-[#111111] hover:bg-[#f3f4f6] transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                            aria-label="Aumentar cantidad"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Precio */}
                        <span className="text-[#d4af37] text-sm font-semibold tabular-nums">
                          {formatPEN(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-6 space-y-4" style={{ borderTop: "1px solid #e5e7eb", backgroundColor: "#f3f4f6" }}>
              {/* Desglose */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[#111111]/60 uppercase tracking-wider">
                  <span>{count} {count === 1 ? "producto" : "productos"}</span>
                  <span>{formatPEN(total)}</span>
                </div>
                <div className="flex justify-between text-[#111111]/40 uppercase tracking-wider">
                  <span>Envío</span>
                  <span className="text-emerald-600/80">A coordinar</span>
                </div>
              </div>

              {/* Separador dorado */}
              <div className="h-px bg-gradient-to-r from-[#d4af37]/0 via-[#d4af37]/30 to-[#d4af37]/0" />

              {/* Total */}
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] text-[#111111]/50 uppercase tracking-wider">
                  Total estimado
                </span>
                <span
                  className="text-2xl text-[#111111]"
                  style={{ fontFamily: "var(--font-sans, sans-serif)" }}
                >
                  {formatPEN(total)}
                </span>
              </div>

              {/* Botón checkout */}
              <Link
                href="/checkout"
                onClick={closeDrawer}
                className="group flex items-center justify-center gap-3 w-full h-12 bg-[#111111] text-white text-sm uppercase tracking-wider hover:bg-[#333] transition-colors duration-200"
              >
                Ir al pago
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
              </Link>

              {/* Link secundario */}
              <button
                onClick={closeDrawer}
                className="w-full text-center text-[10px] text-[#111111]/40 hover:text-[#111111] uppercase tracking-wider transition-colors duration-200"
              >
                Seguir comprando
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
