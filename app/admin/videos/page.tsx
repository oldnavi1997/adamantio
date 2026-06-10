import { prisma } from "@/lib/prisma";
import { VideoSpotlightPanel } from "@/components/admin/VideoSpotlightPanel";
import { getVideoSpotlightConfig } from "@/lib/video-spotlight-server";

export const metadata = { title: "Videos | Admin" };

export default async function AdminVideosPage() {
  const [items, raw] = await Promise.all([
    getVideoSpotlightConfig(),
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, price: true, imageUrl: true, imageUrls: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const products = raw.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    image: p.imageUrls?.[0] ?? p.imageUrl ?? null,
  }));

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#111111]">Videos destacados</h1>
        <p className="text-sm text-gray-400 mt-1">
          Gestiona los videos de la sección &ldquo;Descubre nuestras favoritas&rdquo; de la página de inicio:
          añade o reemplaza videos, enlaza productos y reordénalos.
        </p>
      </div>
      <VideoSpotlightPanel initialItems={items} products={products} />
    </div>
  );
}
