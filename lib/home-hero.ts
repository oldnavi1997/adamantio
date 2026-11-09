import { z } from "zod";
import type { Product } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { enCategorias } from "@/lib/catalog-query";
import { getCategoriasPublicas, type CategoriaPublica } from "@/lib/categorias";
import { idsDescendientes, rutaCategoria } from "@/lib/category-tree";
import { isVideoUrl, productThumbnail } from "@/lib/media";
import { precioConOferta, productPath } from "@/lib/utils";

/**
 * Fila de `site_settings` con la lista exacta de productos del carrusel, que se
 * edita en /admin/carrusel. Sin ella el carrusel es automático: `PRIMERO_AUTOMATICO`
 * y lo más nuevo de la categoría.
 */
export const CLAVE_HERO = "home_hero";
const SLUG_CATEGORIA = "anillos-de-plata";
const TOTAL_AUTOMATICO = 5;
export const MAX_SLIDES = 10;

/**
 * La fila de estrellas de la home. Apagada: no hay reseñas en el proyecto y
 * las estrellas prometen una valoración. Al encenderla, el número sale de los
 * pedidos pagados.
 */
const MOSTRAR_PRUEBA_SOCIAL = false;

export const heroItemSchema = z.object({
  productId: z.string().min(1),
  /** Posición de la foto del hero entre las fotos del producto. */
  imagen: z.number().int().min(0).default(0),
});

const configSchema = z.object({ productos: z.array(heroItemSchema).min(1) });

const PRIMERO_AUTOMATICO = {
  slug: "amor-infinito-anillos-de-pareja-entrelazados-en-plata-s925-lujo-de-alta-gama",
  imagen: 3,
  alt: "Pareja entrelazando los meñiques con sus anillos de plata 925 Amor Infinito",
};

/** "AMOR INFINITO: ANILLOS DE…" → "Amor Infinito". Los nombres del POS llegan en mayúsculas. */
function nombreCorto(nombre: string): string {
  const base = nombre.split(":")[0].trim();
  if (base !== base.toUpperCase()) return base;
  return base.toLowerCase().replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase());
}

export type HeroProducto = {
  nombre: string;
  nombreCompleto: string;
  precio: number;
  href: string;
  foto: string | null;
  alt: string;
  miniatura: string | null;
};

export type HeroHome = {
  rutaCategoria: string;
  productos: HeroProducto[];
  pruebaSocial: string | null;
};

type Elegido = { producto: Product; imagen: number; alt?: string };

export function fotosDeProducto(p: { imageUrls: string[] }): string[] {
  return p.imageUrls.filter((u) => !isVideoUrl(u));
}

function aSlide({ producto: p, imagen, alt }: Elegido): HeroProducto {
  const miniatura = productThumbnail(p);
  return {
    nombre: nombreCorto(p.name),
    nombreCompleto: p.name,
    precio: precioConOferta(p).precio,
    href: productPath(p),
    foto: fotosDeProducto(p)[imagen] ?? miniatura,
    alt: alt ?? p.name,
    miniatura,
  };
}

/** Los productos del carrusel, en orden, y si salen de la lista del admin o son automáticos. */
async function resolverCarrusel(categorias: CategoriaPublica[]): Promise<{
  elegidos: Elegido[];
  automatico: boolean;
}> {
  const ajuste = await prisma.siteSetting.findUnique({ where: { key: CLAVE_HERO } });
  const config = configSchema.safeParse(ajuste?.value);

  if (config.success) {
    const items = config.data.productos;
    const productos = await prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) }, isActive: true },
    });
    return {
      automatico: false,
      elegidos: items.flatMap((item) => {
        const producto = productos.find((p) => p.id === item.productId);
        return producto ? [{ producto, imagen: item.imagen }] : [];
      }),
    };
  }

  const categoria = categorias.find((c) => c.slug === SLUG_CATEGORIA);
  const primero = await prisma.product.findFirst({
    where: { slug: PRIMERO_AUTOMATICO.slug, isActive: true },
  });
  const relleno = categoria
    ? await prisma.product.findMany({
        where: {
          isActive: true,
          testMode: false,
          stock: { gt: 0 },
          ...(primero && { NOT: { id: primero.id } }),
          ...enCategorias([categoria.id, ...idsDescendientes(categorias, categoria.id)]),
        },
        orderBy: { createdAt: "desc" },
        take: TOTAL_AUTOMATICO - (primero ? 1 : 0),
      })
    : [];

  return {
    automatico: true,
    elegidos: [
      ...(primero ? [{ producto: primero, imagen: PRIMERO_AUTOMATICO.imagen, alt: PRIMERO_AUTOMATICO.alt }] : []),
      ...relleno.map((producto) => ({ producto, imagen: 0 })),
    ],
  };
}

export async function getHeroHome(): Promise<HeroHome> {
  const categorias = await getCategoriasPublicas();
  const [{ elegidos }, pedidos] = await Promise.all([
    resolverCarrusel(categorias),
    MOSTRAR_PRUEBA_SOCIAL ? prisma.order.count({ where: { status: "PAID" } }) : null,
  ]);
  const categoria = categorias.find((c) => c.slug === SLUG_CATEGORIA);

  return {
    rutaCategoria: categoria ? rutaCategoria(categorias, categoria.id) : "/joyas",
    productos: elegidos.map(aSlide).filter((s) => s.foto),
    pruebaSocial: pedidos === null ? null : `${pedidos} pedidos confirmados`,
  };
}

/** Lo que muestra el carrusel ahora mismo, para arrancar el editor del admin. */
export async function getHeroAdmin() {
  const { elegidos, automatico } = await resolverCarrusel(await getCategoriasPublicas());
  return {
    automatico,
    items: elegidos.map((e) => ({ productId: e.producto.id, imagen: e.imagen })),
  };
}
