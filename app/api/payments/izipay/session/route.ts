import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { crearFormToken, izipayConfigured, izipayUrls } from "@/lib/izipay";

const sessionSchema = z.object({ orderId: z.string() });

/**
 * Devuelve lo que el formulario embebido necesita para arrancar. El `formToken`
 * se pide con el importe leído de la BD, así que el navegador no puede cobrarse
 * una cifra distinta de la de la orden.
 */
export async function POST(request: NextRequest) {
  try {
    if (!izipayConfigured()) {
      return NextResponse.json({ error: "Izipay no está configurado" }, { status: 503 });
    }

    const { orderId } = sessionSchema.parse(await request.json());

    // `address` viaja porque `crearFormToken` saca de ahí los datos del comprador.
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { address: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }
    if (order.status !== "PENDING") {
      return NextResponse.json({ error: "La orden ya fue procesada" }, { status: 400 });
    }
    if (order.paymentProvider !== "izipay") {
      return NextResponse.json({ error: "La orden no es de Izipay" }, { status: 400 });
    }

    const { js, css, themeJs } = izipayUrls();
    return NextResponse.json({
      formToken: await crearFormToken(order),
      publicKey: process.env.IZIPAY_PUBLIC_KEY,
      jsUrl: js,
      cssUrl: css,
      themeJsUrl: themeJs,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Izipay session error:", error);
    return NextResponse.json({ error: "No se pudo iniciar el pago con Izipay" }, { status: 500 });
  }
}
