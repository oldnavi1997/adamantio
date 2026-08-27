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
 * CSS, así que 640 cubre pantallas 2x de sobra. Medido sobre un video de 2173 KB:
 * `w_640` con `q_auto:good` da 1668 KB (-23%) y con `q_auto:eco` 1349 KB (-38%).
 *
 * Vamos con `good` a propósito: en joyería los reflejos metálicos sobre fondo
 * oscuro son justo donde la compresión agresiva muestra bandeado. Si el consumo
 * de Cloudinary no baja lo suficiente, el dial es `q_auto:eco` y después w_540.
 */
const VIDEO_BASE = "f_auto,q_auto:good,vc_auto";

/**
 * Recorte de la tarjeta del spotlight, que es 9:16 con `object-fit: cover`.
 *
 * Sin esto, `c_limit,w_640` limita el *ancho*: un fuente horizontal (1920x1080)
 * se entrega como 640x360 y el navegador se queda con la franja central de
 * ~200px para estirarla a ~660px de pantalla — se ve pésimo al lado de los
 * verticales. Recortando en Cloudinary, los 640px entregados son los que se ven.
 * Gravedad centro (el default): `g_auto` sobre video es un add-on aparte.
 */
const CARD_CROP = "c_fill,ar_9:16";
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

/**
 * URL de entrega del video en la galería de producto: se muestra con
 * `object-contain` dentro de un cuadrado, así que no se recorta nada y basta
 * con limitar el ancho.
 */
export function videoDeliveryUrl(video: string): string {
  return withVideoTransform(video, `${VIDEO_BASE},c_limit,w_640`);
}

/** URL de entrega del video de la tarjeta del spotlight (recortado a 9:16). */
export function spotlightVideoUrl(video: string): string {
  return withVideoTransform(video, `${VIDEO_BASE},${CARD_CROP},w_640`);
}

/**
 * URL de entrega del póster sin recorte, para la galería de producto, que pasa
 * su propio ancho. La tarjeta del spotlight usa `spotlightPosterUrl`.
 */
export function posterDeliveryUrl(poster: string, width = 540): string {
  return withVideoTransform(poster, `f_auto,q_auto,c_limit,w_${width}`);
}

/**
 * Póster de la tarjeta del spotlight: mismo recorte 9:16 que el video, si no
 * la imagen salta al arrancar la reproducción.
 */
export function spotlightPosterUrl(poster: string, width = 540): string {
  return withVideoTransform(poster, `f_auto,q_auto,${CARD_CROP},w_${width}`);
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

const IMAGE_UPLOAD = "/image/upload/";

/** Lado de la imagen social. Cuadrada: ver `ogImageUrl`. */
export const OG_LADO = 1200;

/**
 * URL de la imagen que se ve al compartir un enlace en WhatsApp, Facebook o X.
 *
 * **Va en 1:1 a propósito.** Los scrapers de mensajería eligen el formato de la
 * tarjeta leyendo los `og:image:width`/`og:image:height` que declara el HTML,
 * sin descargar la imagen. Las fotos del catálogo ya son cuadradas —medido: 12
 * de 12 a 1.00—, así que declarar 1200x630, como se hacía, reservaba una tarjeta
 * apaisada y la foto salía recortada o con franjas.
 *
 * `c_pad` no recorta nunca: si algún día entra una foto que no sea cuadrada, la
 * encaja sobre un fondo en vez de comerse la joya. `f_jpg` es deliberado, los
 * scrapers tratan mal el WebP en el que está el catálogo.
 *
 * Si la URL no es de Cloudinary se devuelve intacta: es lo único que se puede
 * hacer, y sigue siendo válida como og:image.
 */
export function ogImageUrl(url: string, fondo: "auto" | "white" = "auto"): string {
  const entrega = `c_pad,b_${fondo},ar_1:1,w_${OG_LADO},f_jpg,q_auto`;
  if (isVideoUrl(url)) return withVideoTransform(videoPosterUrl(url), entrega);

  const i = url.indexOf(IMAGE_UPLOAD);
  if (i === -1 || url.includes(entrega)) return url;
  const corte = i + IMAGE_UPLOAD.length;
  return `${url.slice(0, corte)}${entrega}/${url.slice(corte)}`;
}
