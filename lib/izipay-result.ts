import { prisma } from "@/lib/prisma";
import { aprobarOrden } from "@/lib/fulfillment";
import {
  aCentimos,
  esPagado,
  transaccionPrincipal,
  validarKrHash,
  type KrAnswer,
} from "@/lib/izipay";

export type ResultadoIzipay =
  | { ok: false; status: number; error: string }
  | {
      ok: true;
      aprobado: boolean;
      /** true si la otra vía (navegador o IPN) ya había aprobado esta orden. */
      yaProcesada: boolean;
      orderId: string;
      paymentId?: string;
      statusDetail?: string;
    };

/**
 * Valida y aplica el resultado de un pago Izipay. La usan tanto la respuesta del
 * navegador (`/confirm`) como la URL de notificación (`/webhook`), que compiten
 * en cada venta: `aprobarOrden` es idempotente por compare-and-swap, así que el
 * segundo en llegar no descuenta stock otra vez.
 *
 * `krAnswer` se valida como CADENA antes de parsearse. Parsearlo primero y
 * firmar el objeto reserializado rompería la comparación: la firma cubre los
 * bytes exactos que envió Izipay.
 */
export async function procesarResultadoIzipay(args: {
  krAnswer: string;
  krHash: string;
  krHashKey?: string;
}): Promise<ResultadoIzipay> {
  if (!validarKrHash(args)) {
    return { ok: false, status: 401, error: "Firma inválida" };
  }

  let answer: KrAnswer;
  try {
    answer = JSON.parse(args.krAnswer);
  } catch {
    return { ok: false, status: 400, error: "kr-answer ilegible" };
  }

  // `orderId` es el cuid de la orden: es lo que se mandó en CreatePayment.
  const orderId = answer.orderDetails?.orderId;
  if (!orderId) return { ok: false, status: 400, error: "kr-answer sin orderId" };

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, status: 404, error: "Orden no encontrada" };

  // El importe se compara contra la BD, nunca contra lo que diga el navegador.
  if (answer.orderDetails?.orderTotalAmount !== aCentimos(Number(order.total))) {
    return { ok: false, status: 400, error: "El importe no coincide con la orden" };
  }
  if (answer.orderDetails?.orderCurrency !== "PEN") {
    return { ok: false, status: 400, error: "Moneda inesperada" };
  }

  const tx = transaccionPrincipal(answer);
  const paymentId = tx?.uuid;

  if (!esPagado(answer)) {
    // Adamantio tiene un solo `status` en `Order`: el rechazo se refleja en el
    // `Payment` y la orden se queda en PENDING, sin pisar un PAID que la otra
    // vía pudiera haber escrito ya.
    if (paymentId) {
      await prisma.payment.upsert({
        where: { externalReference: paymentId },
        create: {
          orderId: order.id,
          externalReference: paymentId,
          mpPaymentId: paymentId,
          paymentMethodId: tx?.paymentMethodType ?? null,
          statusDetail: tx?.detailedStatus ?? answer.orderStatus ?? null,
          amount: order.total,
          status: "REJECTED",
          rawPayload: answer as object,
        },
        update: {
          statusDetail: tx?.detailedStatus ?? answer.orderStatus ?? null,
          status: "REJECTED",
        },
      });
    }
    return {
      ok: true,
      aprobado: false,
      yaProcesada: false,
      orderId: order.id,
      paymentId,
      statusDetail: tx?.errorMessage || tx?.detailedStatus || answer.orderStatus,
    };
  }

  const resultado = await aprobarOrden(order.id, {
    provider: "izipay",
    externalReference: paymentId ?? `izipay-${order.id}`,
    providerPaymentId: paymentId ?? null,
    paymentMethodId: tx?.paymentMethodType ?? null,
    statusDetail: tx?.detailedStatus ?? null,
    rawPayload: answer,
  });

  return {
    ok: true,
    aprobado: true,
    yaProcesada: resultado.yaProcesada,
    orderId: order.id,
    paymentId,
    statusDetail: tx?.detailedStatus,
  };
}
