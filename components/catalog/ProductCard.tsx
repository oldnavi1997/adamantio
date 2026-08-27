import Link from "next/link";
import Image from "next/image";
import { ProductWithCategory } from "@/types";
import { formatPEN, precioConOferta } from "@/lib/utils";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { productThumbnail } from "@/lib/media";

interface ProductCardProps {
  product: ProductWithCategory;
  view?: "dense" | "normal" | "list";
}

export function ProductCard({ product, view = "dense" }: ProductCardProps) {
  const imageUrl = productThumbnail(product);
  const { precio, antes, descuento } = precioConOferta(product);

  // Arriba a la izquierda a propósito: la derecha es del corazón de la
  // wishlist y el centro se lo come el velo de "Sin stock".
  const etiquetaOferta = antes !== null && (
    <span className="bg-[#d4af37] text-[#111111] text-[9px] font-semibold uppercase tracking-[0.15em] px-2 py-1">
      -{descuento}%
    </span>
  );

  if (view === "dense") {
    return (
      <Link href={`/joyas/${product.id}`} className="group block">
        <div className="relative aspect-square bg-[#f5f5f4] overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
              sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 48 48" fill="none" className="text-[#111111]/15">
                <path d="M6 24C6 24 10 16 24 16C38 16 42 24 42 24C42 24 38 32 24 32C10 32 6 24 6 24Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <circle cx="24" cy="24" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              </svg>
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px]">
              <span className="text-[10px] font-medium text-[#111111]/50 uppercase tracking-[0.2em] border border-[#111111]/20 px-3 py-1.5">
                Sin stock
              </span>
            </div>
          )}
          {etiquetaOferta && <div className="absolute top-2 left-2 z-10">{etiquetaOferta}</div>}
          <WishlistButton product={product} variant="card" />
        </div>
        <div className="mt-2 text-center">
          <p className="text-xs font-medium text-[#111111] line-clamp-1 leading-snug">
            {product.name}
          </p>
          <p className="text-[11px] mt-0.5">
            <span className={antes !== null ? "text-[#111111] font-medium" : "text-[#111111]/50"}>
              {formatPEN(precio)}
            </span>
            {antes !== null && (
              <span className="text-[#111111]/35 line-through ml-1.5">{formatPEN(antes)}</span>
            )}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/joyas/${product.id}`}
      className="group block bg-white border border-[#dadadd] overflow-hidden hover:border-[#1c1c1c]/20 hover:shadow-sm transition-all duration-400"
    >
      {/* Image container */}
      <div className="relative aspect-square bg-[#f9f8f4] overflow-hidden cursor-pointer">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-[#111111]/15">
              <path d="M6 24C6 24 10 16 24 16C38 16 42 24 42 24C42 24 38 32 24 32C10 32 6 24 6 24Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <circle cx="24" cy="24" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </svg>
          </div>
        )}

        {(etiquetaOferta || product.freeShipping) && (
          <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-1.5">
            {etiquetaOferta}
            {product.freeShipping && (
              <span className="bg-[#111111] text-white text-[9px] font-medium uppercase tracking-[0.15em] px-2.5 py-1">
                Envío gratis
              </span>
            )}
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px]">
            <span className="text-[10px] font-medium text-[#111111]/50 uppercase tracking-[0.2em] border border-[#111111]/20 px-3 py-1.5">
              Sin stock
            </span>
          </div>
        )}
        <WishlistButton product={product} variant="card" />
      </div>

      {/* Divider */}
      <div className="border-t border-[#dadadd]" />

      {/* Info */}
      <div className="px-4 py-3.5">
        {product.category && (
          <p className="text-[9px] font-medium text-[#111111]/40 uppercase tracking-[0.2em] mb-1.5">
            {product.category}
          </p>
        )}
        <h3
          className="text-sm font-medium text-[#111111] line-clamp-2 leading-snug group-hover:text-[#1c1c1c] transition-colors duration-300"
          style={{ fontFamily: "var(--font-sans, sans-serif)" }}
        >
          {product.name}
        </h3>
        <div className="mt-3 flex items-center gap-2.5">
          <span className="font-semibold text-sm text-[#111111]">
            {formatPEN(precio)}
          </span>
          {antes !== null && (
            <>
              <span className="text-sm text-[#111111]/35 line-through">{formatPEN(antes)}</span>
              <span className="text-[10px] font-medium text-[#d4af37] tracking-wider">
                -{descuento}%
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
