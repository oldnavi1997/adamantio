export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { OG_DEFECTO } from "@/lib/seo";
import { precioConOferta, productPath } from "@/lib/utils";

export const metadata: Metadata = {
  // `absolute` evita la plantilla "%s | Adamantio" del layout: el título de la
  // home ya es la marca, y encadenarla daba "… en Perú | Adamantio".
  title: { absolute: "Adamantio – Joyería y Accesorios en Perú" },
  description: "Descubre collares, pulseras, anillos y aretes en plata 925 con mensajes secretos. El regalo con significado. Envío a todo Perú.",
  openGraph: {
    title: "Adamantio – Joyería y Accesorios en Perú",
    description: "Descubre collares, pulseras, anillos y aretes en plata 925 con mensajes secretos. El regalo con significado. Envío a todo Perú.",
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
import { getHeroHome } from "@/lib/home-hero";

export default async function HomePage() {
  const [featuredProducts, spotlightConfig, hero] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    getVideoSpotlightConfig(),
    getHeroHome(),
  ]);

  const spotlightProductIds = spotlightConfig.map((c) => c.productId);
  const spotlightProducts = spotlightProductIds.length
    ? await prisma.product.findMany({
        where: { id: { in: spotlightProductIds }, isActive: true },
        select: { id: true, slug: true, name: true, price: true, comparePrice: true },
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
      priceAntes: precioConOferta(product).antes?.toFixed(2) ?? null,
      href: productPath(product),
      video: c.video,
      poster: c.poster,
    }];
  });

  return (
    <div className="mx-auto w-full min-[900px]:max-w-7xl min-[900px]:px-8 min-[900px]:pt-6">
      <HeroSection datos={hero} />

      <VideoSpotlight items={spotlightItems} />

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
                Cada pieza está elaborada en plata de ley que perdura en el tiempo. Calidad que se siente y se ve, para un regalo que perdure tanto como su vínculo.
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
                Grabados ocultos que solo ustedes conocen. Un detalle íntimo que convierte cada joya en un símbolo único de su conexión.
              </p>
            </div>
          </div>
        </div>
      </section>

      <FeaturedProducts products={featuredProducts} />
      <TrustBar />
    </div>
  );
}
