import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = { title: "Nuevo producto | Admin" };

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#111111] mb-6">Nuevo producto</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
