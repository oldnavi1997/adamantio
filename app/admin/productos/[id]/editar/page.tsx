import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = { title: "Editar producto | Admin" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  type PosStockRow = { stockHombre: number; stockMujer: number; stockAlmacenHombre: number; stockAlmacenMujer: number };

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  const posStockRows = product.sku
    ? await prisma.$queryRaw<PosStockRow[]>`
        SELECT "stockHombre", "stockMujer", "stockAlmacenHombre", "stockAlmacenMujer"
        FROM pos."Product" WHERE sku = ${product.sku}
      `.catch(() => [] as PosStockRow[])
    : [];
  const posStock = posStockRows[0] ?? null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#111111] mb-6">Editar producto</h1>
      <ProductForm categories={categories} product={JSON.parse(JSON.stringify(product))} posStock={posStock} />
    </div>
  );
}
