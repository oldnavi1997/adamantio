import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductTable } from "@/components/admin/ProductTable";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "Productos | Admin" };

export type PosStockData = {
  stock: number;
  stockHombre: number;
  stockMujer: number;
  stockAlmacen: number;
  stockAlmacenHombre: number;
  stockAlmacenMujer: number;
};

/** Solo los campos que la tabla del panel necesita — evita enviar al cliente
 *  description, productDetails, sizeInfo y contentImages[] (potencialmente enormes). */
export type AdminProductRow = {
  id: string;
  name: string;
  imageUrl: string | null;
  imageUrls: string[];
  category: string | null;
  price: number;
  comparePrice: number | null;
  sku: string | null;
  esPar: boolean;
  isActive: boolean;
};

export default async function AdminProductsPage() {
  const [raw, categories] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        imageUrls: true,
        category: true,
        price: true,
        comparePrice: true,
        sku: true,
        esPar: true,
        isActive: true,
        stock: true,
        stockHombre: true,
        stockMujer: true,
        stockAlmacen: true,
        stockAlmacenHombre: true,
        stockAlmacenMujer: true,
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const posStock: Record<string, PosStockData> = {};
  const products: AdminProductRow[] = raw.map((p) => {
    if (p.sku) {
      posStock[p.sku] = {
        stock: p.stock,
        stockHombre: p.stockHombre,
        stockMujer: p.stockMujer,
        stockAlmacen: p.stockAlmacen,
        stockAlmacenHombre: p.stockAlmacenHombre,
        stockAlmacenMujer: p.stockAlmacenMujer,
      };
    }
    return {
      id: p.id,
      name: p.name,
      imageUrl: p.imageUrl,
      imageUrls: p.imageUrls,
      category: p.category,
      price: Number(p.price), // Decimal → number (serializable hacia el cliente)
      comparePrice: p.comparePrice == null ? null : Number(p.comparePrice),
      sku: p.sku,
      esPar: p.esPar,
      isActive: p.isActive,
    };
  });

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-[9px] font-medium text-[#d4af37] uppercase tracking-[0.3em] mb-2">
            Gestión
          </p>
          <h1
            className="text-2xl font-light text-[#111111]"
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
          >
            Productos
          </h1>
        </div>
        <Link href="/admin/productos/nuevo">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Nuevo producto
          </Button>
        </Link>
      </div>
      <div className="bg-white border border-[#111111]/6">
        <ProductTable products={products} categories={categories} posStock={posStock} />
      </div>
    </div>
  );
}
