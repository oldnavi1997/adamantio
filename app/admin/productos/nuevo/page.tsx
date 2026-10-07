import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/ProductForm";
import { siguienteSku } from "@/lib/sku";

export const metadata = { title: "Nuevo producto | Admin" };

export default async function NewProductPage() {
  const [categories, skuSugerido] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    siguienteSku(prisma),
  ]);
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#111111] mb-6">Nuevo producto</h1>
      <ProductForm categories={categories} skuSugerido={skuSugerido} />
    </div>
  );
}
