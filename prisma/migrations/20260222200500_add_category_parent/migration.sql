ALTER TABLE "categories"
ADD COLUMN IF NOT EXISTS "parent_id" TEXT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'categories_parent_id_fkey'
      AND table_name = 'categories'
  ) THEN
    ALTER TABLE "categories"
    ADD CONSTRAINT "categories_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "categories"("id")
    ON DELETE SET NULL;
  END IF;
END $$;
