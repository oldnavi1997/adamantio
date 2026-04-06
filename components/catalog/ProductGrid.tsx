import { ProductWithCategory } from "@/types";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: ProductWithCategory[];
  view?: string;
  mview?: string;
}

export function ProductGrid({ products, view = "dense", mview = "2" }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 border border-[#111111]/10 flex items-center justify-center mb-6">
          <svg width="28" height="28" viewBox="0 0 48 48" fill="none" className="text-[#111111]/20">
            <path d="M6 24C6 24 10 16 24 16C38 16 42 24 42 24C42 24 38 32 24 32C10 32 6 24 6 24Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <circle cx="24" cy="24" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <line x1="8" y1="8" x2="40" y2="40" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </div>
        <p className="text-sm font-light text-[#111111]/50" style={{ fontFamily: "var(--font-sans, sans-serif)" }}>
          No se encontraron productos
        </p>
        <p className="text-[11px] text-[#111111]/30 mt-2 uppercase tracking-[0.15em]">
          Intenta ajustar los filtros
        </p>
      </div>
    );
  }

  const mobileClass = mview === "1" ? "grid-cols-1" : "grid-cols-2";
  const desktopClass =
    view === "list" ? "sm:grid-cols-6" : view === "normal" ? "sm:grid-cols-4" : "sm:grid-cols-3";
  const gridClass = `grid ${mobileClass} ${desktopClass} gap-x-5 gap-y-8`;

  const cardView = "dense";

  return (
    <div className={gridClass}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} view={cardView as "dense" | "normal" | "list"} />
      ))}
    </div>
  );
}
