import { productThumbnail } from "@/lib/media";
import type { WishlistItem } from "@/types";

/**
 * Lo único que la wishlist necesita de un producto, ya como objeto plano: un
 * Server Component no puede pasarle a `WishlistButton` el `Product` entero
 * porque el `Decimal` de Prisma no cruza al navegador.
 */
export function aWishlistItem(product: {
  id: string;
  slug: string | null;
  name: string;
  price: number | { toString(): string };
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  stock: number;
  sizes?: string[] | null;
}): WishlistItem {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: Number(product.price),
    imageUrl: productThumbnail(product) ?? undefined,
    stock: product.stock,
    sizes: product.sizes ?? undefined,
  };
}
