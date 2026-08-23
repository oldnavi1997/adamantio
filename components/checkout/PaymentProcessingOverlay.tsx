"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

interface PaymentProcessingOverlayProps {
  visible: boolean;
  message?: string;
}

/**
 * Capa modal que bloquea la página mientras la pasarela procesa el cobro.
 *
 * Va por portal a `document.body` para que ningún `overflow` o `transform` de
 * los contenedores del checkout la recorte.
 *
 * **Sobre el z-index (70).** Está por encima de todo lo del sitio (el valor más
 * alto propio es 60) pero deliberadamente MUY por debajo de las capas que monta
 * Krypton: el desafío 3D Secure de Izipay se renderiza en un popin propio y, si
 * lo tapáramos, el comprador no podría completar la autenticación y el pago
 * quedaría colgado. `IzipayForm` además se aparta sola en cuanto detecta ese
 * popin; esto es la segunda línea de defensa, no la única.
 */
export function PaymentProcessingOverlay({
  visible,
  message = "Procesando pago, por favor espera…",
}: PaymentProcessingOverlayProps) {
  // Bloquea el scroll del documento mientras está visible.
  useEffect(() => {
    if (!visible) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previo;
    };
  }, [visible]);

  // Anula la navegación por teclado hacia lo que hay debajo (Tab, Enter, Esc).
  // El clic ya lo detiene la propia capa, que cubre el viewport completo.
  useEffect(() => {
    if (!visible) return;
    const alPulsar = (e: KeyboardEvent) => {
      // Deja pasar lo que ocurra dentro del formulario de Izipay: durante un
      // desafío 3DS el comprador todavía tiene que poder escribir.
      const dentroDeIzipay = (e.target as HTMLElement | null)?.closest?.(
        "#izipay-form, [class*='kr-']"
      );
      if (dentroDeIzipay) return;
      e.preventDefault();
      e.stopPropagation();
    };
    document.addEventListener("keydown", alPulsar, true);
    return () => document.removeEventListener("keydown", alPulsar, true);
  }, [visible]);

  // Avisa si el comprador intenta cerrar la pestaña a mitad del cobro.
  useEffect(() => {
    if (!visible) return;
    const alSalir = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", alSalir);
    return () => window.removeEventListener("beforeunload", alSalir);
  }, [visible]);

  // `visible` arranca en false, así que en SSR siempre sale por aquí y nunca se
  // toca `document`: no hace falta un estado de "ya montado".
  if (!visible || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-live="assertive"
      aria-label={message}
      style={{ zIndex: 70 }}
      className="fixed inset-0 flex items-center justify-center bg-[#111111]/70 backdrop-blur-sm px-6"
    >
      <div className="bg-white px-8 py-9 max-w-sm w-full text-center shadow-xl">
        <span
          aria-hidden="true"
          className="mx-auto mb-5 block h-9 w-9 animate-spin rounded-full border-2 border-[#d5d5d5] border-t-[#1a1a2e]"
        />
        <p className="text-sm font-medium text-[#111111]">{message}</p>
        <p className="mt-2 text-xs leading-relaxed text-[#111111]/50">
          No cierres ni recargues esta página.
        </p>
      </div>
    </div>,
    document.body
  );
}
