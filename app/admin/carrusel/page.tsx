import { prisma } from "@/lib/prisma";
import { HeroCarruselPanel } from "@/components/admin/HeroCarruselPanel";
import { MAX_SLIDES, fotosDeProducto, getHeroAdmin } from "@/lib/home-hero";

export const metadata = { title: "Carrusel | Admin" };

export default async function AdminCarruselPage() {
  const [{ items, automatico }, raw] = await Promise.all([
    getHeroAdmin(),
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, price: true, imageUrls: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const productos = raw
    .map((p) => ({ id: p.id, name: p.name, price: Number(p.price), fotos: fotosDeProducto(p) }))
    .filter((p) => p.fotos.length > 0);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#111111]">Carrusel de inicio</h1>
        <p className="text-sm text-gray-400 mt-1">
          Elige qué productos aparecen en el carrusel principal de la página de inicio, en qué orden y con qué foto.
        </p>
      </div>
      <HeroCarruselPanel
        inicial={items}
        automaticoInicial={automatico}
        productos={productos}
        maximo={MAX_SLIDES}
      />
    </div>
  );
}
