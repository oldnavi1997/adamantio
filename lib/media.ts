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
 *
 * Devuelve la URL *canónica*, sin transformación de entrega: es la que se
 * persiste en `SiteSetting`. El recorte de peso se aplica al renderizar con los
 * helpers de abajo, así las URLs ya guardadas en la DB también se benefician
 * sin necesidad de migrarlas.
 */
export function videoPosterUrl(video: string): string {
  return video
    .replace("/video/upload/", "/video/upload/so_0/")
    .replace(/\.(mp4|webm|mov|m4v)$/i, ".jpg");
}

/**
 * Video: los fuentes son 1080x1920, pero se renderizan en tarjetas de ~280-330px
 * CSS, así que 640 cubre pantallas 2x de sobra. `q_auto` a secas apenas recorta
 * un 8%; `q_auto:eco` baja un 38% sin diferencia visible a ese tamaño. Si hiciera
 * falta más margen de créditos en Cloudinary, el dial es w_540 (-48%).
 */
const VIDEO_DELIVERY = "f_auto,q_auto:eco,vc_auto,c_limit,w_640";
/** Póster a tamaño de tarjeta. */
const POSTER_DELIVERY = "f_auto,q_auto,c_limit,w_540";
/** Miniatura cuadrada del listado: 44px CSS a 2x DPR. */
const THUMB_DELIVERY = "f_auto,q_auto,c_fill,ar_1,w_88";

const VIDEO_UPLOAD = "/video/upload/";
const POSTER_PREFIX = "so_0/";

/**
 * Inserta una transformación de entrega en una URL de video de Cloudinary.
 * Si la URL es un póster (`so_0/`), fusiona ambas en un solo componente para
 * generar un único asset derivado en lugar de encadenar dos.
 */
function withVideoTransform(url: string, transform: string): string {
  const i = url.indexOf(VIDEO_UPLOAD);
  if (i === -1 || url.includes(transform)) return url;

  const head = url.slice(0, i + VIDEO_UPLOAD.length);
  const rest = url.slice(i + VIDEO_UPLOAD.length);

  return rest.startsWith(POSTER_PREFIX)
    ? `${head}${POSTER_PREFIX.slice(0, -1)},${transform}/${rest.slice(POSTER_PREFIX.length)}`
    : `${head}${transform}/${rest}`;
}

/** URL de entrega del video (transcodificado y limitado a 640px de ancho). */
export function videoDeliveryUrl(video: string): string {
  return withVideoTransform(video, VIDEO_DELIVERY);
}

/** URL de entrega del póster a tamaño de tarjeta. */
export function posterDeliveryUrl(poster: string): string {
  return withVideoTransform(poster, POSTER_DELIVERY);
}

/** URL de entrega de la miniatura cuadrada de 44px del listado. */
export function thumbDeliveryUrl(poster: string): string {
  return withVideoTransform(poster, THUMB_DELIVERY);
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
