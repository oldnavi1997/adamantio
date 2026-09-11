import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getShippingCost, getPaymentFee, esRecojo, TIENDA } from "@/lib/shipping";
import { piezasDeVariante, resolverLinea } from "@/lib/variantes";

const createOrderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    quantity: z.number().int().positive(),
    engravingText: z.string().optional(),
    selectedSize: z.string().optional(),
    variante: z.enum(["HOMBRE", "MUJER", "PAREJA"]).optional(),
  })),
  shipping: z.object({
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    documentType: z.enum(["DNI", "CE"]),
    documentNumber: z.string().min(1),
    phone: z.string().min(1),
    street: z.string(),
    department: z.string(),
    province: z.string(),
    district: z.string(),
    postalCode: z.string(),
    courier: z.enum(["shalom", "olva", "tienda"]),
  }).superRefine((shipping, ctx) => {
    if (esRecojo(shipping.courier)) return;
    for (const campo of ["street", "department", "province", "district", "postalCode"] as const) {
      if (!shipping[campo]) {
        ctx.addIssue({ code: "custom", path: [campo], message: "Falta la dirección de envío" });
      }
    }
  }),
  // La pasarela decide la comisión que se suma al total, así que hay que
  // conocerla antes de crear la orden.
  //
  // "mercadopago" sigue en el enum aunque el checkout ya no lo ofrezca: hay
  // órdenes viejas con ese valor y su ruta de cobro sigue en pie. Lo que cambia
  // es el defecto, para que una petición sin el campo no acabe con la comisión
  // de una pasarela que nadie puede pagar.
  paymentProvider: z.enum(["mercadopago", "izipay", "culqi"]).default("culqi"),
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

    // Qué se cobra por cada línea y qué variante se guarda. El precio sale
    // siempre de la base; el navegador solo dice cuál eligió.
    const lineas = [];
    for (const item of items) {
      const product = products.find((p) => p.id === item.id)!;
      const resuelta = resolverLinea(product, item.variante);
      if (!resuelta.ok) {
        return NextResponse.json(
          {
            error: `La opción elegida de «${product.name}» ya no está disponible. Vuelve a elegirla en la ficha del producto.`,
          },
          { status: 400 }
        );
      }
      if (resuelta.precio <= 0) {
        return NextResponse.json(
          { error: `«${product.name}» no tiene un precio válido` },
          { status: 400 }
        );
      }
      lineas.push({ item, product, variante: resuelta.variante, precio: resuelta.precio });
    }

    // Stock. Un anillo de pareja consume una pieza de cada lado, así que hay
    // que contar los dos por separado: un pedido con la pareja y además el
    // anillo de hombre necesita dos piezas de hombre y una de dama.
    type Piezas = { hombre: number; mujer: number; unidades: number };
    const piezas = new Map<string, Piezas>();
    for (const l of lineas) {
      const u = piezasDeVariante(l.variante, l.product.esPar);
      const acc = piezas.get(l.product.id) ?? { hombre: 0, mujer: 0, unidades: 0 };
      acc.hombre += u.hombre * l.item.quantity;
      acc.mujer += u.mujer * l.item.quantity;
      acc.unidades += l.item.quantity;
      piezas.set(l.product.id, acc);
    }

    for (const [productId, acc] of piezas) {
      const product = products.find((p) => p.id === productId)!;
      if (!product.esPar) {
        // Sin cambios: hay productos creados por el POS con stock agregado y
        // los contadores por lado en cero, y exigirles los sub-stocks los
        // dejaría incomprables de golpe.
        if (product.stock < acc.unidades) {
          return NextResponse.json(
            { error: `Stock insuficiente para ${product.name}` },
            { status: 400 }
          );
        }
        continue;
      }
      const dispH = product.stockHombre + product.stockAlmacenHombre;
      const dispM = product.stockMujer + product.stockAlmacenMujer;
      if (acc.hombre > dispH || acc.mujer > dispM) {
        const lado = acc.hombre > dispH ? "de hombre" : "de dama";
        return NextResponse.json(
          { error: `No queda stock suficiente del anillo ${lado} de «${product.name}»` },
          { status: 400 }
        );
      }
    }

    // Calculate costs
    const subtotal = lineas.reduce((sum, l) => sum + l.precio * l.item.quantity, 0);

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
    //
    // En recojo la dirección es la del local y la fija el servidor: lo que
    // mandara el navegador en esos campos da igual, no se usa.
    const recojo = esRecojo(shipping.courier);
    const destino = recojo
      ? {
          street: TIENDA.street,
          district: TIENDA.district,
          city: TIENDA.province,
          state: TIENDA.department,
          postalCode: TIENDA.postalCode,
        }
      : {
          street: shipping.street,
          district: shipping.district,
          city: shipping.province,
          state: shipping.department,
          postalCode: shipping.postalCode,
        };

    const address = await prisma.address.create({
      data: {
        userId,
        fullName: `${shipping.firstName} ${shipping.lastName}`.trim(),
        phone: shipping.phone,
        documentType: shipping.documentType,
        documentNumber: shipping.documentNumber,
        ...destino,
        country: "Peru",
      },
    });

    // Create order + items
    const order = await prisma.order.create({
      data: {
        userId,
        addressId: address.id,
        contactEmail: shipping.email,
        total,
        shippingCost,
        courier: shipping.courier,
        mpCommission,
        paymentProvider,
        status: "PENDING",
        items: {
          create: lineas.map((l) => ({
            productId: l.item.id,
            productName: l.product.name,
            productPrice: l.precio,
            quantity: l.item.quantity,
            engravingText: l.item.engravingText ?? null,
            selectedSize: l.item.selectedSize ?? null,
            variante: l.variante,
          })),
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
