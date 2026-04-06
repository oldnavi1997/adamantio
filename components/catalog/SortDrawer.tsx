"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

const OPTIONS = [
  { value: "featured",     label: "Destacados" },
  { value: "best_selling", label: "Más vendidos" },
  { value: "name_asc",     label: "Alfabéticamente, A-Z" },
  { value: "name_desc",    label: "Alfabéticamente, Z-A" },
  { value: "price_asc",    label: "Precio: menor a mayor" },
  { value: "price_desc",   label: "Precio: mayor a menor" },
  { value: "oldest",       label: "Fecha: antiguo a nuevo" },
  { value: "newest",       label: "Fecha: nuevo a antiguo" },
];

export function SortDrawer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "newest";
  const [open, setOpen] = useState(false);

  const currentLabel = OPTIONS.find((o) => o.value === currentSort)?.label ?? "Ordenar";

  const handleSelect = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  };

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-[11px] uppercase tracking-[0.1em] text-[#111111]/60 select-none"
      >
        <span>{currentLabel}</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-400 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer panel */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#111111]/15" />
        </div>

        {/* Title */}
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#111111]/40 px-5 py-3 border-b border-[#dadadd]">
          Ordenar por
        </p>

        {/* Options */}
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            className="w-full flex items-center justify-between px-5 py-4 text-left text-[13px] text-[#111111] border-b border-[#dadadd]/60 active:bg-[#f5f5f4]"
          >
            {opt.label}
            {currentSort === opt.value && <Check className="h-4 w-4 text-[#111111]" />}
          </button>
        ))}

        {/* Safe area bottom padding */}
        <div className="h-6 pb-safe" />
      </div>
    </>
  );
}
