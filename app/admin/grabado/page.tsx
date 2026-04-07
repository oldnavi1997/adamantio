import { prisma } from "@/lib/prisma";
import { EngravingPanel } from "@/components/admin/EngravingPanel";

export default async function GrabadoPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      select: { id: true, name: true, category: true, engravingEnabled: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#111111]">Control de grabado</h1>
        <p className="text-sm text-gray-400 mt-1">
          Activa o desactiva la opción de grabado personalizado por producto, categoría o de forma masiva.
        </p>
      </div>
      <EngravingPanel products={products} categories={categories} />
    </div>
  );
}
