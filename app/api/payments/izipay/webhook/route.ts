import { NextRequest, NextResponse } from "next/server";
import { sendOrderPaidPush } from "@/lib/push";
import { sendOrderConfirmation } from "@/lib/email";
import { izipayConfigured } from "@/lib/izipay";
import { procesarResultadoIzipay } from "@/lib/izipay-result";

/**
 * URL de notificación al final del pago (IPN). Es la fuente autoritativa del
 * resultado: si el comprador cierra la pestaña justo después de pagar, este es
 * el que aprueba la orden.
 *
 * Llega como formulario, no como JSON, y viene firmado con la CONTRASEÑA de la
 * API REST, no con la clave HMAC. `kr-hash-key` dice cuál se usó y se le hace
 * caso; sin claves configuradas se rechaza, nunca se deja pasar.
 */
export async function POST(request: NextRequest) {
  try {
    if (!izipayConfigured()) {
      return NextResponse.json({ error: "Izipay no está configurado" }, { status: 503 });
    }

    const form = await request.formData();
    const krAnswer = String(form.get("kr-answer") ?? "");
    const krHash = String(form.get("kr-hash") ?? "");
    const krHashKey = String(form.get("kr-hash-key") ?? "password");

    const resultado = await procesarResultadoIzipay({ krAnswer, krHash, krHashKey });

    if (!resultado.ok) {
      console.warn("Izipay IPN rechazado:", resultado.error);
      return NextResponse.json({ error: resultado.error }, { status: resultado.status });
    }

    // Recién aprobado → avisar por push y mandar el correo, una sola vez.
    // Si el navegador llegó primero, `yaProcesada` corta aquí y no se duplica.
    if (resultado.aprobado && !resultado.yaProcesada) {
      await sendOrderPaidPush(resultado.orderId);
      await sendOrderConfirmation(resultado.orderId);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Izipay webhook error:", error);
    return NextResponse.json({ error: "Error procesando la notificación" }, { status: 500 });
  }
}
