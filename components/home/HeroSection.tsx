import Link from "next/link";
import { Fraunces } from "next/font/google";
import { ArrowRight } from "lucide-react";
import type { HeroHome } from "@/lib/home-hero";
import { HeroCarrusel } from "@/components/home/HeroCarrusel";

// Se declara aquí y no en el layout: solo la home descarga la serif.
const fraunces = Fraunces({ subsets: ["latin"], style: ["normal", "italic"], display: "swap" });

const cta =
  "inline-flex items-center justify-center gap-2.5 min-h-[52px] w-full min-[900px]:w-auto px-6 text-xs font-semibold uppercase tracking-[2px] transition-colors duration-300";

export function HeroSection({ datos }: { datos: HeroHome }) {
  const { productos, pruebaSocial } = datos;

  return (
    <section className="grid min-[900px]:grid-cols-[46fr_54fr] min-[900px]:min-h-[calc(100svh-109px)] bg-white overflow-hidden">
      {/* Texto */}
      <div className="flex flex-col justify-center px-4 py-8 min-[900px]:px-[clamp(2rem,6vw,6rem)] min-[900px]:py-12 motion-safe:animate-fade-in">
        {pruebaSocial && (
          <p className="mb-4 flex items-center gap-2 text-[13px] text-[#5E584D]">
            <span aria-hidden="true" className="tracking-[2px] text-[#C6A15B]">★★★★★</span>
            {pruebaSocial}
          </p>
        )}

        {/* Con `!`: el `h1` sin capa de globals.css le gana a las utilidades. */}
        <h1 className={`${fraunces.className} text-[34px]! min-[900px]:text-[54px]! leading-[1.1]! font-medium! text-[#1E1B16]`}>
          Anillos de pareja con <em className="italic text-[#8A6D3B]">mensajes ocultos</em> en plata 925
        </h1>

        <p className="mt-5 max-w-[480px] text-base leading-relaxed text-[#5E584D]">
          Graben una promesa que solo ustedes dos pueden revelar. Talla ajustable y envío a todo el Perú.
        </p>

        <div className="mt-7 flex flex-col gap-3 min-[900px]:flex-row min-[900px]:flex-wrap">
          <Link
            href={datos.rutaCategoria}
            className={`${cta} group relative overflow-hidden bg-[#1E1B16] text-white hover:bg-[#333]`}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent cta-brillo"
            />
            Ver anillos de pareja
            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:translate-x-1"
            />
          </Link>
        </div>

      </div>

      {/* Imagen: arriba en móvil. El degradé cubre cualquier borde transparente. */}
      <div className="relative order-first min-[900px]:order-none h-[55svh] min-[900px]:h-auto bg-gradient-to-br from-[#221E18] to-[#4A4030]">
        {productos.length > 0 && <HeroCarrusel productos={productos} />}
      </div>
    </section>
  );
}
