import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getShippingCost, getPaymentFee } from "@/lib/shipping";

const createOrderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    quantity: z.number().int().positive(),
    engravingText: z.string().optional(),
    selectedSize: z.string().optional(),
  })),
  shipping: z.object({
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    documentType: z.enum(["DNI", "CE"]),
    documentNumber: z.string().min(1),
    phone: z.string().min(1),
    street: z.string().min(1),
    department: z.string().min(1),
    province: z.string().min(1),
    district: z.string().min(1),
    postalCode: z.string().min(1),
    courier: z.enum(["shalom", "olva"]),
  }),
  // La pasarela decide la comisión que se suma al total, así que hay que
  // conocerla antes de crear la orden.
  paymentProvider: z.enum(["mercadopago", "izipay"]).default("mercadopago"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { items, shipping, paymentProvider } = createOrderSchema.parse(body);

    // Fetch products
    const productIds = [...new Set(items.map((i) => i.id))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "Algunos productos no están disponibles" }, { status: 400 });
    }

    // Verify stock
    const qtyByProduct = items.reduce<Record<string, number>>((acc, item) => {
      acc[item.id] = (acc[item.id] ?? 0) + item.quantity;
      return acc;
    }, {});

    for (const [productId, qty] of Object.entries(qtyByProduct)) {
      const product = products.find((p) => p.id === productId);
      if (!product || product.stock < qty) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${product?.name ?? productId}` },
          { status: 400 }
        );
      }
    }

    // Calculate costs
    const subtotal = items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.id)!;
      return sum + Number(product.price) * item.quantity;
    }, 0);

    const isTestMode = products.some((p) => p.testMode);
    const hasFreeShipping = products.some((p) => p.freeShipping);
    const shippingCost = isTestMode || hasFreeShipping
      ? 0
      : getShippingCost(shipping.courier, shipping.department);

    const beforeCommission = subtotal + shippingCost;
    const mpCommission = isTestMode
      ? 0
      : Number(getPaymentFee(paymentProvider, beforeCommission).toFixed(2));
    const total = Number((beforeCommission + mpCommission).toFixed(2));

    // Resolve userId — guard against stale sessions pointing to deleted users
    let userId: string | null = null;
    if (session?.user?.id) {
      const exists = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true },
      });
      if (exists) userId = session.user.id;
    }

    // Create address
    const address = await prisma.address.create({
      data: {
        userId,
        fullName: `${shipping.firstName} ${shipping.lastName}`.trim(),
        phone: shipping.phone,
        documentType: shipping.documentType,
        documentNumber: shipping.documentNumber,
        street: shipping.street,
        district: shipping.district,
        city: shipping.province,
        state: shipping.department,
        postalCode: shipping.postalCode,
        country: "Peru",
      },
    });

    // Create order + items
    const order = await prisma.order.create({
      data: {
        userId,
        addressId: address.id,
        guestEmail: userId ? null : shipping.email,
        total,
        shippingCost,
        mpCommission,
        paymentProvider,
        status: "PENDING",
        items: {
          create: items.map((item) => {
            const product = products.find((p) => p.id === item.id)!;
            return {
              productId: item.id,
              productName: product.name,
              productPrice: Number(product.price),
              quantity: item.quantity,
              engravingText: item.engravingText ?? null,
              selectedSize: item.selectedSize ?? null,
            };
          }),
        },
      },
    });

    return NextResponse.json({ orderId: order.id, total, shippingCost, mpCommission });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Create order error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
