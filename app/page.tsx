export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { OG_DEFECTO } from "@/lib/seo";

export const metadata: Metadata = {
  // `absolute` evita la plantilla "%s | Adamantio" del layout: el título de la
  // home ya es la marca, y encadenarla daba "… en Perú | Adamantio".
  title: { absolute: "Adamantio – Joyería y Accesorios en Perú" },
  description: "Descubrí collares, pulseras, anillos y aretes en plata 925 con mensajes secretos. El regalo con significado. Envío a todo Perú.",
  openGraph: {
    title: "Adamantio – Joyería y Accesorios en Perú",
    description: "Descubrí collares, pulseras, anillos y aretes en plata 925 con mensajes secretos. El regalo con significado. Envío a todo Perú.",
    url: "/",
    type: "website",
    images: [OG_DEFECTO],
  },
  twitter: { card: "summary", images: [OG_DEFECTO.url] },
};
import { HeroSection } from "@/components/home/HeroSection";
import { TrustBar } from "@/components/home/CategoryGrid";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { VideoSpotlight, type SpotlightItem } from "@/components/home/VideoSpotlight";
import { getVideoSpotlightConfig } from "@/lib/video-spotlight-server";

const FEATURED_CATEGORIES = [
  {
    name: "Anillos de Pareja",
    slug: "Anillos de Pareja",
    description:
      "Símbolos de un compromiso que trasciende lo visible. Cada anillo guarda un mensaje secreto que solo ustedes dos pueden revelar. Diseños en plata 925 que cuentan vuestra historia.",
    cta: "Ver anillos de pareja",
  },
  {
    name: "Pulseras",
    slug: "Pulseras",
    description:
      "Dos piezas que se complementan, como dos almas unidas. Pulseras de plata de ley para llevar el vínculo siempre cerca. El regalo perfecto para decir «siempre contigo».",
    cta: "Ver pulseras",
  },
] as const;

export default async function HomePage() {
  const [featuredProducts, spotlightConfig] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    getVideoSpotlightConfig(),
  ]);

  const spotlightProductIds = spotlightConfig.map((c) => c.productId);
  const spotlightProducts = spotlightProductIds.length
    ? await prisma.product.findMany({
        where: { id: { in: spotlightProductIds }, isActive: true },
        select: { id: true, name: true, price: true },
      })
    : [];
  const spotlightById = new Map(spotlightProducts.map((p) => [p.id, p]));

  const spotlightItems: SpotlightItem[] = spotlightConfig.flatMap((c) => {
    const product = spotlightById.get(c.productId);
    if (!product || !c.video) return [];
    return [{
      id: c.productId,
      name: product.name,
      price: Number(product.price).toFixed(2),
      href: `/joyas/${c.productId}`,
      video: c.video,
      poster: c.poster,
    }];
  });

  return (
    <>
      <HeroSection />

      {/* Intro */}
      <section className="py-16 px-5 sm:px-8 text-center max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-light text-[#111111] leading-snug mb-4">
          No solo joyas: mensajes ocultos y una conexión eterna
        </h2>
        <p className="text-sm text-[#111111]/55 leading-relaxed mb-8">
          Piezas en plata 925 que guardan un secreto solo para ustedes dos. Regalos con significado que cuentan vuestra historia.
        </p>
        <Link
          href="/joyas"
          className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#111111] border border-[#111111] px-7 py-3 hover:bg-[#111111] hover:text-white transition-colors duration-300"
        >
          Mira la colección
        </Link>
      </section>

      {/* Por qué Adamantio */}
      <section className="bg-[#f8f7f4] py-16 px-5 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#111111]/40 text-center mb-10">
            Por qué Adamantio
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-sm font-semibold text-[#111111] mb-2">Plata 925 de ley</h3>
              <p className="text-sm text-[#111111]/55 leading-relaxed">
                Cada pieza está elaborada en plata de ley que perdura en el tiempo. Calidad que se siente y se ve, para un regalo que perdure tanto como vuestro vínculo.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-sm font-semibold text-[#111111] mb-2">Talla única, para todos</h3>
              <p className="text-sm text-[#111111]/55 leading-relaxed">
                Diseños pensados para adaptarse a cada mano. Sin preocuparte por la talla: una sola pieza que se ajusta con elegancia a quien la lleve.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-sm font-semibold text-[#111111] mb-2">Mensajes secretos</h3>
              <p className="text-sm text-[#111111]/55 leading-relaxed">
                Grabados ocultos que solo ustedes conocen. Un detalle íntimo que convierte cada joya en un símbolo único de vuestra conexión.
              </p>
            </div>
          </div>
        </div>
      </section>

      <VideoSpotlight items={spotlightItems} />

      {/* Categorías destacadas */}
      <section className="py-16 px-5 sm:px-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
          {FEATURED_CATEGORIES.map((cat) => (
            <div key={cat.slug} className="bg-[#f8f7f4] p-8 flex flex-col gap-4">
              <h3 className="text-lg font-semibold text-[#111111]">{cat.name}</h3>
              <p className="text-sm text-[#111111]/55 leading-relaxed flex-1">{cat.description}</p>
              <Link
                href={`/joyas?categoria=${encodeURIComponent(cat.slug)}`}
                className="self-start text-[11px] font-semibold uppercase tracking-[0.2em] text-[#111111] border-b border-[#111111] pb-0.5 hover:text-[#c9a84c] hover:border-[#c9a84c] transition-colors"
              >
                {cat.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <TrustBar />
      <FeaturedProducts products={featuredProducts} />
    </>
  );
}
