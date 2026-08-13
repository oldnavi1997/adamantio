interface LoaderProps {
  src: string;
  width: number;
  quality?: number;
}

export default function cloudinaryLoader({ src, width, quality }: LoaderProps): string {
  if (!src.includes("res.cloudinary.com")) return src;
  // `q_auto` pesa menos que un q_75 fijo y se ve mejor; `c_limit` evita generar
  // derivados más grandes que el original cuando Next pide un ancho mayor.
  const q = quality ? `q_${quality}` : "q_auto";
  return src.replace("/upload/", `/upload/w_${width},${q},c_limit,f_auto/`);
}
