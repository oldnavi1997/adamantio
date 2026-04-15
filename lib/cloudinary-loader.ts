interface LoaderProps {
  src: string;
  width: number;
  quality?: number;
}

export default function cloudinaryLoader({ src, width, quality }: LoaderProps): string {
  if (!src.includes("res.cloudinary.com")) return src;
  // Insert Cloudinary transformation params right after /upload/
  return src.replace("/upload/", `/upload/w_${width},q_${quality ?? 75},f_auto/`);
}
