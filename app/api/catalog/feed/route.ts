import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { productThumbnail } from "@/lib/media";

export const dynamic = "force-dynamic";

function escapeCsvField(value: string): string {
  if (value.includes('"') || value.includes(",") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      comparePrice: true,
      stock: true,
      imageUrl: true,
      imageUrls: true,
      category: true,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const headers = ["id", "title", "description", "availability", "condition", "price", "sale_price", "link", "image_link", "brand"];

  const rows = products.map((p) => {
    const availability = p.stock > 0 ? "in stock" : "out of stock";
    const enOferta = p.comparePrice != null && Number(p.comparePrice) > Number(p.price);
    const price = `${Number(enOferta ? p.comparePrice : p.price).toFixed(2)} PEN`;
    const salePrice = enOferta ? `${Number(p.price).toFixed(2)} PEN` : "";
    const link = `${appUrl}/joyas/${p.id}`;
    const imageLink = productThumbnail(p) ?? "";
    const description = p.description ?? "Sin descripción";

    return [
      escapeCsvField(p.id),
      escapeCsvField(p.name),
      escapeCsvField(description),
      escapeCsvField(availability),
      "new",
      escapeCsvField(price),
      escapeCsvField(salePrice),
      escapeCsvField(link),
      escapeCsvField(imageLink),
      "Adamantio",
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
