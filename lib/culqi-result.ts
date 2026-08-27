import type { Order } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { aprobarOrden } from "@/lib/fulfillment";
import { aCentimos } from "@/lib/utils";
import { esCargoExitoso, mapCulqiPayMethod, type CulqiCharge } from "@/lib/culqi";

export type ResultadoCulqi =
  | { ok: false; status: number; error: string }
  | {
      ok: true;
      aprobado: boolean;
      /** true si la otra vía (navegador o webhook) ya había aprobado esta orden. */
      yaProcesada: boolean;
      orderId: string;
      paymentId?: string;
      statusDetail?: string;
    };

/**
 * Valida y aplica un cargo de Culqi. La usan la respuesta directa del cargo
 * (`/charge`) y el webhook, que pueden llegar en cualquier orden: `aprobarOrden`
 * es idempotente por compare-and-swap, así que el segundo no descuenta stock
 * otra vez.
 *
 * El cargo que entra aquí viene SIEMPRE de la API de Culqi —de la respuesta a
 * nuestro propio POST o de un GET del webhook—, nunca del navegador.
 */
export async function aplicarCargoCulqi(charge: CulqiCharge): Promise<ResultadoCulqi> {
  const orderId = charge.metadata?.orderId;
  if (!orderId) return { ok: false, status: 400, error: "El cargo no trae orderId" };
  if (!charge.id) return { ok: false, status: 400, error: "El cargo no trae id" };

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, status: 404, error: "Orden no encontrada" };

  // El importe se compara contra la BD. Culqi no permitiría cobrar de más con
  // nuestro propio token, pero el webhook sí acepta ids de cargo de fuera.
  if (charge.amount !== aCentimos(Number(order.total))) {
    return { ok: false, status: 400, error: "El importe no coincide con la orden" };
  }
  if (charge.currency_code !== "PEN") {
    return { ok: false, status: 400, error: "Moneda inesperada" };
  }

  const metodo = mapCulqiPayMethod(charge);
  const detalle = charge.outcome?.code ?? charge.outcome?.type ?? null;

  if (!esCargoExitoso(charge)) {
    // Igual que con Izipay: el rechazo se refleja en el `Payment` y la orden se
    // queda en PENDING, sin pisar un PAID que la otra vía pudiera haber escrito.
    await registrarRechazoCulqi({
      orderId: order.id,
      chargeId: charge.id,
      amount: order.total,
      paymentMethodId: metodo,
      statusDetail: detalle,
      rawPayload: charge,
    });
    return {
      ok: true,
      aprobado: false,
      yaProcesada: false,
      orderId: order.id,
      paymentId: charge.id,
      statusDetail: charge.outcome?.user_message || detalle || undefined,
    };
  }

  const resultado = await aprobarOrden(order.id, {
    provider: "culqi",
    externalReference: charge.id,
    providerPaymentId: charge.id,
    paymentMethodId: metodo,
    statusDetail: detalle,
    rawPayload: charge,
  });

  return {
    ok: true,
    aprobado: true,
    yaProcesada: resultado.yaProcesada,
    orderId: order.id,
    paymentId: charge.id,
    statusDetail: detalle ?? undefined,
  };
}

/**
 * Deja constancia de un cobro que no prosperó. Se llama también desde la ruta
 * `/charge` cuando Culqi responde 4xx: ahí no hay objeto `charge`, sólo el
 * `charge_id` del error, y sin id no se puede escribir nada porque
 * `Payment.externalReference` es @unique.
 */
export async function registrarRechazoCulqi(args: {
  orderId: string;
  chargeId: string;
  amount: Order["total"];
  paymentMethodId?: string | null;
  statusDetail?: string | null;
  rawPayload?: unknown;
}): Promise<void> {
  await prisma.payment.upsert({
    where: { externalReference: args.chargeId },
    create: {
      orderId: args.orderId,
      externalReference: args.chargeId,
      mpPaymentId: args.chargeId,
      paymentMethodId: args.paymentMethodId ?? null,
      statusDetail: args.statusDetail ?? null,
      amount: args.amount,
      status: "REJECTED",
      rawPayload: (args.rawPayload ?? {}) as object,
    },
    update: {
      statusDetail: args.statusDetail ?? null,
      status: "REJECTED",
    },
  });
}
