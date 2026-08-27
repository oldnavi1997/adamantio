import { OG_LADO, ogImageUrl } from "@/lib/media";

const LOGO =
  "https://res.cloudinary.com/dzqns7kss/image/upload/v1772665459/adamantio-logo-1024x299_ol5fgy.png";

/**
 * Imagen social por defecto: el logo encajado en un lienzo cuadrado blanco.
 *
 * Hace falta porque la metadata de Next se fusiona en superficie: una página
 * que declara su propio `openGraph` REEMPLAZA el del layout entero, imagen
 * incluida. Por eso la home y el catálogo la incluyen explícitamente en lugar
 * de confiar en heredarla. Las páginas que no declaran `openGraph` —las
 * legales— sí la heredan del layout.
 */
export const OG_DEFECTO = {
  url: ogImageUrl(LOGO, "white"),
  width: OG_LADO,
  height: OG_LADO,
  alt: "Adamantio – Joyería en plata 925",
} as const;
