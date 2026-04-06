/**
 * WooCommerce CSV → Adamantio importer
 *
 * Usage:
 *   npx tsx prisma/importWoo.ts ruta/productos.csv
 *   npx tsx prisma/importWoo.ts productos.csv --dry-run
 *   npx tsx prisma/importWoo.ts productos.csv --skip-images
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { parse } from "csv-parse/sync";
import { v2 as cloudinary } from "cloudinary";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load env vars from .env.local (same as seed.ts pattern)
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ---------------------------------------------------------------------------
// Column name mapping (WooCommerce ES → field key)
// Handles both Spanish and English exports.
// ---------------------------------------------------------------------------

/** Read a field trying multiple possible column names. */
function col(row: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    if (key in row && row[key] !== undefined) return row[key] ?? "";
  }
  return "";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/** Normalize a string for attribute key matching (lowercase, no diacritics). */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Parse WooCommerce Categories field.
 * Format: "Parent > Child, OtherCat > Sub"
 * Returns the deepest segment of the first path.
 */
function parsePrimaryCategory(raw: string): string {
  if (!raw) return "Sin categoría";
  const firstPath = raw.split(",")[0].trim();
  const segments = firstPath.split(">").map((s) => s.trim());
  return segments[segments.length - 1] || "Sin categoría";
}

/**
 * Extract named attribute from WooCommerce dynamic attribute columns.
 * Tries both English ("Attribute N name") and Spanish ("Atributo N nombre") variants.
 */
function extractAttr(row: Record<string, string>, targetName: string): string | undefined {
  const target = normalize(targetName);
  for (let i = 1; i <= 10; i++) {
    // English and Spanish column name variants
    const nameCandidates = [`Attribute ${i} name`, `Atributo ${i} nombre`];
    const valCandidates = [`Attribute ${i} value(s)`, `Atributo ${i} valor(es)`];
    for (let c = 0; c < nameCandidates.length; c++) {
      const nameKey = nameCandidates[c];
      const valKey = valCandidates[c];
      if (nameKey in row && normalize(row[nameKey]) === target) {
        return row[valKey]?.trim() || undefined;
      }
    }
  }
  return undefined;
}

/** Attribute aliases: maps normalized search terms to possible WooCommerce column names. */
const ATTR_ALIASES: Record<string, string[]> = {
  brand: ["marca", "brand"],
  frameType: ["tipo de montura", "frame type", "tipo montura"],
  frameMaterial: ["material", "frame material", "material montura"],
  frameColor: ["color", "frame color", "color montura"],
  lensType: ["tipo de lente", "lens type", "tipo lente"],
  gender: ["genero", "sexo", "gender"],
};

function extractNamedAttr(row: Record<string, string>, fieldKey: keyof typeof ATTR_ALIASES): string | undefined {
  for (const alias of ATTR_ALIASES[fieldKey]) {
    const val = extractAttr(row, alias);
    if (val) return val;
  }
  return undefined;
}

async function uploadImageToCloudinary(url: string): Promise<string | null> {
  try {
    const result = await cloudinary.uploader.upload(url, {
      folder: "adamantio-products",
      transformation: [{ width: 1200, height: 1200, crop: "limit" }, { quality: "auto" }],
    });
    return result.secure_url;
  } catch (err) {
    console.error(`  ⚠ Error subiendo imagen ${url}:`, (err as Error).message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const csvPath = args.find((a) => !a.startsWith("--"));
const dryRun = args.includes("--dry-run");
const skipImages = args.includes("--skip-images");

if (!csvPath) {
  console.error("Uso: npx tsx prisma/importWoo.ts <ruta-csv> [--dry-run] [--skip-images]");
  process.exit(1);
}

const resolvedCsv = path.resolve(process.cwd(), csvPath);
if (!fs.existsSync(resolvedCsv)) {
  console.error(`Error: no se encontró el archivo CSV: ${resolvedCsv}`);
  process.exit(1);
}

async function main() {
  console.log(`\n📦 Adamantio — Importador WooCommerce CSV`);
  console.log(`   Archivo : ${resolvedCsv}`);
  console.log(`   Modo    : ${dryRun ? "DRY RUN (sin escritura)" : "LIVE"}`);
  console.log(`   Imágenes: ${skipImages ? "omitidas" : "subiendo a Cloudinary"}\n`);

  // Parse CSV
  const raw = fs.readFileSync(resolvedCsv, "utf-8");
  const rows: Record<string, string>[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });

  // Filter: skip variation rows (child rows of variable products)
  // Column may be "Type" (EN) or "Tipo" (ES) — if absent, treat all rows as products.
  const products = rows.filter((r) => {
    const type = col(r, "Type", "Tipo").toLowerCase();
    return type === "simple" || type === "variable" || type === "";
  });

  console.log(`Filas en CSV     : ${rows.length}`);
  console.log(`Productos a importar: ${products.length} (variaciones omitidas: ${rows.length - products.length})\n`);

  const stats = { created: 0, updated: 0, errors: 0, skipped: 0 };
  const categoryCache: Record<string, string> = {}; // slug → id

  for (const row of products) {
    const name = col(row, "Nombre", "Name").trim();
    if (!name) {
      console.warn(`  ⚠ Fila sin nombre, omitida`);
      stats.skipped++;
      continue;
    }

    // Skip plugin/system artifacts (e.g. YITH add-ons)
    if (name.toLowerCase().includes("yith") || name.toLowerCase().includes("woocommerce product addon")) {
      console.log(`  ⊘ Omitido (artefacto de plugin)`);
      stats.skipped++;
      continue;
    }

    const slug = slugify(name);
    const typeLabel = col(row, "Type", "Tipo") || "simple";
    console.log(`→ [${typeLabel}] ${name}`);

    try {
      // ---------- Category ----------
      const catName = parsePrimaryCategory(col(row, "Categorías", "Categories"));
      const catSlug = slugify(catName);

      let categoryId = categoryCache[catSlug];
      if (!categoryId) {
        if (!dryRun) {
          const cat = await prisma.category.upsert({
            where: { slug: catSlug },
            update: {},
            create: { name: catName, slug: catSlug },
          });
          categoryId = cat.id;
        } else {
          categoryId = `dry-run-${catSlug}`;
          console.log(`  [DRY] Categoría: "${catName}" (${catSlug})`);
        }
        categoryCache[catSlug] = categoryId;
      }

      // ---------- Prices ----------
      const regularPrice = parseFloat(col(row, "Precio normal", "Regular price") || "0") || 0;
      const salePrice = parseFloat(col(row, "Precio rebajado", "Sale price") || "") || null;

      // If sale price exists → it becomes price, regular becomes comparePrice
      const price = salePrice ?? regularPrice;
      const comparePrice = salePrice && regularPrice > salePrice ? regularPrice : null;

      // ---------- Stock ----------
      const stock = parseInt(col(row, "Inventario", "Stock") || "0", 10) || 0;

      // ---------- Flags ----------
      const featured = col(row, "¿Destacado?", "Is featured?") === "1";
      // "Visibilidad en el catálogo": "visible" | "hidden" | "search" | "catalog"
      // "Published" / "Publicado": "1" | "0"
      const visibility = col(row, "Visibilidad en el catálogo", "Catalog visibility").toLowerCase();
      const published = col(row, "Publicado", "Published");
      const active = visibility !== "hidden" && published !== "0";

      // ---------- Description ----------
      const description =
        col(row, "Descripción", "Description").trim() ||
        col(row, "Descripción corta", "Short description").trim() ||
        null;

      // ---------- Attributes ----------
      const brand = extractNamedAttr(row, "brand") ?? null;
      const frameType = extractNamedAttr(row, "frameType") ?? null;
      const frameMaterial = extractNamedAttr(row, "frameMaterial") ?? null;
      const frameColor = extractNamedAttr(row, "frameColor") ?? null;
      const lensType = extractNamedAttr(row, "lensType") ?? null;
      const gender = extractNamedAttr(row, "gender") ?? null;

      // ---------- Images ----------
      let images: string[] = [];
      const rawImages = col(row, "Imágenes", "Images");
      const imageUrls = rawImages
        .split(",")
        .map((u) => u.trim())
        .filter((u) => u.startsWith("http"));

      if (imageUrls.length > 0) {
        if (skipImages || dryRun) {
          images = imageUrls; // keep original URLs in dry-run / skip-images mode
          if (dryRun) console.log(`  [DRY] ${imageUrls.length} imagen(es) (no subidas)`);
        } else {
          console.log(`  Subiendo ${imageUrls.length} imagen(es) a Cloudinary...`);
          for (const imgUrl of imageUrls) {
            const uploaded = await uploadImageToCloudinary(imgUrl);
            if (uploaded) images.push(uploaded);
          }
        }
      }

      // ---------- Upsert product ----------
      if (!dryRun) {
        const existing = await prisma.product.findUnique({ where: { slug } });
        await prisma.product.upsert({
          where: { slug },
          update: {
            name,
            description,
            price,
            comparePrice,
            stock,
            images,
            brand,
            frameType,
            frameMaterial,
            frameColor,
            lensType,
            gender,
            featured,
            active,
            primaryCategoryId: categoryId,
            categories: { set: [{ id: categoryId }] },
          },
          create: {
            name,
            slug,
            description,
            price,
            comparePrice,
            stock,
            images,
            brand,
            frameType,
            frameMaterial,
            frameColor,
            lensType,
            gender,
            featured,
            active,
            primaryCategoryId: categoryId,
            categories: { connect: [{ id: categoryId }] },
          },
        });
        if (existing) {
          console.log(`  ✓ Actualizado`);
          stats.updated++;
        } else {
          console.log(`  ✓ Creado`);
          stats.created++;
        }
      } else {
        console.log(`  [DRY] price=${price} stock=${stock} brand=${brand ?? "-"} featured=${featured}`);
        stats.created++; // count as "would create" for dry-run
      }
    } catch (err) {
      console.error(`  ✗ Error en "${name}":`, (err as Error).message);
      stats.errors++;
    }
  }

  // ---------- Summary ----------
  console.log("\n─────────────────────────────────────");
  if (dryRun) {
    console.log(`DRY RUN completado — ningún dato fue escrito`);
    console.log(`  Productos detectados : ${stats.created + stats.errors + stats.skipped}`);
  } else {
    console.log(`Importación completada`);
    console.log(`  Creados    : ${stats.created}`);
    console.log(`  Actualizados: ${stats.updated}`);
  }
  if (stats.errors > 0) console.log(`  Errores    : ${stats.errors}`);
  if (stats.skipped > 0) console.log(`  Omitidos   : ${stats.skipped}`);
  console.log("─────────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
