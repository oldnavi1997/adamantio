"use client";

import { useEffect, useState } from "react";

const COOKIE_NAME = "cookie_consent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 año

function getConsent(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setConsent(value: "accepted" | "essential") {
  document.cookie = `${COOKIE_NAME}=${value}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getConsent()) setVisible(true);
  }, []);

  function accept() {
    setConsent("accepted");
    setVisible(false);
  }

  function essential() {
    setConsent("essential");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-slide-up">
      <div className="max-w-4xl mx-auto bg-primary text-white rounded-xl shadow-2xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-relaxed text-gray-200">
            Usamos cookies para mejorar tu experiencia de compra, analizar el tráfico y personalizar el contenido.
            Podés elegir qué cookies aceptar.
          </p>
        </div>
        <div className="flex gap-3 shrink-0 w-full sm:w-auto">
          <button
            onClick={essential}
            className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg border border-white/30 text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            Solo esenciales
          </button>
          <button
            onClick={accept}
            className="flex-1 sm:flex-none px-5 py-2 text-sm font-semibold rounded-lg bg-[var(--color-accent,#c9a84c)] text-primary hover:opacity-90 transition-opacity cursor-pointer"
          >
            Aceptar todo
          </button>
        </div>
      </div>
    </div>
  );
}
