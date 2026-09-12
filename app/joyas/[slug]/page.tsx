import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { OG_LADO, ogImageUrl } from "@/lib/media";
import { ImageGallery } from "@/components/product/ImageGallery";
import { ProductDetails } from "@/components/product/ProductDetails";
import { VarianteProvider } from "@/components/product/VarianteContext";
import { PrecioCabecera } from "@/components/product/PrecioCabecera";
import { precioConOferta, productPath } from "@/lib/utils";
import { opcionesDeVariante } from "@/lib/variantes";
import { resolveEngravingSamples } from "@/lib/engraving";
import { productThumbnail } from "@/lib/media";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * El tramo de la URL puede ser el slug o, en enlaces viejos y en productos que
 * el POS creó sin slug, el `id`. Se aceptan los dos y la página redirige al
 * canónico, para no partir en dos la autoridad de cada ficha en Google.
 */
function buscarProducto(param: string) {
  return prisma.product.findFirst({
    where: { OR: [{ slug: param }, { id: param }] },
    include: { tallas: true },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await buscarProducto(slug);
  if (!product) return { title: "Producto no encontrado" };

  const description = product.description || `${product.name} | Adamantio`;
  // Cuadrada y en JPG: ver `ogImageUrl`. Antes se declaraba 1200x630 sobre una
  // foto cuadrada, y WhatsApp reservaba una tarjeta apaisada.
  const foto = productThumbnail(product);
  const image = foto ? ogImageUrl(foto) : null;
  const url = `${process.env.NEXT_PUBLIC_APP_URL}${productPath(product)}`;

  return {
    title: product.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: product.name,
      description,
      url,
      siteName: "Adamantio",
      type: "website",
      ...(image && {
        images: [{ url: image, width: OG_LADO, height: OG_LADO, alt: product.name }],
      }),
    },
    twitter: {
      card: "summary",
      title: product.name,
      description,
      ...(image && { images: [image] }),
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await buscarProducto(slug);

  if (!product || !product.isActive) notFound();

  // Llegó por el `id` teniendo slug: 308 al canónico.
  if (product.slug && product.slug !== slug) permanentRedirect(productPath(product));

  const engravingSamples = product.engravingEnabled ? await resolveEngravingSamples(product) : [];

  const images = product.imageUrls.length > 0 ? product.imageUrls : (product.imageUrl ? [product.imageUrl] : []);
  const image = productThumbnail(product);
  const { precio, antes, descuento } = precioConOferta(product);
  // Se calcula aquí, en el servidor, y viaja como objeto plano: así el
  // `Decimal` de Prisma no cruza al navegador.
  const opcionesVariante = opcionesDeVariante(product);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://adamantio.pe";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? product.name,
    ...(image && { image }),
    url: `${baseUrl}${productPath(product)}`,
    brand: { "@type": "Brand", name: "Adamantio" },
    // Con variantes el precio deja de ser uno solo: la ficha puede mostrar
    // desde el anillo suelto más barato hasta la pareja. Declarar el precio de
    // la pareja a secas haría que Google marcara el desajuste contra la página.
    offers: opcionesVariante.porVariante
      ? {
          "@type": "AggregateOffer",
          lowPrice: Math.min(...opcionesVariante.variantes.map((v) => v.precio)).toFixed(2),
          highPrice: Math.max(...opcionesVariante.variantes.map((v) => v.precio)).toFixed(2),
          offerCount: opcionesVariante.variantes.length,
          priceCurrency: "PEN",
          availability: "https://schema.org/InStock",
          url: `${baseUrl}${productPath(product)}`,
        }
      : {
          "@type": "Offer",
          // Es el precio rebajado si hay oferta: `price` es siempre lo que se cobra.
          price: precio.toFixed(2),
          priceCurrency: "PEN",
          availability: product.stock > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          url: `${baseUrl}${productPath(product)}`,
        },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 sm:py-10">
      {/* Breadcrumb */}
      <nav className="hidden sm:flex items-center gap-2 mb-8 text-[10px] uppercase tracking-[0.2em] text-[#111111]/35">
        <Link href="/joyas" className="hover:text-[#111111]/60 transition-colors">
          Catálogo
        </Link>
        <span>/</span>
        <span className="text-[#111111]/55">{product.category}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-16">
        {/* Gallery */}
        <div className="-mx-5 sm:mx-0">
          <ImageGallery images={images} name={product.name} />
        </div>

        {/* Details */}
        <div className="space-y-4">
          <VarianteProvider opciones={opcionesVariante}>
            <div>
              <h6 className="text-2xl md:text-3xl font-semibold text-[#111111] leading-tight">
                {product.name}
              </h6>
            </div>

            {/* Precio: sigue a la variante elegida */}
            <PrecioCabecera
              oferta={{ precio, antes, descuento }}
              freeShipping={product.freeShipping}
            />

            {/* Description */}
            {product.description && (
              <div
                className="text-sm text-[#111111]/60 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            )}

            {/* Divider */}
            <div className="border-t border-[#111111]/8" />

            {/* Interactive section: variante, sizes, add to cart, accordions, engraving */}
            <ProductDetails product={product} engravingSamples={engravingSamples} />
          </VarianteProvider>
        </div>
      </div>

      {/* Content images */}
      {product.contentImages.length > 0 && (
        <div className="mt-6 flex flex-col">
          {product.contentImages.map((src, i) =>
            /\.(mp4|webm|mov)(\?|$)/i.test(src) ? (
              <video
                key={i}
                src={src}
                className="w-full h-auto block"
                muted
                loop
                playsInline
                controls
              />
            ) : (
              <img
                key={i}
                src={src}
                alt={`${product.name} ${i + 1}`}
                loading="lazy"
                className="w-full h-auto block"
              />
            )
          )}
        </div>
      )}
    </div>
    </>
  );
}
