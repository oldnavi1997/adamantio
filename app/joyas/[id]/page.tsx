import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ImageGallery } from "@/components/product/ImageGallery";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { formatPEN } from "@/lib/utils";
import AccordionItem from "@/components/product/AccordionItem";

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
            <h4 className="text-2xl md:text-3xl font-semibold text-[#111111] leading-tight">
              {product.name}
            </h4>
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

          {/* Add to cart */}
          <AddToCartButton product={product} />

          {/* Divider */}
          <div className="border-t border-[#111111]/8" />

          {/* Accordions */}
          {product.productDetails && (
            <AccordionItem title="Detalles del producto">
              <div
                className="text-sm text-[#111111]/70 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.productDetails }}
              />
            </AccordionItem>
          )}

          {product.sizeInfo && (
            <AccordionItem title="Guía de tallas">
              <div
                className="text-sm text-[#111111]/70 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.sizeInfo }}
              />
            </AccordionItem>
          )}

          <AccordionItem title="Envío">
            <div className="text-sm text-[#111111]/60 leading-relaxed space-y-3">
              <p><span className="font-medium text-[#111111]/80">Método de envío:</span> Olva Courier y Shalom.</p>
              <p><span className="font-medium text-[#111111]/80">Área de envío:</span> Nacional.</p>
              <div>
                <p className="font-medium text-[#111111]/80 mb-1">Tarifa de envío:</p>
                <ul className="space-y-0.5 pl-3">
                  <li>Shalom: 8 soles.</li>
                  <li>Olva Courier: 10–18 soles, puede variar según la región destino.</li>
                </ul>
              </div>
              <p><span className="font-medium text-[#111111]/80">Plazo de procesamiento:</span> 1–2 días laborables.</p>
              <p><span className="font-medium text-[#111111]/80">Plazo de envío:</span> 2–3 días después del procesamiento.</p>
            </div>
          </AccordionItem>

          <div className="border-t border-[#dadadd]" />
        </div>
      </div>
    </div>
  );
}
