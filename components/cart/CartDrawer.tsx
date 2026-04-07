"use client";

import { useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { formatARS } from "@/lib/utils";

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
        style={{ backgroundColor: "#F8F7F4" }}
      >
        {/* Línea dorada superior */}
        <div className="h-[2px] bg-gradient-to-r from-[#d4af37]/0 via-[#d4af37] to-[#d4af37]/0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid #d5d5d5" }}>
          <div className="flex items-center gap-3">
            <h6
              className="text-[15px] font-light text-[#1e293b] tracking-[0.15em] uppercase"
              style={{ fontFamily: "var(--font-sans, sans-serif)" }}
            >
              Tu carrito
            </h6>
            {count > 0 && (
              <span className="bg-[#1e293b] text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                {count}
              </span>
            )}
          </div>
          <button
            onClick={closeDrawer}
            className="w-8 h-8 flex items-center justify-center text-[#334155]/40 hover:text-[#1e293b] hover:bg-[#eaeaea] rounded-full transition-all duration-200"
            aria-label="Cerrar carrito"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Contenido */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 text-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-[#eaeaea] flex items-center justify-center">
                <ShoppingBag className="h-8 w-8 text-[#334155]/30" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#d4af37]/20 flex items-center justify-center">
                <span className="text-[#d4af37] text-xs">0</span>
              </div>
            </div>
            <div className="space-y-2">
              <p
                className="text-[#334155]/70 text-sm font-light"
                style={{ fontFamily: "var(--font-sans, sans-serif)" }}
              >
                Tu carrito está vacío
              </p>
              <p className="text-[#334155]/40 text-[11px] tracking-wide">
                Descubre nuestra colección de joyería
              </p>
            </div>
            <button
              onClick={closeDrawer}
              className="mt-2 flex items-center gap-2 text-[#1e293b] text-[11px] font-medium uppercase tracking-[0.2em] hover:gap-3 transition-all duration-200 group"
            >
              Ver catálogo
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        ) : (
          <>
            {/* Lista de items */}
            <div className="flex-1 overflow-y-auto px-6 py-2 scrollbar-thin">
              <div className="divide-y divide-[#d5d5d5]">
                {items.map((item) => (
                  <div key={item.cartKey ?? item.id} className="flex gap-4 py-5">
                    {/* Imagen */}
                    <div className="relative w-[72px] h-[72px] flex-shrink-0 bg-[#eaeaea] overflow-hidden">
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
                          <ShoppingBag className="h-6 w-6 text-[#334155]/20" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h6
                            className="text-[#1e293b] text-[13px] font-light leading-snug line-clamp-2"
                            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
                          >
                            {item.name}
                          </h6>
                          {item.size && (
                            <p className="text-[10px] text-[#334155]/40 mt-0.5">Talla: {item.size}</p>
                          )}
                          {item.engravingText && (
                            <p className="text-[10px] text-[#334155]/40 mt-0.5 italic">
                              Grabado: &ldquo;{item.engravingText}&rdquo;
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(item.cartKey ?? item.id)}
                          className="flex-shrink-0 p-1 text-[#334155]/30 hover:text-red-500 transition-colors mt-0.5"
                          aria-label="Eliminar producto"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        {/* Controles de cantidad */}
                        <div className="flex items-center border border-[#d5d5d5] bg-white">
                          <button
                            onClick={() => updateQuantity(item.cartKey ?? item.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center text-[#334155]/50 hover:text-[#1e293b] hover:bg-[#f4f4f4] transition-all"
                            aria-label="Reducir cantidad"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-3 text-[13px] font-medium text-[#1e293b] min-w-[2rem] text-center tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.cartKey ?? item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                            className="w-7 h-7 flex items-center justify-center text-[#334155]/50 hover:text-[#1e293b] hover:bg-[#f4f4f4] transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                            aria-label="Aumentar cantidad"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Precio */}
                        <span className="text-[#d4af37] text-[13px] font-semibold tabular-nums">
                          {formatARS(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-6 space-y-4" style={{ borderTop: "1px solid #d5d5d5", backgroundColor: "#eaeaea" }}>
              {/* Desglose */}
              <div className="space-y-2 text-[12px]">
                <div className="flex justify-between text-[#334155]/60 uppercase tracking-[0.15em]">
                  <span>{count} {count === 1 ? "producto" : "productos"}</span>
                  <span>{formatARS(total)}</span>
                </div>
                <div className="flex justify-between text-[#334155]/40 uppercase tracking-[0.15em]">
                  <span>Envío</span>
                  <span className="text-emerald-600/80">A coordinar</span>
                </div>
              </div>

              {/* Separador dorado */}
              <div className="h-px bg-gradient-to-r from-[#d4af37]/0 via-[#d4af37]/30 to-[#d4af37]/0" />

              {/* Total */}
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] font-medium text-[#334155]/50 uppercase tracking-[0.2em]">
                  Total estimado
                </span>
                <span
                  className="text-2xl font-light text-[#1e293b]"
                  style={{ fontFamily: "var(--font-sans, sans-serif)" }}
                >
                  {formatARS(total)}
                </span>
              </div>

              {/* Botón checkout */}
              <Link
                href="/checkout"
                onClick={closeDrawer}
                className="group flex items-center justify-center gap-3 w-full h-12 bg-[#1e293b] text-white text-[11px] font-bold uppercase tracking-[0.25em] hover:bg-[#334155] transition-colors duration-200"
              >
                Ir al pago
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
              </Link>

              {/* Link secundario */}
              <button
                onClick={closeDrawer}
                className="w-full text-center text-[10px] text-[#334155]/40 hover:text-[#1e293b] uppercase tracking-[0.2em] transition-colors duration-200"
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
