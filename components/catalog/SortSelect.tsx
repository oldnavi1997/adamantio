"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

const OPTIONS = [
  { value: "featured",    label: "Destacados" },
  { value: "best_selling",label: "Más vendidos" },
  { value: "name_asc",    label: "Alfabéticamente, A-Z" },
  { value: "name_desc",   label: "Alfabéticamente, Z-A" },
  { value: "price_asc",   label: "Precio: menor a mayor" },
  { value: "price_desc",  label: "Precio: mayor a menor" },
  { value: "oldest",      label: "Fecha: antiguo a nuevo" },
  { value: "newest",      label: "Fecha: nuevo a antiguo" },
];

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "newest";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLabel = OPTIONS.find((o) => o.value === currentSort)?.label ?? "Ordenar";

  const handleSelect = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-[11px] uppercase tracking-[0.1em] text-[#111111]/60 hover:text-[#111111] transition-colors duration-200 select-none"
      >
        <span>{currentLabel}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[210px] bg-white border border-[#dadadd] shadow-sm py-1">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-left text-[11px] uppercase tracking-[0.1em] transition-colors duration-150 hover:bg-[#f5f5f4] text-[#111111]/70 hover:text-[#111111]"
            >
              {opt.label}
              {currentSort === opt.value && (
                <Check className="h-3 w-3 text-[#111111] flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
