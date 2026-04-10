/**
 * migrate-pos-to-adamantio.ts
 * Migra todos los datos del POS a la DB de Adamantio bajo el schema "pos".
 *
 * Uso:
 *   POS_DATABASE_URL="postgresql://..." npx tsx prisma/migrate-pos-to-adamantio.ts
 *
 * Es idempotente: si se ejecuta dos veces, hace upsert sin duplicar datos.
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { Client } from "pg";

const posUrl = process.env.POS_DATABASE_URL;
const adamantioUrl = process.env.DATABASE_URL;

if (!posUrl) { console.error("❌  Falta POS_DATABASE_URL"); process.exit(1); }
if (!adamantioUrl) { console.error("❌  Falta DATABASE_URL"); process.exit(1); }

// ─── Clientes ────────────────────────────────────────────────────────────────

const pos = new Client({ connectionString: posUrl });
const ada = new Client({ connectionString: adamantioUrl });

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  await pos.connect();
  await ada.connect();
  console.log("✅  Conectado a ambas bases de datos\n");

  // 1. Crear schema y tipos
  await createSchemaAndTypes();

  // 2. Crear tablas
  await createTables();

  // 3. Migrar datos (orden respeta FK)
  await migrateUsers();
  await migrateProducts();
  await migrateCustomers();
  await migrateSales();
  await migrateSaleItems();
  await migrateStockEntries();

  await pos.end();
  await ada.end();
  console.log("\n🎉  Migración completada");
}

// ─── Schema y enums ──────────────────────────────────────────────────────────

async function createSchemaAndTypes() {
  console.log("📦  Creando schema y enums...");
  await ada.query(`CREATE SCHEMA IF NOT EXISTS pos`);

  const enums = [
    [`pos."Role"`,       `'ADMIN','VENDEDOR'`],
    [`pos."Material"`,   `'ORO','PLATA','ACERO','OTRO'`],
    [`pos."Categoria"`,  `'ANILLO','COLLAR','PULSERA','ARETE','OTRO'`],
    [`pos."MetodoPago"`, `'EFECTIVO','TARJETA','TRANSFERENCIA','YAPE','PLIN'`],
    [`pos."Genero"`,     `'HOMBRE','MUJER','UNISEX'`],
  ];

  for (const [name, values] of enums) {
    await ada.query(`
      DO $$ BEGIN
        CREATE TYPE ${name} AS ENUM (${values});
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
  }
  console.log("   ✓  Enums listos");
}

// ─── Tablas ──────────────────────────────────────────────────────────────────

async function createTables() {
  console.log("🗂   Creando tablas...");

  await ada.query(`
    CREATE TABLE IF NOT EXISTS pos."User" (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT NOT NULL UNIQUE,
      password    TEXT NOT NULL,
      role        pos."Role" NOT NULL DEFAULT 'VENDEDOR',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  await ada.query(`
    CREATE TABLE IF NOT EXISTS pos."Product" (
      id                   TEXT PRIMARY KEY,
      name                 TEXT NOT NULL,
      sku                  TEXT NOT NULL UNIQUE,
      categoria            pos."Categoria" NOT NULL,
      material             pos."Material" NOT NULL,
      "precioCosto"        FLOAT NOT NULL,
      "precioVenta"        FLOAT NOT NULL,
      "precioVentaHombre"  FLOAT NOT NULL DEFAULT 0,
      "precioVentaMujer"   FLOAT NOT NULL DEFAULT 0,
      "precioVentaPareja"  FLOAT NOT NULL DEFAULT 0,
      stock                INT NOT NULL DEFAULT 0,
      "stockMinimo"        INT NOT NULL DEFAULT 5,
      "stockHombre"        INT NOT NULL DEFAULT 0,
      "stockMujer"         INT NOT NULL DEFAULT 0,
      "stockAlmacen"       INT NOT NULL DEFAULT 0,
      "stockAlmacenHombre" INT NOT NULL DEFAULT 0,
      "stockAlmacenMujer"  INT NOT NULL DEFAULT 0,
      genero               pos."Genero"[] NOT NULL DEFAULT ARRAY['UNISEX']::pos."Genero"[],
      descripcion          TEXT,
      "imagenUrl"          TEXT,
      "createdAt"          TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt"          TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  await ada.query(`
    CREATE TABLE IF NOT EXISTS pos."Customer" (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      phone       TEXT,
      email       TEXT,
      notes       TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  await ada.query(`
    CREATE TABLE IF NOT EXISTS pos."Sale" (
      id              TEXT PRIMARY KEY,
      "userId"        TEXT NOT NULL REFERENCES pos."User"(id),
      "customerId"    TEXT REFERENCES pos."Customer"(id),
      subtotal        FLOAT NOT NULL,
      descuento       FLOAT NOT NULL DEFAULT 0,
      total           FLOAT NOT NULL,
      "metodoPago"    pos."MetodoPago" NOT NULL,
      "montoRecibido" FLOAT,
      cambio          FLOAT,
      "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  await ada.query(`
    CREATE TABLE IF NOT EXISTS pos."SaleItem" (
      id               TEXT PRIMARY KEY,
      "saleId"         TEXT NOT NULL REFERENCES pos."Sale"(id) ON DELETE CASCADE,
      "productId"      TEXT NOT NULL REFERENCES pos."Product"(id),
      cantidad         INT NOT NULL,
      "precioUnitario" FLOAT NOT NULL,
      descuento        FLOAT NOT NULL DEFAULT 0,
      subtotal         FLOAT NOT NULL,
      "generoVenta"    TEXT
    )
  `);

  await ada.query(`
    CREATE TABLE IF NOT EXISTS pos."StockEntry" (
      id          TEXT PRIMARY KEY,
      "productId" TEXT NOT NULL REFERENCES pos."Product"(id),
      "userId"    TEXT NOT NULL REFERENCES pos."User"(id),
      cantidad    INT NOT NULL,
      costo       FLOAT,
      nota        TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  console.log("   ✓  Tablas listas");
}

// ─── Migración de datos ───────────────────────────────────────────────────────

async function migrateUsers() {
  const { rows } = await pos.query(`SELECT * FROM "User"`);
  console.log(`\n👤  Users: ${rows.length}`);
  for (const r of rows) {
    await ada.query(`
      INSERT INTO pos."User" (id, name, email, password, role, "createdAt", "updatedAt")
      VALUES ($1,$2,$3,$4,$5::pos."Role",$6,$7)
      ON CONFLICT (id) DO UPDATE SET
        name=EXCLUDED.name, email=EXCLUDED.email,
        password=EXCLUDED.password, role=EXCLUDED.role,
        "updatedAt"=EXCLUDED."updatedAt"
    `, [r.id, r.name, r.email, r.password, r.role, r.createdAt, r.updatedAt]);
  }
  console.log(`   ✓  ${rows.length} usuarios migrados`);
}

async function migrateProducts() {
  const { rows } = await pos.query(`SELECT * FROM "Product"`);
  console.log(`\n📦  Products: ${rows.length}`);
  for (const r of rows) {
    await ada.query(`
      INSERT INTO pos."Product"
        (id, name, sku, categoria, material, "precioCosto", "precioVenta",
         "precioVentaHombre", "precioVentaMujer", "precioVentaPareja",
         stock, "stockMinimo", "stockHombre", "stockMujer",
         "stockAlmacen", "stockAlmacenHombre", "stockAlmacenMujer",
         genero, descripcion, "imagenUrl", "createdAt", "updatedAt")
      VALUES ($1,$2,$3,$4::pos."Categoria",$5::pos."Material",$6,$7,$8,$9,$10,
              $11,$12,$13,$14,$15,$16,$17,$18::pos."Genero"[],$19,$20,$21,$22)
      ON CONFLICT (id) DO UPDATE SET
        name=EXCLUDED.name, stock=EXCLUDED.stock,
        "stockAlmacen"=EXCLUDED."stockAlmacen",
        "stockHombre"=EXCLUDED."stockHombre",
        "stockMujer"=EXCLUDED."stockMujer",
        "updatedAt"=EXCLUDED."updatedAt"
    `, [r.id, r.name, r.sku, r.categoria, r.material, r.precioCosto, r.precioVenta,
        r.precioVentaHombre, r.precioVentaMujer, r.precioVentaPareja,
        r.stock, r.stockMinimo, r.stockHombre, r.stockMujer,
        r.stockAlmacen, r.stockAlmacenHombre, r.stockAlmacenMujer,
        r.genero, r.descripcion, r.imagenUrl, r.createdAt, r.updatedAt]);
  }
  console.log(`   ✓  ${rows.length} productos migrados`);
}

async function migrateCustomers() {
  const { rows } = await pos.query(`SELECT * FROM "Customer"`);
  console.log(`\n👥  Customers: ${rows.length}`);
  for (const r of rows) {
    await ada.query(`
      INSERT INTO pos."Customer" (id, name, phone, email, notes, "createdAt", "updatedAt")
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (id) DO UPDATE SET
        name=EXCLUDED.name, phone=EXCLUDED.phone,
        email=EXCLUDED.email, notes=EXCLUDED.notes
    `, [r.id, r.name, r.phone, r.email, r.notes, r.createdAt, r.updatedAt]);
  }
  console.log(`   ✓  ${rows.length} clientes migrados`);
}

async function migrateSales() {
  const { rows } = await pos.query(`SELECT * FROM "Sale" ORDER BY "createdAt"`);
  console.log(`\n🧾  Sales: ${rows.length}`);
  for (const r of rows) {
    await ada.query(`
      INSERT INTO pos."Sale"
        (id, "userId", "customerId", subtotal, descuento, total,
         "metodoPago", "montoRecibido", cambio, "createdAt")
      VALUES ($1,$2,$3,$4,$5,$6,$7::pos."MetodoPago",$8,$9,$10)
      ON CONFLICT (id) DO NOTHING
    `, [r.id, r.userId, r.customerId, r.subtotal, r.descuento, r.total,
        r.metodoPago, r.montoRecibido, r.cambio, r.createdAt]);
  }
  console.log(`   ✓  ${rows.length} ventas migradas`);
}

async function migrateSaleItems() {
  const { rows } = await pos.query(`SELECT * FROM "SaleItem"`);
  console.log(`\n📋  SaleItems: ${rows.length}`);
  for (const r of rows) {
    await ada.query(`
      INSERT INTO pos."SaleItem"
        (id, "saleId", "productId", cantidad, "precioUnitario", descuento, subtotal, "generoVenta")
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (id) DO NOTHING
    `, [r.id, r.saleId, r.productId, r.cantidad, r.precioUnitario,
        r.descuento, r.subtotal, r.generoVenta]);
  }
  console.log(`   ✓  ${rows.length} items migrados`);
}

async function migrateStockEntries() {
  const { rows } = await pos.query(`SELECT * FROM "StockEntry"`);
  console.log(`\n📥  StockEntries: ${rows.length}`);
  for (const r of rows) {
    await ada.query(`
      INSERT INTO pos."StockEntry" (id, "productId", "userId", cantidad, costo, nota, "createdAt")
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (id) DO NOTHING
    `, [r.id, r.productId, r.userId, r.cantidad, r.costo, r.nota, r.createdAt]);
  }
  console.log(`   ✓  ${rows.length} entradas de stock migradas`);
}

main().catch((e) => { console.error(e); process.exit(1); });
