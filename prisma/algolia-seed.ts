import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import { indexProduct } from "../lib/algolia-sync";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const products = await prisma.product.findMany({ include: { categories: true } });

  for (const p of products) {
    const primaryCat = p.categories.find((c) => c.id === p.primaryCategoryId) ?? p.categories[0];
    await indexProduct({ ...p, category: primaryCat ?? null });
  }

  console.log(`Indexados ${products.length} productos en Algolia`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
