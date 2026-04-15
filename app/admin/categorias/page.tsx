import { prisma } from "@/lib/prisma";
import { CategoryTable } from "@/components/admin/CategoryTable";

export const metadata = { title: "Categorías | Admin" };

export default async function AdminCategoriasPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      parent: { select: { id: true, name: true } },
      _count: { select: { children: true } },
    },
  });

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
        <CategoryTable categories={categories} />
      </div>
    </div>
  );
}
