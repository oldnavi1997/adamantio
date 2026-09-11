/**
 * Alinea `precioVentaPareja` con lo que cobra la web.
 *
 * Los dos campos son el mismo número: el precio de una pareja completa. Vivían
 * en dos tarjetas distintas del formulario de producto y se escribían a mano por
 * separado, así que bastaba con bajar uno en una promoción para que el mostrador
 * siguiera cobrando el viejo. Desde ahora el formulario lo deriva solo; esto
 * arregla lo que quedó escrito antes.
 *
 * También sirve para lo que cree el POS directamente en la tabla sin pasar por
 * la web. Es idempotente, se puede repetir.
 *
 *   npx tsx prisma/backfill-precio-pareja.ts           # dice qué haría
 *   npx tsx prisma/backfill-precio-pareja.ts --aplicar # lo escribe
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

async function main() {
  const aplicar = process.argv.includes("--aplicar");
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  const pares = await prisma.product.findMany({
    where: { esPar: true },
    select: { id: true, name: true, price: true, precioVentaPareja: true },
    orderBy: { name: "asc" },
  });

  // `price` es Decimal y `precioVentaPareja` un Float: se comparan en céntimos
  // para que no sobre una fila por un error de coma flotante.
  const desalineados = pares.filter(
    (p) => Math.round(Number(p.price) * 100) !== Math.round(p.precioVentaPareja * 100)
  );

  if (desalineados.length === 0) {
    console.log(`Los ${pares.length} productos por par ya están alineados.`);
    await prisma.$disconnect();
    return;
  }

  for (const p of desalineados) {
    console.log(
      `${p.name.replace(/\s+/g, " ").trim()}\n` +
        `    POS ${p.precioVentaPareja.toFixed(2)}  ->  web ${Number(p.price).toFixed(2)}`
    );
  }

  if (!aplicar) {
    console.log(
      `\n${desalineados.length} de ${pares.length} desalineados. ` +
        `Repite con --aplicar para escribirlos.`
    );
    await prisma.$disconnect();
    return;
  }

  for (const p of desalineados) {
    await prisma.product.update({
      where: { id: p.id },
      data: { precioVentaPareja: Number(Number(p.price).toFixed(2)) },
    });
  }

  console.log(`\n${desalineados.length} productos alineados.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
