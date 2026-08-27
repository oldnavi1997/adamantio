import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmation } from "@/lib/email";
import { sendOrderPaidPush } from "@/lib/push";
import { crearCargo, culqiConfigured, type CulqiError } from "@/lib/culqi";
import { aplicarCargoCulqi, registrarRechazoCulqi } from "@/lib/culqi-result";

const chargeSchema = z.object({
  orderId: z.string(),
  tokenId: z.string(),
  deviceFingerPrintId: z.string().optional(),
  /** Sólo en el segundo intento, con lo que devolvió el reto 3DS. */
  authentication3DS: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Ejecuta el cargo en Culqi. Responde con la misma forma que
 * `/api/payments/process` y `/api/payments/izipay/confirm`
 * (`{ status, paymentId, statusDetail }`) para que el checkout no tenga que
 * distinguir pasarelas, con un único valor nuevo: `"auth_required"`.
 *
 * Ese estado no es un error. Significa que el motor antifraude de Culqi pide
 * 3D Secure: el navegador lanza el reto con Culqi3DS y vuelve a llamar aquí con
 * `authentication3DS`. El token y el `deviceFingerPrintId` tienen que ser los
 * mismos que en el primer intento o Culqi rechaza el segundo cargo.
 */
export async function POST(request: NextRequest) {
  try {
    if (!culqiConfigured()) {
      return NextResponse.json({ error: "Culqi no está configurado" }, { status: 503 });
    }

    const data = chargeSchema.parse(await request.json());

    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: { address: true, user: { select: { email: true } } },
    });
    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    if (order.status !== "PENDING") {
      return NextResponse.json({ error: "La orden ya fue procesada" }, { status: 400 });
    }
    if (order.paymentProvider !== "culqi") {
      return NextResponse.json({ error: "La orden no es de Culqi" }, { status: 400 });
    }

    const email = order.user?.email ?? order.guestEmail ?? "";
    const resultado = await crearCargo(order, {
      email,
      tokenId: data.tokenId,
      deviceFingerPrintId: data.deviceFingerPrintId,
      authentication3DS: data.authentication3DS,
    });

    if (resultado.tipo === "requiere3ds") {
      return NextResponse.json({ status: "auth_required", orderId: order.id });
    }

    if (resultado.tipo === "rechazado") {
      // Sin `charge_id` no hay nada que guardar: `Payment.externalReference` es
      // @unique y un rechazo sin id no se puede desduplicar.
      const chargeId = (resultado.raw as CulqiError | null)?.charge_id;
      if (chargeId) {
        await registrarRechazoCulqi({
          orderId: order.id,
          chargeId,
          amount: order.total,
          statusDetail: resultado.mensaje,
          rawPayload: resultado.raw,
        });
      }
      return NextResponse.json({
        status: "rejected",
        orderId: order.id,
        paymentId: chargeId,
        statusDetail: resultado.mensaje,
      });
    }

    const aplicado = await aplicarCargoCulqi(resultado.charge);
    if (!aplicado.ok) {
      return NextResponse.json({ error: aplicado.error }, { status: aplicado.status });
    }

    if (aplicado.aprobado && !aplicado.yaProcesada) {
      // `after` y no una promesa suelta: en Vercel la función serverless se
      // congela al devolver la respuesta y el envío se quedaría a medias.
      after(() => sendOrderConfirmation(order.id));
      after(() => sendOrderPaidPush(order.id));
    }

    return NextResponse.json({
      status: aplicado.aprobado ? "approved" : "rejected",
      orderId: aplicado.orderId,
      paymentId: aplicado.paymentId,
      statusDetail: aplicado.statusDetail,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Culqi charge error:", error);
    return NextResponse.json({ error: "Error procesando el pago" }, { status: 500 });
  }
}
