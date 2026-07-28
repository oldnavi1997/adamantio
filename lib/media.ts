// Módulo puro (cliente-safe): helpers para distinguir y derivar media de Cloudinary.
// No importa prisma ni nada de servidor, se usa tanto en la galería pública como en el admin.

/**
 * True si la URL apunta a un video: por extensión (`.mp4`, `.webm`, `.mov`, `.m4v`)
 * o por la ruta de delivery de Cloudinary (`/video/upload/`).
 */
export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url) || url.includes("/video/upload/");
}

/**
 * Deriva la URL del póster a partir de la URL del video de Cloudinary:
 * `/video/upload/...mp4` → `/video/upload/so_0/...jpg`.
 */
export function videoPosterUrl(video: string): string {
  return video
    .replace("/video/upload/", "/video/upload/so_0/")
    .replace(/\.(mp4|webm|mov|m4v)$/i, ".jpg");
}

/**
 * Miniatura del producto: la primera FOTO de la galería, nunca un video.
 * `imageUrls` es una lista de media mezclada (fotos y videos en el orden en que
 * se muestran), así que `imageUrls[0]` puede ser un video. Todo lo que necesite
 * una imagen suelta — tarjeta de catálogo, carrito, wishlist, Algolia, feed de
 * Merchant, OG/JSON-LD — tiene que pasar por acá.
 */
export function productThumbnail(product: {
  imageUrl?: string | null;
  imageUrls?: string[] | null;
}): string | null {
  const photo = (product.imageUrls ?? []).find((url) => !isVideoUrl(url));
  if (photo) return photo;
  if (product.imageUrl && !isVideoUrl(product.imageUrl)) return product.imageUrl;
  return null;
}
