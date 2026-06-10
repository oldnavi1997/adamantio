import { prisma } from "@/lib/prisma";
import { EngravingPanel } from "@/components/admin/EngravingPanel";
import { getGlobalEngravingSamples } from "@/lib/engraving";

export default async function GrabadoPage() {
  const [products, categories, globalSamples] = await Promise.all([
    prisma.product.findMany({
      select: { id: true, name: true, category: true, engravingEnabled: true, engravingImages: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    getGlobalEngravingSamples(),
  ]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#111111]">Control de grabado</h1>
        <p className="text-sm text-gray-400 mt-1">
          Gestiona las imágenes de ejemplo del grabado y activa o desactiva la opción por producto, categoría o de forma masiva.
        </p>
      </div>
      <EngravingPanel products={products} categories={categories} globalSamples={globalSamples} />
    </div>
  );
}
