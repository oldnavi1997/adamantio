import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { CategoryGridCarousel } from "./CategoryGridCarousel";

interface Props {
  categorySlug: string;
  heroImage: string;
  label?: string;
}

export async function CategoryGridOneRow({
  categorySlug,
  heroImage,
  label = "Colección",
}: Props) {
  const [category, products] = await Promise.all([
    prisma.category.findFirst({ where: { name: { equals: categorySlug, mode: "insensitive" } } }),
    prisma.product.findMany({
      where: { category: categorySlug, isActive: true },
      take: 12,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!category || products.length === 0) return null;

  return (
    <section className="bg-[#F8F7F4]">
      {/* Hero image — full bleed */}
      <div className="w-full aspect-video overflow-hidden">
        <Image
          src={heroImage}
          alt={category.name}
          width={1920}
          height={1080}
          className="w-full h-full object-cover"
          priority={false}
        />
      </div>

      {/* Carousel with header */}
      <CategoryGridCarousel
        products={products}
        categorySlug={categorySlug}
        categoryName={category.name}
        label={label}
      />
    </section>
  );
}
