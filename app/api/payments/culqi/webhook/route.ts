import { NextRequest, NextResponse } from "next/server";
import { sendOrderPaidPush } from "@/lib/push";
import { sendOrderConfirmation } from "@/lib/email";
import { consultarCargo, culqiConfigured } from "@/lib/culqi";
import { aplicarCargoCulqi } from "@/lib/culqi-result";

/**
 * Notificación de Culqi. Es una red de seguridad, no el camino principal: con
 * tarjeta y Yape el cargo lo ejecuta nuestro propio backend y el resultado es
 * inmediato. Este webhook cubre el caso de que el cobro salga bien pero la
 * respuesta se pierda antes de que la orden quede aprobada.
 *
 * El cuerpo NO se valida por firma; se toma sólo el id del cargo y el estado
 * real se vuelve a pedir a la API con la llave secreta. Es la misma mitigación
 * que usa el webhook de Mercado Pago: la fuente de verdad es la pasarela, no la
 * petición que nos llega.
 */
/**
 * Saca el id del cargo del cuerpo de la notificación.
 *
 * OJO con la forma real del evento de Culqi:
 *
 *   { "object": "event", "id": "evt_test_…", "type": "charge.creation.succeeded",
 *     "data": "{\"object\":\"charge\",\"id\":\"chr_test_…\", …}" }
 *
 * `data` es una **cadena** con el JSON del cargo, no un objeto. Un `body.data.id`
 * ingenuo devuelve `undefined` y cae al id del evento (`evt_…`), con lo que la
 * notificación se descarta en silencio y la orden se queda PENDING para siempre.
 *
 * El cargo embebido viene además en camelCase (`currencyCode`), distinto del
 * snake_case que devuelve la API REST. Por eso de aquí sólo sale el id: el cargo
 * de verdad se relee con `consultarCargo`, que es lo que valida la firma de
 * facto —nadie puede falsificar un id que exista en Culqi con nuestro importe.
 */
function idDelCargo(body: unknown): string | undefined {
  const raiz = body as { id?: unknown; data?: unknown } | null;

  let data: unknown = raiz?.data;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      data = undefined;
    }
  }

  const idEmbebido = (data as { id?: unknown } | undefined)?.id;
  if (typeof idEmbebido === "string" && idEmbebido.startsWith("chr_")) return idEmbebido;

  // Algunas integraciones reciben el cargo pelado, sin envoltorio de evento.
  if (typeof raiz?.id === "string" && raiz.id.startsWith("chr_")) return raiz.id;

  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    if (!culqiConfigured()) {
      return NextResponse.json({ error: "Culqi no está configurado" }, { status: 503 });
    }

    const body = await request.json().catch(() => null);
    const chargeId = idDelCargo(body);

    // Culqi manda eventos de varios tipos; los que no traen un id de cargo se
    // aceptan y se ignoran, para que no los reintente indefinidamente. Se deja
    // traza porque un webhook mal configurado en el panel (un tipo de evento que
    // no es de cargo, o la URL sin la ruta) se ve exactamente así, y sin log no
    // se nota: Culqi lo da por entregado y la orden se queda PENDING.
    if (!chargeId) {
      console.log(
        "Culqi webhook ignorado: no trae id de cargo.",
        `type=${body?.type ?? "?"} evento=${body?.id ?? "?"}`
      );
      return NextResponse.json({ received: true });
    }

    const charge = await consultarCargo(chargeId);
    if (!charge) {
      console.warn("Culqi webhook: cargo no encontrado", chargeId);
      return NextResponse.json({ received: true });
    }

    const resultado = await aplicarCargoCulqi(charge);
    if (!resultado.ok) {
      console.warn("Culqi webhook rechazado:", resultado.error);
      return NextResponse.json({ error: resultado.error }, { status: resultado.status });
    }

    // Recién aprobado → push y correo, una sola vez. Si la respuesta directa del
    // cargo llegó primero, `yaProcesada` corta aquí y no se duplica nada.
    if (resultado.aprobado && !resultado.yaProcesada) {
      await sendOrderPaidPush(resultado.orderId);
      await sendOrderConfirmation(resultado.orderId);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Culqi webhook error:", error);
    return NextResponse.json({ error: "Error procesando la notificación" }, { status: 500 });
  }
}
