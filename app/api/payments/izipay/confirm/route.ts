import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendOrderConfirmation } from "@/lib/email";
import { sendOrderPaidPush } from "@/lib/push";
import { izipayConfigured } from "@/lib/izipay";
import { procesarResultadoIzipay } from "@/lib/izipay-result";

const confirmSchema = z.object({
  krAnswer: z.string(),
  krHash: z.string(),
});

/**
 * Recibe el resultado que `KR.onSubmit` entrega en el navegador. Responde con la
 * misma forma que `/api/payments/process` (`{ status, paymentId, statusDetail }`)
 * para que el checkout no tenga que distinguir pasarelas.
 *
 * No acepta un `orderId` del cliente: la orden sale del `orderId` que viene
 * firmado dentro de `kr-answer`, que el navegador no puede alterar.
 */
export async function POST(request: NextRequest) {
  try {
    if (!izipayConfigured()) {
      return NextResponse.json({ error: "Izipay no está configurado" }, { status: 503 });
    }

    const { krAnswer, krHash } = confirmSchema.parse(await request.json());

    // El navegador firma siempre con la clave HMAC-SHA-256, nunca con la
    // contraseña de la API: se fija aquí en vez de dejar que lo diga el cliente.
    const resultado = await procesarResultadoIzipay({
      krAnswer,
      krHash,
      krHashKey: "sha256_hmac",
    });

    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: resultado.status });
    }

    if (resultado.aprobado && !resultado.yaProcesada) {
      // Fuera de la transacción: hacen red y se tragan sus propios errores.
      // El push va también aquí y no sólo en el IPN: si el navegador llega
      // primero, el IPN ve `yaProcesada` y el POS nunca se enteraría de la venta.
      sendOrderConfirmation(resultado.orderId).catch(console.error);
      sendOrderPaidPush(resultado.orderId).catch(console.error);
    }

    return NextResponse.json({
      status: resultado.aprobado ? "approved" : "rejected",
      orderId: resultado.orderId,
      paymentId: resultado.paymentId,
      statusDetail: resultado.statusDetail,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Izipay confirm error:", error);
    return NextResponse.json({ error: "Error confirmando el pago" }, { status: 500 });
  }
}
