import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    loader: "custom",
    loaderFile: "./lib/cloudinary-loader.ts",
    // Cada ancho distinto que Next solicita genera un asset derivado facturable
    // en Cloudinary. Los defaults (8 deviceSizes + 8 imageSizes) multiplican
    // hasta 16 variantes por imagen; con estos anchos cubrimos los breakpoints
    // reales del sitio y reducimos las combinaciones a la mitad.
    deviceSizes: [640, 828, 1080, 1920],
    imageSizes: [64, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "adamantio.pe",
      },
    ],
  },
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "bcryptjs", "mercadopago"],
};

export default nextConfig;
