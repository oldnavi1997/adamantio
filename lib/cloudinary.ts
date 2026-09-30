import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * El master se guarda a 5000 px como máximo y calidad fija 88, no `q_auto`.
 *
 * Cloudinary guarda el RESULTADO de esta transformación y descarta el archivo
 * subido, así que lo que se recorte acá no se recupera: arreglarlo obliga a
 * resubir foto por foto. Estaba en 1200 px con `q_auto`, lo mismo que en
 * Luminus, donde dejaba masters de ~29 KB que borraban el detalle fino.
 *
 * - 5000 es el tope por imagen del plan Free (25 MP): margen, no detalle.
 * - 3840 es el piso real: lo pide la capa de zoom del lightbox (`ANCHO_ZOOM`
 *   en `components/product/ImageGallery.tsx`).
 *
 * Los mismos valores están en el preset sin firmar `adamantio-fotos`, que es
 * por donde sube el widget del admin. Si cambias uno, cambia el otro.
 */
export async function uploadProductImage(
  file: string,
  folder = "adamantio-products"
): Promise<{ publicId: string; url: string }> {
  const result = await cloudinary.uploader.upload(file, {
    folder,
    transformation: [{ width: 5000, height: 5000, crop: "limit" }, { quality: 88 }],
  });
  return { publicId: result.public_id, url: result.secure_url };
}

export async function deleteProductImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export default cloudinary;
