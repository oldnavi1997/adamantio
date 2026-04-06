import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from "../app/generated/prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Admin user
  const hashedPassword = await bcrypt.hash("Admin123!", 12);
  await prisma.user.upsert({
    where: { email: "admin@adamantio.com.ar" },
    update: {},
    create: {
      email: "admin@adamantio.com.ar",
      fullName: "Admin Adamantio",
      passwordHash: hashedPassword,
      role: UserRole.ADMIN,
    },
  });

  // Categories (id must be provided — no auto-generation in schema)
  const categoryData = [
    { id: "cat-anillos", name: "Anillos" },
    { id: "cat-collares", name: "Collares" },
    { id: "cat-pulseras", name: "Pulseras" },
    { id: "cat-aros", name: "Aros" },
    { id: "cat-accesorios", name: "Accesorios" },
  ];

  for (const cat of categoryData) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  // Products
  const products = [
    {
      name: "Anillo Solitario Plata",
      description: "Anillo solitario en plata 925 con zircón central. Diseño clásico y elegante para cualquier ocasión.",
      price: 120,
      stock: 20,
      category: "Anillos",
      isActive: true,
      imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80",
      imageUrls: [
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80",
        "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800&q=80",
      ],
    },
    {
      name: "Anillo Doble Banda Oro",
      description: "Anillo doble banda en baño de oro 18k. Estilo minimalista con acabado satinado.",
      price: 180,
      stock: 12,
      category: "Anillos",
      isActive: true,
      imageUrl: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&q=80",
      imageUrls: ["https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&q=80"],
    },
    {
      name: "Collar Cadena Veneciana Plata",
      description: "Collar cadena veneciana en plata 925. Largo 45 cm, grosor 1,5 mm. Cierre de langosta.",
      price: 98,
      stock: 30,
      category: "Collares",
      isActive: true,
      imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80",
      imageUrls: ["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80"],
    },
    {
      name: "Collar Corazón con Zircones",
      description: "Collar con dije de corazón pavé en plata 925 con microzircones. Cadena incluida 40 cm.",
      price: 159,
      stock: 8,
      category: "Collares",
      isActive: true,
      imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80",
      imageUrls: ["https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80"],
    },
    {
      name: "Pulsera Esclava Plata",
      description: "Pulsera esclava rígida en plata 925. Apertura lateral con bisagra. Ancho 8 mm.",
      price: 112,
      stock: 15,
      category: "Pulseras",
      isActive: true,
      imageUrl: "https://images.unsplash.com/photo-1573408300822-9af3b94ff4da?w=800&q=80",
      imageUrls: ["https://images.unsplash.com/photo-1573408300822-9af3b94ff4da?w=800&q=80"],
    },
    {
      name: "Aros Argolla Lisa Plata",
      description: "Aros argolla en plata 925. Diámetro 20 mm, grosor 2 mm. Cierre clic-clac.",
      price: 75,
      stock: 25,
      category: "Aros",
      isActive: true,
      imageUrl: "https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=800&q=80",
      imageUrls: ["https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=800&q=80"],
    },
  ];

  for (const product of products) {
    const existing = await prisma.product.findFirst({ where: { name: product.name } });
    if (!existing) {
      await prisma.product.create({ data: product });
    }
  }

  console.log("Seed completado: admin + 5 categorías + 6 productos (precios en PEN)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
