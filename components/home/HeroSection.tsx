import Link from "next/link";

export function HeroSection() {
  return (
    <section
      className="hero-section relative overflow-hidden min-h-[88vh] flex items-center justify-end bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('https://res.cloudinary.com/dzqns7kss/image/upload/v1772684338/Mobile_Hero_resultado_i5xyd5.webp')",
      }}
    >
      {/* Desktop background image */}
      <style>{`
        @media (min-width: 641px) {
          .hero-section {
            background-image: url('https://res.cloudinary.com/dzqns7kss/image/upload/v1772684014/Hero_Image_Final_resultado-2048x1152-1_p9molx.webp') !important;
          }
        }
      `}</style>
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 py-24 md:py-0 w-full flex justify-end">
        <div className="max-w-xl text-right">
          {/* Pre-title */}
          <div className="flex items-center justify-end gap-3 mb-8 animate-[fade-in_0.6s_ease-out_both]">
            <span className="text-[10px] font-medium text-[#111111]/60 uppercase tracking-[0.3em]">
              Joyería Artesanal
            </span>
            <div className="h-px w-10 bg-[#111111]/40" />
          </div>

          {/* Main heading */}
          <h1
            className="text-5xl md:text-7xl font-light text-[#111111] leading-[1.08] mb-7 animate-[slide-up_0.7s_0.1s_cubic-bezier(0.22,1,0.36,1)_both]"
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
          >
            Joyas que cuentan
            <br />
            tu{" "}
            <em className="not-italic text-[#d4af37]">historia</em>
          </h1>

          {/* Subtitle */}
          <p className="text-[#111111]/60 text-lg leading-relaxed mb-10 font-light animate-[slide-up_0.7s_0.2s_cubic-bezier(0.22,1,0.36,1)_both]">
            Plata 925, baño de oro y piedras preciosas seleccionadas.<br className="hidden sm:block" />
            Diseño exclusivo, hecho para durar toda la vida.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap justify-end gap-4 animate-[slide-up_0.7s_0.3s_cubic-bezier(0.22,1,0.36,1)_both]">
            <Link
              href="/joyas"
              className="inline-flex items-center gap-3 bg-[#111111] text-white text-[11px] font-semibold uppercase tracking-[0.2em] px-8 py-4 hover:bg-[#333] transition-colors duration-300"
            >
              Ver colección
            </Link>
            <Link
              href="/preguntas-frecuentes"
              className="inline-flex items-center gap-3 border border-[#111111]/30 text-[#111111]/70 text-[11px] font-medium uppercase tracking-[0.2em] px-8 py-4 hover:border-[#111111] hover:text-[#111111] transition-all duration-300"
            >
              Conoce más
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
