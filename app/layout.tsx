import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Navbar, type NavCategory } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { prisma } from "@/lib/prisma";
import { Analytics } from "@vercel/analytics/next";
import { StoreChrome } from "@/components/layout/StoreChrome";

const jost = Jost({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jost",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Adamantio – Accesorios en Perú",
    template: "%s | Adamantio",
  },
  description: "Tu destino de confianza para joyería de calidad en Perú.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let navCategories: NavCategory[] = [];
  try {
    navCategories = await prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          orderBy: { name: "asc" },
          include: {
            children: { orderBy: { name: "asc" }, select: { id: true, name: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    });
  } catch {
    // DB unavailable during build (e.g. Railway build phase)
  }

  return (
    <html lang="es" className={jost.variable}>
      <body className="flex flex-col min-h-screen" suppressHydrationWarning>
        <Providers>
          <StoreChrome><Navbar categories={navCategories} /></StoreChrome>
          <main className="flex-1">{children}</main>
          <StoreChrome><Footer /></StoreChrome>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
