/**
 * sync-new-products-to-pos.ts
 * Inserta en pos."Product" los productos de Adamantio que no existen en el POS.
 * Matching por SKU. Los productos sin SKU se omiten.
 *
 * Uso:
 *   npx tsx prisma/sync-new-products-to-pos.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { Client } from "pg";
import { randomUUID } from "crypto";

const adamantioUrl = process.env.DATABASE_URL;
if (!adamantioUrl) { console.error("❌  Falta DATABASE_URL"); process.exit(1); }

const ada = new Client({ connectionString: adamantioUrl });

async function main() {
  await ada.connect();

  // 1. Productos de Adamantio con SKU
  const { rows: adamantioProducts } = await ada.query<{
    id: string; name: string; sku: string; price: number;
    stock: number; description: string; imageUrl: string | null; category: string | null;
  }>(`
    SELECT id, name, sku, price::float, stock, description, "imageUrl", category
    FROM "Product"
    WHERE sku IS NOT NULL AND sku != ''
    ORDER BY name
  `);

  // 2. SKUs ya en pos."Product"
  const { rows: posSKUs } = await ada.query<{ sku: string }>(
    `SELECT sku FROM pos."Product" WHERE sku IS NOT NULL`
  );
  const existingSKUs = new Set(posSKUs.map((r) => r.sku));

  // 3. Filtrar los que faltan
  const missing = adamantioProducts.filter((p) => !existingSKUs.has(p.sku));

  if (missing.length === 0) {
    console.log("✅  Todos los productos de Adamantio ya están en el POS.");
    await ada.end();
    return;
  }

  console.log(`\n📦  Productos a insertar: ${missing.length}`);

  for (const p of missing) {
    // Mapear categoria desde la categoría de texto libre de Adamantio
    const categoriaMap: Record<string, string> = {
      anillo: "ANILLO", anillos: "ANILLO",
      collar: "COLLAR", collares: "COLLAR",
      pulsera: "PULSERA", pulseras: "PULSERA",
      arete: "ARETE", aretes: "ARETE",
    };
    const catKey = (p.category ?? "").toLowerCase().split(" ")[0];
    const categoria = categoriaMap[catKey] ?? "OTRO";

    await ada.query(`
      INSERT INTO pos."Product" (
        id, name, sku, categoria, material,
        "precioCosto", "precioVenta",
        "precioVentaHombre", "precioVentaMujer", "precioVentaPareja",
        stock, "stockMinimo",
        "stockHombre", "stockMujer", "stockAlmacen",
        "stockAlmacenHombre", "stockAlmacenMujer",
        genero, descripcion, "imagenUrl",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4::pos."Categoria", 'OTRO'::pos."Material",
        $5, $5,
        $5, $5, $5,
        $6, 5,
        0, 0, 0,
        0, 0,
        ARRAY['UNISEX']::pos."Genero"[], $7, $8,
        now(), now()
      )
      ON CONFLICT (sku) DO NOTHING
    `, [
      randomUUID(), p.name, p.sku, categoria,
      p.price, p.stock,
      p.description?.slice(0, 500) ?? null,
      p.imageUrl ?? null,
    ]);

    console.log(`  ✓  ${p.name} (${p.sku}) → categoria: ${categoria}`);
  }

  console.log(`\n🎉  ${missing.length} producto(s) añadido(s) al POS`);
  await ada.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
