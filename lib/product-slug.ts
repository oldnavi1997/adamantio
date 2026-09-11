import { prisma } from "@/lib/prisma";
import { slugFromName } from "@/lib/utils";

/**
 * El slug definitivo para `name`, ya libre en la tabla. Devuelve `null` si el
 * nombre no deja ningún carácter utilizable (solo emojis, solo signos): quien
 * llama guarda `null` y la URL se queda con el `id`.
 *
 * `excludeId` es el producto que se está editando, para que conserve el suyo.
 */
export async function uniqueProductSlug(
  name: string,
  excludeId?: string
): Promise<string | null> {
  const base = slugFromName(name);
  if (!base) return null;

  for (let intento = 1; intento <= 20; intento++) {
    const candidato = intento === 1 ? base : `${base}-${intento}`;
    const ocupado = await prisma.product.findUnique({
      where: { slug: candidato },
      select: { id: true },
    });
    if (!ocupado || ocupado.id === excludeId) return candidato;
  }

  // Veinte homónimos es improbable; antes de rendirse, un sufijo aleatorio.
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}
