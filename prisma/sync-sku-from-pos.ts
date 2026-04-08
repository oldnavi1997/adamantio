/**
 * sync-sku-from-pos.ts
 * Conecta al Postgres del POS, lee los SKUs y los asigna a los productos
 * de Adamantio que coincidan por nombre (case-insensitive).
 *
 * Uso:
 *   POS_DATABASE_URL="postgresql://..." npx tsx prisma/sync-sku-from-pos.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { Client } from "pg";

const posUrl = process.env.POS_DATABASE_URL;
if (!posUrl) {
  console.error("❌  Falta POS_DATABASE_URL");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Leer productos del POS
  const posClient = new Client({ connectionString: posUrl });
  await posClient.connect();

  const { rows: posProducts } = await posClient.query<{ name: string; sku: string }>(
    `SELECT name, sku FROM "Product" WHERE sku IS NOT NULL AND sku != '' ORDER BY name`
  );
  await posClient.end();

  console.log(`\nProductos POS con SKU: ${posProducts.length}`);

  // 2. Leer productos de Adamantio
  const adamantioProducts = await prisma.product.findMany({
    select: { id: true, name: true, sku: true },
  });

  let updated = 0;
  let skipped = 0;
  const noMatch: string[] = [];

  for (const pos of posProducts) {
    const match = adamantioProducts.find(
      (p) => p.name.trim().toLowerCase() === pos.name.trim().toLowerCase()
    );

    if (!match) {
      noMatch.push(pos.name);
      continue;
    }

    if (match.sku === pos.sku) {
      skipped++;
      continue;
    }

    await prisma.product.update({
      where: { id: match.id },
      data: { sku: pos.sku },
    });

    console.log(`  ✓  ${match.name} → SKU: ${pos.sku}`);
    updated++;
  }

  console.log(`\n✅  Actualizados: ${updated}`);
  console.log(`⏭   Ya tenían el SKU correcto: ${skipped}`);

  if (noMatch.length > 0) {
    console.log(`\n⚠️   Sin coincidencia en Adamantio (${noMatch.length}):`);
    noMatch.forEach((n) => console.log(`     - ${n}`));
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
