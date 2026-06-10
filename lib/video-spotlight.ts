// Módulo puro (cliente-safe): no importa prisma. La lectura desde la DB vive en
// `lib/video-spotlight-server.ts` para no contaminar los bundles de cliente.

/** Clave del SiteSetting que almacena la configuración de videos destacados de la home. */
export const VIDEO_SPOTLIGHT_KEY = "video_spotlight";

export type SpotlightConfigItem = {
  /** Producto enlazado: de él se toman nombre, precio y href en vivo. */
  productId: string;
  /** URL del video (Cloudinary). */
  video: string;
  /** Póster derivado del video (frame inicial). */
  poster: string;
};

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
 * Configuración por defecto (los videos que estaban hardcodeados en VideoSpotlight).
 * Se usa como fallback hasta que se guarde algo en SiteSetting.
 */
export const DEFAULT_VIDEO_SPOTLIGHT: SpotlightConfigItem[] = [
  {
    productId: "cmlyj6zzm002gmi0pun7tg48j",
    video:
      "https://res.cloudinary.com/dzqns7kss/video/upload/v1772845327/01e9240cc9db724a010370019ab4d2647a_115_qs5k4j.mp4",
    poster:
      "https://res.cloudinary.com/dzqns7kss/video/upload/so_0/v1772845327/01e9240cc9db724a010370019ab4d2647a_115_qs5k4j.jpg",
  },
  {
    productId: "cmm5dsv7d0000pa1womtk3pd0",
    video:
      "https://res.cloudinary.com/dzqns7kss/video/upload/v1772845326/01e998435445f4c8010370019c7ac7b443_115_i9cq6c.mp4",
    poster:
      "https://res.cloudinary.com/dzqns7kss/video/upload/so_0/v1772845326/01e998435445f4c8010370019c7ac7b443_115_i9cq6c.jpg",
  },
  {
    productId: "cmlyj6vph0014mi0pq9h41qjh",
    video:
      "https://res.cloudinary.com/dzqns7kss/video/upload/v1772845332/01e9a7f032c5dbdb010370019cb8055475_115_pfbnat.mp4",
    poster:
      "https://res.cloudinary.com/dzqns7kss/video/upload/so_0/v1772845332/01e9a7f032c5dbdb010370019cb8055475_115_pfbnat.jpg",
  },
];

export function parseSpotlightConfig(value: unknown): SpotlightConfigItem[] | null {
  if (!Array.isArray(value)) return null;
  const items: SpotlightConfigItem[] = [];
  for (const entry of value) {
    if (
      entry &&
      typeof entry === "object" &&
      typeof (entry as SpotlightConfigItem).productId === "string" &&
      typeof (entry as SpotlightConfigItem).video === "string"
    ) {
      const e = entry as SpotlightConfigItem;
      items.push({ productId: e.productId, video: e.video, poster: e.poster || videoPosterUrl(e.video) });
    }
  }
  return items;
}
