/**
 * Rellena `Product.slug` en los productos que llegaron sin él.
 *
 * La migración `20260911120000_add_product_slug` ya hizo el backfill de todo lo
 * que existía. Este script es para después: el POS escribe en la misma tabla
 * sin pasar por la web, y esos productos aparecen con el `id` en la URL hasta
 * que alguien los edita desde el admin. Es idempotente, se puede repetir.
 *
 *   npx tsx prisma/backfill-slugs.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { slugFromName } from "../lib/utils";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const pendientes = await prisma.product.findMany({
    where: { slug: null },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  if (pendientes.length === 0) {
    console.log("Nada que hacer: todos los productos tienen slug.");
    await prisma.$disconnect();
    return;
  }

  // Los slugs ya ocupados, en memoria: así el bucle no consulta por candidato.
  const ocupados = new Set(
    (await prisma.product.findMany({
      where: { slug: { not: null } },
      select: { slug: true },
    })).map((p) => p.slug as string)
  );

  let escritos = 0;
  for (const p of pendientes) {
    const base = slugFromName(p.name);
    if (!base) {
      console.warn(`Sin slug posible (el nombre no deja caracteres): ${p.id} — "${p.name}"`);
      continue;
    }

    let slug = base;
    for (let n = 2; ocupados.has(slug); n++) slug = `${base}-${n}`;

    await prisma.product.update({ where: { id: p.id }, data: { slug } });
    ocupados.add(slug);
    escritos++;
    console.log(`${p.name} → /joyas/${slug}`);
  }

  console.log(`\n${escritos} de ${pendientes.length} productos actualizados.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
