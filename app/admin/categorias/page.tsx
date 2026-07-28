import { prisma } from "@/lib/prisma";
import { CategoryTable } from "@/components/admin/CategoryTable";

export const metadata = { title: "Categorías | Admin" };

export default async function AdminCategoriasPage() {
  const [categories, productCounts] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { children: true } },
      },
    }),
    // `Product.category` es texto denormalizado (sin FK), y el borrado se
    // bloquea contando por ese nombre. Contamos igual para que la columna
    // coincida exactamente con la regla de eliminación.
    prisma.product.groupBy({
      by: ["category"],
      _count: { _all: true },
    }),
  ]);

  const countByName = new Map(
    productCounts.map((r) => [r.category ?? "", r._count._all])
  );
  const categoriesWithCounts = categories.map((c) => ({
    ...c,
    productCount: countByName.get(c.name) ?? 0,
  }));

  return (
    <div>
      <div className="mb-8">
        <p className="text-[9px] font-medium text-[#d4af37] uppercase tracking-[0.3em] mb-2">
          Gestión
        </p>
        <h1
          className="text-2xl font-light text-[#111111]"
          style={{ fontFamily: "var(--font-sans, sans-serif)" }}
        >
          Categorías
        </h1>
      </div>
      <div className="bg-white border border-[#111111]/6">
        <CategoryTable categories={categoriesWithCounts} />
      </div>
    </div>
  );
}
