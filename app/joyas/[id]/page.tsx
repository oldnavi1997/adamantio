import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ImageGallery } from "@/components/product/ImageGallery";
import { ProductDetails } from "@/components/product/ProductDetails";
import { formatPEN } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return { title: "Producto no encontrado" };

  const description = product.description || `${product.name} | Adamantio`;
  const image = product.imageUrls?.[0] ?? product.imageUrl ?? null;
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/joyas/${id}`;

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      url,
      siteName: "Adamantio",
      type: "website",
      ...(image && {
        images: [{ url: image, width: 1200, height: 630, alt: product.name }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      ...(image && { images: [image] }),
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id, isActive: true },
  });

  if (!product) notFound();

  const images = product.imageUrls.length > 0 ? product.imageUrls : (product.imageUrl ? [product.imageUrl] : []);

  return (
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
          <div>
            <h6 className="text-2xl md:text-3xl font-semibold text-[#111111] leading-tight">
              {product.name}
            </h6>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-4">
            <span className="text-xl font-normal text-[#111111]">
              {formatPEN(Number(product.price))}
            </span>
            {product.freeShipping && (
              <span className="bg-green-50 text-green-700 text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-1 rounded-full">
                Envío gratis
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div
              className="text-sm text-[#111111]/60 leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}

          {/* Divider */}
          <div className="border-t border-[#111111]/8" />

          {/* Interactive section: sizes, add to cart, accordions, engraving */}
          <ProductDetails product={product} />
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
  );
}
