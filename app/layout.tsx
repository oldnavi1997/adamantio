import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Navbar, type NavCategory } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { prisma } from "@/lib/prisma";
import { Analytics } from "@vercel/analytics/next";
import { StoreChrome } from "@/components/layout/StoreChrome";
import { CookieBanner } from "@/components/layout/CookieBanner";

const jost = Jost({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jost",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://adamantio.pe"),
  title: {
    default: "Adamantio – Joyería y Accesorios en Perú",
    template: "%s | Adamantio",
  },
  description: "Joyería en plata 925 con mensajes secretos. Collares, pulseras, anillos y aretes con envío a todo Perú.",
  openGraph: {
    siteName: "Adamantio",
    locale: "es_PE",
    type: "website",
  },
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
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          include: {
            children: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  } catch {
    // DB unavailable during build (e.g. Railway build phase)
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://adamantio.pe";
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Adamantio",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    sameAs: [],
  };

  return (
    <html lang="es" className={jost.variable}>
      <body className="flex flex-col min-h-screen" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <Providers>
          <StoreChrome><Navbar categories={navCategories} /></StoreChrome>
          <main className="flex-1">{children}</main>
          <StoreChrome><Footer /></StoreChrome>
        </Providers>
        <Analytics />
        <CookieBanner />
      </body>
    </html>
  );
}
