import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export type CategoriaResuelta = {
  /** Nombre tal cual está en la BD, para títulos y textos. */
  nombre: string;
  /** La categoría y toda su descendencia, que es por lo que se filtra. */
  nombres: string[];
};

/**
 * Traduce el slug que usan los enlaces del menú a una categoría del árbol.
 *
 * El menú enlaza con `slugify(nombre)` y no con el id, así que la única forma de
 * resolverlo es recorrer el árbol comparando slugs. Funciona con cualquier
 * nivel: el `findMany` sin `where` devuelve también hijas y nietas, y cada una
 * trae su propia descendencia.
 *
 * Devuelve `null` si el slug no corresponde a ninguna categoría; quien llama
 * decide si eso es un 404, un filtro literal o metadata genérica.
 */
export async function resolverCategoria(slug: string): Promise<CategoriaResuelta | null> {
  const todas = await prisma.category.findMany({
    select: {
      name: true,
      children: { select: { name: true, children: { select: { name: true } } } },
    },
  });

  const encontrada = todas.find((c) => slugify(c.name) === slug);
  if (!encontrada) return null;

  return {
    nombre: encontrada.name,
    nombres: [
      encontrada.name,
      ...encontrada.children.map((c) => c.name),
      ...encontrada.children.flatMap((c) => c.children.map((gc) => gc.name)),
    ],
  };
}
