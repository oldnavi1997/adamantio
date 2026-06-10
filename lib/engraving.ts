import { prisma } from "@/lib/prisma";

/** Clave del SiteSetting que almacena la galería global de ejemplos de grabado. */
export const ENGRAVING_SAMPLES_KEY = "engraving_samples";

/**
 * Galería global por defecto. Se usa como fallback cuando aún no se ha guardado
 * nada en SiteSetting (mantiene el comportamiento previo, cuando estaba hardcodeada).
 */
export const DEFAULT_ENGRAVING_SAMPLES: string[] = [
  "https://res.cloudinary.com/dzqns7kss/image/upload/v1772765494/WhatsApp_Image_2026-03-05_at_7.44.30_PM_1__05_03_2026_gnhjn1.webp",
  "https://res.cloudinary.com/dzqns7kss/image/upload/v1772765494/WhatsApp_Image_2026-03-05_at_7.44.30_PM_2__05_03_2026_smowko.webp",
  "https://res.cloudinary.com/dzqns7kss/image/upload/v1772765493/WhatsApp_Image_2026-03-05_at_7.44.30_PM_05_03_2026_flg2ts.webp",
  "https://res.cloudinary.com/dzqns7kss/image/upload/v1772765494/WhatsApp_Image_2026-03-05_at_7.44.29_PM_1__05_03_2026_pfhikt.webp",
  "https://res.cloudinary.com/dzqns7kss/image/upload/v1772765493/WhatsApp_Image_2026-03-05_at_7.44.29_PM_05_03_2026_q10b5w.webp",
];

function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter((v): v is string => typeof v === "string");
}

/** Lee la galería global desde la DB; si no existe, devuelve la galería por defecto. */
export async function getGlobalEngravingSamples(): Promise<string[]> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: ENGRAVING_SAMPLES_KEY },
  });
  const stored = asStringArray(setting?.value);
  return stored ?? DEFAULT_ENGRAVING_SAMPLES;
}

/**
 * Resuelve las imágenes de grabado a mostrar para un producto:
 * usa las propias del producto si tiene, si no hereda la galería global.
 */
export async function resolveEngravingSamples(product: {
  engravingImages: string[];
}): Promise<string[]> {
  if (product.engravingImages.length > 0) return product.engravingImages;
  return getGlobalEngravingSamples();
}
