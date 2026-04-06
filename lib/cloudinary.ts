import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadProductImage(
  file: string,
  folder = "adamantio-products"
): Promise<{ publicId: string; url: string }> {
  const result = await cloudinary.uploader.upload(file, {
    folder,
    transformation: [{ width: 1200, height: 1200, crop: "limit" }, { quality: "auto" }],
  });
  return { publicId: result.public_id, url: result.secure_url };
}

export async function deleteProductImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export default cloudinary;
