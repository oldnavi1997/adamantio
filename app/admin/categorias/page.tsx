import { CategoryTable } from "@/components/admin/CategoryTable";
import { getCategoryTree } from "@/lib/categorias";

export const metadata = { title: "Categorías | Admin" };

export default async function AdminCategoriasPage() {
  // El árbol completo, inactivas incluidas, con dos conteos por categoría: los
  // productos asignados directamente (los que bloquean el borrado) y los de
  // todo su subárbol sin repetir (lo que ve la tienda).
  const tree = await getCategoryTree({ includeInactive: true });

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
        <CategoryTable tree={tree} />
      </div>
    </div>
  );
}
