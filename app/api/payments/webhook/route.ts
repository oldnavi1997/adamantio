import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { paymentClient } from "@/lib/mercadopago";
import { PaymentStatus } from "@/app/generated/prisma/client";
import { sendOrderPaidPush } from "@/lib/push";
import { sendOrderConfirmation } from "@/lib/email";
import { aprobarOrden } from "@/lib/fulfillment";

function mapMpStatus(mpStatus: string): PaymentStatus {
  switch (mpStatus) {
    case "approved": return PaymentStatus.APPROVED;
    case "rejected": return PaymentStatus.REJECTED;
    case "cancelled": return PaymentStatus.CANCELLED;
    default: return PaymentStatus.PENDING;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.type !== "payment" || !body.data?.id) {
      return NextResponse.json({ received: true });
    }

    const paymentId = String(body.data.id);
    const payment = await paymentClient.get({ id: paymentId });

    if (!payment.external_reference) {
      return NextResponse.json({ received: true });
    }

    // Atada a una constante: el narrowing de una propiedad no sobrevive dentro
    // del closure que recibe `after`.
    const orderId = payment.external_reference;

    const paymentStatus = mapMpStatus(payment.status ?? "pending");

    if (paymentStatus === PaymentStatus.APPROVED) {
      // Mercado Pago reintenta sus webhooks por diseño y este puede llegar
      // antes o después de `payments/process`. `aprobarOrden` es idempotente
      // por compare-and-swap, así que el stock baja una sola vez y el Payment
      // se escribe una sola vez, gane quien gane.
      //
      // Antes esta rama sólo cambiaba el estado a PAID: una orden resuelta
      // únicamente por webhook se quedaba sin descontar stock y sin correo.
      const resultado = await aprobarOrden(payment.external_reference, {
        provider: "mercadopago",
        externalReference: paymentId,
        providerPaymentId: paymentId,
        paymentMethodId: payment.payment_method_id ?? null,
        statusDetail: payment.status_detail ?? null,
        rawPayload: payment as object,
      });

      if (!resultado.yaProcesada) {
        after(() => sendOrderPaidPush(orderId));
        await sendOrderConfirmation(payment.external_reference);
      }
    } else {
      await prisma.payment.updateMany({
        where: { orderId: payment.external_reference },
        data: {
          mpPaymentId: paymentId,
          status: paymentStatus,
          statusDetail: payment.status_detail ?? null,
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
