"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import type { HeroProducto } from "@/lib/home-hero";
import { formatPEN } from "@/lib/utils";

const INTERVALO_MS = 5000;

export function HeroCarrusel({ productos }: { productos: HeroProducto[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: productos.length > 1 });
  const [activo, setActivo] = useState(0);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;
    const alSeleccionar = () => setActivo(emblaApi.selectedScrollSnap());
    emblaApi.on("select", alSeleccionar);
    return () => {
      emblaApi.off("select", alSeleccionar);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi || pausado || productos.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => emblaApi.scrollNext(), INTERVALO_MS);
    return () => clearInterval(id);
  }, [emblaApi, pausado, productos.length]);

  return (
    <div
      role="group"
      aria-roledescription="carrusel"
      aria-label="Productos destacados"
      className="absolute inset-0"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocusCapture={() => setPausado(true)}
      onBlurCapture={() => setPausado(false)}
    >
      <div ref={emblaRef} className="h-full overflow-hidden">
        <div className="flex h-full">
          {productos.map((p, i) => (
            <div
              key={p.href}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${i + 1} de ${productos.length}`}
              className="relative h-full min-w-0 flex-[0_0_100%]"
            >
              {p.foto && (
                <Image
                  src={p.foto}
                  alt={p.alt}
                  fill
                  // Solo la primera es el LCP; las demás no compiten con ella.
                  priority={i === 0}
                  sizes="(max-width: 899px) 100vw, (max-width: 1280px) 54vw, 660px"
                  className="object-cover"
                />
              )}

              <div className="absolute bottom-3 left-3 min-[900px]:bottom-6 min-[900px]:left-6 flex w-[min(300px,calc(100%-24px))] min-[900px]:w-[340px] items-center gap-3 rounded-[6px] bg-white p-2 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                {p.miniatura && (
                  <Image
                    src={p.miniatura}
                    alt=""
                    width={52}
                    height={52}
                    className="h-11 w-11 min-[900px]:h-[52px] min-[900px]:w-[52px] shrink-0 rounded object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[#1E1B16]" title={p.nombreCompleto}>
                    {p.nombre}
                  </p>
                  <p className="text-[13px] font-semibold text-[#8A6D3B]">{formatPEN(p.precio)}</p>
                </div>
                <Link
                  href={p.href}
                  aria-label={`Ver ${p.nombre}`}
                  className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded bg-[#1E1B16] px-4 text-[11px] font-semibold uppercase tracking-[2px] text-white hover:bg-[#333] transition-colors"
                >
                  Ver
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {productos.length > 1 && (
        <div className="absolute top-3 left-3 min-[900px]:top-5 min-[900px]:left-5 flex rounded-full bg-black/40 px-1">
          {productos.map((p, i) => (
            <button
              key={p.href}
              type="button"
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Ir a ${p.nombre}`}
              aria-current={i === activo ? "true" : undefined}
              className="flex h-7 w-6 items-center justify-center"
            >
              <span className={`h-1.5 w-1.5 rounded-full transition-colors ${i === activo ? "bg-[#C6A15B]" : "bg-white/70"}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
