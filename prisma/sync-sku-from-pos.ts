/**
 * sync-sku-from-pos.ts
 * Lee los SKUs de pos."Product" y los asigna a los productos de Adamantio
 * que coincidan por nombre (case-insensitive) y aún no tengan SKU.
 *
 * Uso:
 *   npx tsx prisma/sync-sku-from-pos.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { Client } from "pg";

const adamantioUrl = process.env.DATABASE_URL;
if (!adamantioUrl) { console.error("❌  Falta DATABASE_URL"); process.exit(1); }

const ada = new Client({ connectionString: adamantioUrl });

async function main() {
  await ada.connect();

  // 1. Productos del POS con SKU
  const { rows: posProducts } = await ada.query<{ name: string; sku: string }>(`
    SELECT name, sku FROM pos."Product"
    WHERE sku IS NOT NULL AND sku != ''
    ORDER BY name
  `);

  // 2. Productos de Adamantio sin SKU
  const { rows: adamantioProducts } = await ada.query<{ id: string; name: string }>(`
    SELECT id, name FROM "Product"
    WHERE sku IS NULL OR sku = ''
    ORDER BY name
  `);

  console.log(`\nProductos POS con SKU:        ${posProducts.length}`);
  console.log(`Productos Adamantio sin SKU:  ${adamantioProducts.length}\n`);

  let updated = 0;
  let skipped = 0;
  const noMatch: string[] = [];

  for (const ada_product of adamantioProducts) {
    const match = posProducts.find(
      (p) => p.name.trim().toLowerCase() === ada_product.name.trim().toLowerCase()
    );

    if (!match) {
      noMatch.push(ada_product.name);
      continue;
    }

    // Verificar que el SKU no esté ya asignado a otro producto
    const { rows: existing } = await ada.query(
      `SELECT id FROM "Product" WHERE sku = $1`,
      [match.sku]
    );
    if (existing.length > 0) {
      console.log(`  ⚠️   SKU ${match.sku} ya usado — omitiendo ${ada_product.name}`);
      skipped++;
      continue;
    }

    await ada.query(
      `UPDATE "Product" SET sku = $1, "updatedAt" = now() WHERE id = $2`,
      [match.sku, ada_product.id]
    );

    console.log(`  ✓  ${ada_product.name} → SKU: ${match.sku}`);
    updated++;
  }

  console.log(`\n✅  Actualizados: ${updated}`);
  console.log(`⏭   Sin cambios:  ${skipped}`);

  if (noMatch.length > 0) {
    console.log(`\n⚠️   Sin coincidencia en POS (${noMatch.length}):`);
    noMatch.forEach((n) => console.log(`     - ${n}`));
  }

  await ada.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
