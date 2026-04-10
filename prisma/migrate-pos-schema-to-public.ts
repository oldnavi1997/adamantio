/**
 * migrate-pos-schema-to-public.ts
 *
 * Copia los datos de pos."Product", pos."Customer", pos."Sale",
 * pos."SaleItem", pos."StockEntry" hacia las nuevas tablas en public.
 *
 * - Products: merge por SKU (copia campos POS a los productos existentes en public)
 * - El resto (Customer, Sale, SaleItem, StockEntry): insert directo con ON CONFLICT DO NOTHING
 *
 * IMPORTANTE: Sale.userId referencia public."User". Los usuarios del POS deben existir
 * en public."User" antes de migrar ventas. Este script NO migra usuarios del POS —
 * hacerlo manualmente o usar el usuario ADMIN existente.
 *
 * Uso:
 *   npx tsx prisma/migrate-pos-schema-to-public.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { Client } from "pg";

const url = process.env.DATABASE_URL;
if (!url) { console.error("❌  Falta DATABASE_URL"); process.exit(1); }

const db = new Client({ connectionString: url });

async function main() {
  await db.connect();
  console.log("✅  Conectado\n");

  await migrateProducts();
  await migrateCustomers();
  await migrateSales();
  await migrateSaleItems();
  await migrateStockEntries();

  await db.end();
  console.log("\n🎉  Migración completada");
}

// ─── Products ────────────────────────────────────────────────────────────────
// Merge por SKU: actualiza campos POS en los productos que ya existen en public.
// Los productos del POS sin match en public se reportan como no encontrados.

async function migrateProducts() {
  const { rows } = await db.query(`
    SELECT id, name, sku, categoria, material, "precioCosto", "precioVenta",
           "precioVentaHombre", "precioVentaMujer", "precioVentaPareja",
           stock, "stockMinimo", "stockHombre", "stockMujer",
           "stockAlmacen", "stockAlmacenHombre", "stockAlmacenMujer",
           genero, "esPar"
    FROM pos."Product"
    ORDER BY name
  `);
  console.log(`📦  Products en pos: ${rows.length}`);

  let updated = 0;
  const noMatch: string[] = [];

  for (const r of rows) {
    const { rowCount } = await db.query(`
      UPDATE "Product" SET
        categoria          = $1::"Categoria",
        material           = $2::"Material",
        "precioCosto"      = $3,
        "precioVentaHombre" = $4,
        "precioVentaMujer"  = $5,
        "precioVentaPareja" = $6,
        stock              = $7,
        "stockMinimo"      = $8,
        "stockHombre"      = $9,
        "stockMujer"       = $10,
        "stockAlmacen"     = $11,
        "stockAlmacenHombre" = $12,
        "stockAlmacenMujer"  = $13,
        genero             = $14::"Genero"[],
        "esPar"            = $15,
        "updatedAt"        = now()
      WHERE sku = $16
    `, [
      r.categoria, r.material, r.precioCosto,
      r.precioVentaHombre, r.precioVentaMujer, r.precioVentaPareja,
      r.stock, r.stockMinimo, r.stockHombre, r.stockMujer,
      r.stockAlmacen, r.stockAlmacenHombre, r.stockAlmacenMujer,
      r.genero, r.esPar,
      r.sku,
    ]);

    if ((rowCount ?? 0) > 0) {
      updated++;
      console.log(`  ✓  ${r.name} (${r.sku})`);
    } else {
      noMatch.push(`${r.name} (${r.sku})`);
    }
  }

  console.log(`\n  Actualizados: ${updated}`);
  if (noMatch.length > 0) {
    console.log(`  Sin match en public (${noMatch.length}) — crear manualmente si se necesitan:`);
    noMatch.forEach((n) => console.log(`    - ${n}`));
  }
}

// ─── Customers ───────────────────────────────────────────────────────────────

async function migrateCustomers() {
  const { rows } = await db.query(`
    SELECT id, name, phone, email, notes, "createdAt", "updatedAt"
    FROM pos."Customer"
  `);
  console.log(`\n👥  Customers: ${rows.length}`);

  let inserted = 0;
  for (const r of rows) {
    const { rowCount } = await db.query(`
      INSERT INTO "Customer" (id, name, phone, email, notes, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO NOTHING
    `, [r.id, r.name, r.phone, r.email, r.notes, r.createdAt, r.updatedAt]);
    if ((rowCount ?? 0) > 0) inserted++;
  }
  console.log(`  ✓  ${inserted} insertados`);
}

// ─── Sales ───────────────────────────────────────────────────────────────────
// NOTA: Sale.userId debe referenciar un usuario en public."User".
// Las ventas cuyo userId no exista en public se omiten con advertencia.

async function migrateSales() {
  const { rows } = await db.query(`
    SELECT id, "userId", "customerId", subtotal, descuento, total,
           "metodoPago", "montoRecibido", cambio, "createdAt"
    FROM pos."Sale"
    ORDER BY "createdAt"
  `);
  console.log(`\n🧾  Sales: ${rows.length}`);

  let inserted = 0;
  let skipped = 0;

  for (const r of rows) {
    // Verificar que el userId existe en public."User"
    const { rows: userRows } = await db.query(
      `SELECT id FROM "User" WHERE id = $1`,
      [r.userId]
    );
    if (userRows.length === 0) {
      console.log(`  ⚠️   Sale ${r.id} omitida — userId ${r.userId} no existe en public."User"`);
      skipped++;
      continue;
    }

    const { rowCount } = await db.query(`
      INSERT INTO "Sale"
        (id, "userId", "customerId", subtotal, descuento, total,
         "metodoPago", "montoRecibido", cambio, "createdAt")
      VALUES ($1,$2,$3,$4,$5,$6,$7::"MetodoPago",$8,$9,$10)
      ON CONFLICT (id) DO NOTHING
    `, [r.id, r.userId, r.customerId, r.subtotal, r.descuento, r.total,
        r.metodoPago, r.montoRecibido, r.cambio, r.createdAt]);
    if ((rowCount ?? 0) > 0) inserted++;
  }
  console.log(`  ✓  ${inserted} insertadas, ${skipped} omitidas por userId`);
}

// ─── SaleItems ───────────────────────────────────────────────────────────────

async function migrateSaleItems() {
  const { rows } = await db.query(`
    SELECT si.id, si."saleId", p_pub.id AS "productId",
           si.cantidad, si."precioUnitario", si.descuento, si.subtotal, si."generoVenta"
    FROM pos."SaleItem" si
    JOIN pos."Product" p_pos ON p_pos.id = si."productId"
    JOIN "Product" p_pub ON p_pub.sku = p_pos.sku
  `);
  console.log(`\n📋  SaleItems: ${rows.length}`);

  let inserted = 0;
  for (const r of rows) {
    // Solo insertar si la sale padre fue migrada
    const { rows: saleRows } = await db.query(
      `SELECT id FROM "Sale" WHERE id = $1`, [r.saleId]
    );
    if (saleRows.length === 0) continue;

    const { rowCount } = await db.query(`
      INSERT INTO "SaleItem"
        (id, "saleId", "productId", cantidad, "precioUnitario", descuento, subtotal, "generoVenta")
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (id) DO NOTHING
    `, [r.id, r.saleId, r.productId, r.cantidad, r.precioUnitario,
        r.descuento, r.subtotal, r.generoVenta]);
    if ((rowCount ?? 0) > 0) inserted++;
  }
  console.log(`  ✓  ${inserted} insertados`);
}

// ─── StockEntries ────────────────────────────────────────────────────────────

async function migrateStockEntries() {
  const { rows } = await db.query(`
    SELECT se.id, p_pub.id AS "productId", se."userId",
           se.cantidad, se.costo, se.nota, se."createdAt"
    FROM pos."StockEntry" se
    JOIN pos."Product" p_pos ON p_pos.id = se."productId"
    JOIN "Product" p_pub ON p_pub.sku = p_pos.sku
  `);
  console.log(`\n📥  StockEntries: ${rows.length}`);

  let inserted = 0;
  let skipped = 0;
  for (const r of rows) {
    const { rows: userRows } = await db.query(
      `SELECT id FROM "User" WHERE id = $1`, [r.userId]
    );
    if (userRows.length === 0) { skipped++; continue; }

    const { rowCount } = await db.query(`
      INSERT INTO "StockEntry" (id, "productId", "userId", cantidad, costo, nota, "createdAt")
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (id) DO NOTHING
    `, [r.id, r.productId, r.userId, r.cantidad, r.costo, r.nota, r.createdAt]);
    if ((rowCount ?? 0) > 0) inserted++;
  }
  console.log(`  ✓  ${inserted} insertados, ${skipped} omitidos por userId`);
}

main().catch((e) => { console.error(e); process.exit(1); });
