import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Sin barra final a propósito: `Disallow: /checkout/` sólo casa con rutas
      // que EMPIECEN por `/checkout/`, así que dejaba fuera `/checkout` y
      // `/carrito`, que son justo las URLs a las que se llega. Sin la barra se
      // cubren la página y todo lo que cuelgue de ella.
      disallow: ["/admin", "/api", "/checkout", "/carrito", "/pedido", "/auth"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
