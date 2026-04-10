-- Sync root stock field from POS sub-fields so frontend shows correct availability.
-- stock = stockHombre + stockMujer + stockAlmacenHombre + stockAlmacenMujer
UPDATE "Product"
SET stock = "stockHombre" + "stockMujer" + "stockAlmacenHombre" + "stockAlmacenMujer";
