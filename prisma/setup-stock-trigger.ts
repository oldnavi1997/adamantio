/**
 * setup-stock-trigger.ts
 * Crea un trigger en pos."Product" que sincroniza el stock a public."Product"
 * cada vez que cambia. Usa el SKU como clave de unión.
 *
 * Uso:
 *   npx tsx prisma/setup-stock-trigger.ts
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
  console.log("✅  Conectado\n");

  // Función del trigger
  await ada.query(`
    CREATE OR REPLACE FUNCTION sync_pos_stock_to_adamantio()
    RETURNS TRIGGER AS $$
    BEGIN
      UPDATE public."Product"
      SET stock = NEW.stock, "updatedAt" = now()
      WHERE sku = NEW.sku;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  console.log("✓  Función sync_pos_stock_to_adamantio creada");

  // Eliminar trigger anterior si existe
  await ada.query(`
    DROP TRIGGER IF EXISTS pos_stock_sync ON pos."Product";
  `);

  // Crear trigger
  await ada.query(`
    CREATE TRIGGER pos_stock_sync
    AFTER UPDATE OF stock ON pos."Product"
    FOR EACH ROW
    WHEN (OLD.stock IS DISTINCT FROM NEW.stock)
    EXECUTE FUNCTION sync_pos_stock_to_adamantio();
  `);
  console.log("✓  Trigger pos_stock_sync creado en pos.\"Product\"");

  console.log("\n🎉  Trigger activo — el stock de Adamantio se sincronizará automáticamente desde el POS");
  await ada.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
