import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
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
      name: "Admin Adamantio",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  // Categories
  const categories = [
    {
      name: "Anillos",
      slug: "anillos",
      description: "Anillos de plata, oro y materiales preciosos para cada ocasión",
      imageUrl: null,
    },
    {
      name: "Collares",
      slug: "collares",
      description: "Collares y cadenas con diseño exclusivo y acabado artesanal",
      imageUrl: null,
    },
    {
      name: "Pulseras",
      slug: "pulseras",
      description: "Pulseras y brazaletes para complementar tu estilo único",
      imageUrl: null,
    },
    {
      name: "Aros",
      slug: "aros",
      description: "Aros y pendientes de plata y baño de oro para toda ocasión",
      imageUrl: null,
    },
    {
      name: "Accesorios",
      slug: "accesorios",
      description: "Broches, dijes y complementos de joyería",
      imageUrl: null,
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // Fetch category IDs
  const catAnillos = await prisma.category.findUnique({ where: { slug: "anillos" } });
  const catCollares = await prisma.category.findUnique({ where: { slug: "collares" } });
  const catPulseras = await prisma.category.findUnique({ where: { slug: "pulseras" } });
  const catAros = await prisma.category.findUnique({ where: { slug: "aros" } });

  // Products con precios en PEN
  const products = [
    {
      name: "Anillo Solitario Plata",
      slug: "anillo-solitario-plata",
      description:
        "Anillo solitario en plata 925 con zircón central. Diseño clásico y elegante para cualquier ocasión.",
      price: 120,
      comparePrice: 160,
      stock: 20,
      brand: "Adamantio",
      material: "Plata 925",
      color: "Plateado",
      stonetype: "Zircón",
      finish: "Pulido",
      gender: "Mujer",
      featured: true,
      active: true,
      primaryCategoryId: catAnillos!.id,
      categoryIds: [catAnillos!.id],
      images: [
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80",
        "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800&q=80",
      ],
    },
    {
      name: "Anillo Doble Banda Oro",
      slug: "anillo-doble-banda-oro",
      description:
        "Anillo doble banda en baño de oro 18k. Estilo minimalista con acabado satinado.",
      price: 180,
      comparePrice: null,
      stock: 12,
      brand: "Adamantio",
      material: "Baño de Oro 18k",
      color: "Dorado",
      stonetype: null,
      finish: "Satinado",
      gender: "Unisex",
      featured: true,
      active: true,
      primaryCategoryId: catAnillos!.id,
      categoryIds: [catAnillos!.id],
      images: [
        "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&q=80",
      ],
    },
    {
      name: "Collar Cadena Veneciana Plata",
      slug: "collar-cadena-veneciana-plata",
      description:
        "Collar cadena veneciana en plata 925. Largo 45 cm, grosor 1,5 mm. Cierre de langosta.",
      price: 98,
      comparePrice: 120,
      stock: 30,
      brand: "Adamantio",
      material: "Plata 925",
      color: "Plateado",
      stonetype: null,
      finish: "Pulido",
      gender: "Unisex",
      featured: false,
      active: true,
      primaryCategoryId: catCollares!.id,
      categoryIds: [catCollares!.id],
      images: [
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80",
      ],
    },
    {
      name: "Collar Corazón con Zircones",
      slug: "collar-corazon-con-zircones",
      description:
        "Collar con dije de corazón pavé en plata 925 con microzircones. Cadena incluida 40 cm.",
      price: 159,
      comparePrice: 195,
      stock: 8,
      brand: "Adamantio",
      material: "Plata 925",
      color: "Plateado",
      stonetype: "Zircón",
      finish: "Pulido brillante",
      gender: "Mujer",
      featured: true,
      active: true,
      primaryCategoryId: catCollares!.id,
      categoryIds: [catCollares!.id],
      images: [
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80",
      ],
    },
    {
      name: "Pulsera Esclava Plata",
      slug: "pulsera-esclava-plata",
      description:
        "Pulsera esclava rígida en plata 925. Apertura lateral con bisagra. Ancho 8 mm.",
      price: 112,
      comparePrice: null,
      stock: 15,
      brand: "Adamantio",
      material: "Plata 925",
      color: "Plateado",
      stonetype: null,
      finish: "Alto brillo",
      gender: "Mujer",
      featured: true,
      active: true,
      primaryCategoryId: catPulseras!.id,
      categoryIds: [catPulseras!.id],
      images: [
        "https://images.unsplash.com/photo-1573408300822-9af3b94ff4da?w=800&q=80",
      ],
    },
    {
      name: "Aros Argolla Lisa Plata",
      slug: "aros-argolla-lisa-plata",
      description:
        "Aros argolla en plata 925. Diámetro 20 mm, grosor 2 mm. Cierre clic-clac.",
      price: 75,
      comparePrice: 90,
      stock: 25,
      brand: "Adamantio",
      material: "Plata 925",
      color: "Plateado",
      stonetype: null,
      finish: "Pulido",
      gender: "Mujer",
      featured: false,
      active: true,
      primaryCategoryId: catAros!.id,
      categoryIds: [catAros!.id],
      images: [
        "https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=800&q=80",
      ],
    },
  ];

  for (const product of products) {
    const { categoryIds, primaryCategoryId, ...productData } = product;
    await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {
        price: productData.price,
        comparePrice: productData.comparePrice,
        primaryCategoryId,
      },
      create: {
        ...productData,
        price: productData.price,
        comparePrice: productData.comparePrice,
        primaryCategoryId,
        categories: { connect: categoryIds.map((id) => ({ id })) },
      },
    });
  }

  console.log("Seed completado: admin + 5 categorias + 6 productos (precios en PEN)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
