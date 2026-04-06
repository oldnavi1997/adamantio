import Link from "next/link";
import { ProductWithCategory } from "@/types";
import { ProductCard } from "@/components/catalog/ProductCard";

interface FeaturedProductsProps {
  products: ProductWithCategory[];
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Section header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-[10px] font-medium text-[#d4af37] uppercase tracking-[0.3em] mb-3">
              Selección
            </p>
            <h2
              className="text-3xl md:text-4xl font-light text-[#111111] leading-tight"
              style={{ fontFamily: "var(--font-sans, sans-serif)" }}
            >
              Productos destacados
            </h2>
          </div>
          <Link
            href="/joyas?featured=true"
            className="hidden sm:flex items-center gap-2.5 text-[11px] font-medium text-[#111111]/50 hover:text-[#d4af37] uppercase tracking-[0.2em] transition-colors group"
          >
            Ver todos
            <div className="h-px w-6 bg-current group-hover:w-10 transition-all duration-300" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Mobile "ver todos" */}
        <div className="mt-10 text-center sm:hidden">
          <Link
            href="/joyas?featured=true"
            className="inline-flex items-center gap-2 text-[11px] font-medium text-[#111111]/60 uppercase tracking-[0.2em]"
          >
            Ver todos los destacados
            <div className="h-px w-5 bg-current" />
          </Link>
        </div>
      </div>
    </section>
  );
}
