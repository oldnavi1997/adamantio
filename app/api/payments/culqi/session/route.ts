import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  CULQI_MAX_CENTIMOS,
  CULQI_MIN_CENTIMOS,
  culqiConfigured,
  culqiUrls,
} from "@/lib/culqi";
import { aCentimos } from "@/lib/utils";

const sessionSchema = z.object({ orderId: z.string() });

/**
 * Devuelve lo que el Checkout Custom necesita para arrancar en el navegador.
 *
 * El importe se lee de la BD y viaja al navegador sólo para pintarlo: el cargo
 * lo hace `/api/payments/culqi/charge` con el total de la orden, así que aunque
 * alguien manipule este valor no cambia lo que se cobra.
 *
 * La clave pública sale por aquí y no como `NEXT_PUBLIC_*`, igual que con
 * Izipay: así el flag de configuración se evalúa en el servidor en cada request.
 */
export async function POST(request: NextRequest) {
  try {
    if (!culqiConfigured()) {
      return NextResponse.json({ error: "Culqi no está configurado" }, { status: 503 });
    }

    const { orderId } = sessionSchema.parse(await request.json());

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { email: true } } },
    });
    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }
    if (order.status !== "PENDING") {
      return NextResponse.json({ error: "La orden ya fue procesada" }, { status: 400 });
    }
    if (order.paymentProvider !== "culqi") {
      return NextResponse.json({ error: "La orden no es de Culqi" }, { status: 400 });
    }

    const amount = aCentimos(Number(order.total));
    if (amount < CULQI_MIN_CENTIMOS || amount > CULQI_MAX_CENTIMOS) {
      return NextResponse.json(
        { error: "El importe está fuera del rango que acepta Culqi (S/3.00 a S/9,999.00)" },
        { status: 400 }
      );
    }

    const { js, tresDS } = culqiUrls();
    const base = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

    return NextResponse.json({
      publicKey: process.env.CULQI_PUBLIC_KEY,
      amount,
      currency: "PEN",
      email: order.contactEmail ?? order.user?.email ?? "",
      jsUrl: js,
      tresDSUrl: tresDS,
      // Culqi3DS lo exige para devolver el resultado del reto a nuestra página.
      returnUrl: `${base}/checkout`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Culqi session error:", error);
    return NextResponse.json({ error: "No se pudo iniciar el pago con Culqi" }, { status: 500 });
  }
}
