-- AlterTable
ALTER TABLE "categories" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

-- Initialize sortOrder based on current alphabetical order within each parent group
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(parent_id, '')
      ORDER BY name
    ) - 1 AS rn
  FROM "categories"
)
UPDATE "categories" c
SET sort_order = r.rn
FROM ranked r
WHERE c.id = r.id;
