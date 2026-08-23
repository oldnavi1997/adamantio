import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { paymentClient } from "@/lib/mercadopago";
import { sendOrderConfirmation } from "@/lib/email";
import { sendOrderPaidPush } from "@/lib/push";
import { aprobarOrden } from "@/lib/fulfillment";

const processSchema = z.object({
  orderId: z.string(),
  token: z.string(),
  paymentMethodId: z.string(),
  issuerId: z.union([z.string(), z.number()]).optional(),
  installments: z.number().int().positive(),
  email: z.string().email(),
});

function mpStatusToOrderStatus(mpStatus: string): "PENDING" | "PAID" | "CANCELLED" {
  if (mpStatus === "approved") return "PAID";
  if (mpStatus === "cancelled") return "CANCELLED";
  return "PENDING";
}

function mpStatusToPaymentStatus(mpStatus: string): "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" {
  switch (mpStatus) {
    case "approved": return "APPROVED";
    case "rejected": return "REJECTED";
    case "cancelled": return "CANCELLED";
    default: return "PENDING";
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Dev bypass
    if (body.devBypass === true && process.env.NODE_ENV === "development") {
      const { orderId } = body;
      if (!orderId) return NextResponse.json({ error: "orderId requerido" }, { status: 400 });

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
      if (order.status !== "PENDING") return NextResponse.json({ error: "La orden ya fue procesada" }, { status: 400 });

      const resultado = await aprobarOrden(orderId, {
        provider: "mercadopago",
        externalReference: `dev-${orderId}`,
        providerPaymentId: "dev-bypass",
        paymentMethodId: "dev",
        statusDetail: "accredited",
      });
      if (resultado.yaProcesada) {
        return NextResponse.json({ error: "La orden ya fue procesada" }, { status: 400 });
      }

      after(() => sendOrderConfirmation(orderId));
      return NextResponse.json({ status: "approved", paymentId: "dev-bypass", statusDetail: "accredited" });
    }

    const data = processSchema.parse(body);

    const order = await prisma.order.findUnique({ where: { id: data.orderId } });
    if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    if (order.status !== "PENDING") return NextResponse.json({ error: "La orden ya fue procesada" }, { status: 400 });

    const payment = await paymentClient.create({
      body: {
        transaction_amount: Number(order.total),
        token: data.token,
        installments: data.installments,
        payment_method_id: data.paymentMethodId,
        issuer_id: data.issuerId ? Number(data.issuerId) : undefined,
        payer: { email: data.email },
        external_reference: order.id,
      },
    });

    const mpStatus = payment.status ?? "pending";
    const paymentStatus = mpStatusToPaymentStatus(mpStatus);
    const orderStatus = mpStatusToOrderStatus(mpStatus);

    if (paymentStatus === "APPROVED") {
      // Toda aprobación pasa por aquí: descuenta stock y escribe el Payment en
      // una sola transacción idempotente, así que el webhook de Mercado Pago
      // puede llegar después sin duplicar nada.
      const resultado = await aprobarOrden(order.id, {
        provider: "mercadopago",
        externalReference: String(payment.id),
        providerPaymentId: String(payment.id),
        paymentMethodId: data.paymentMethodId,
        statusDetail: payment.status_detail ?? null,
        rawPayload: payment as object,
      });

      if (!resultado.yaProcesada) {
        // `after` y no una promesa suelta: en Vercel la función serverless se
        // congela al devolver la respuesta y el envío a Resend se quedaba a medias.
        after(() => sendOrderConfirmation(order.id));
        after(() => sendOrderPaidPush(order.id));
      }
    } else {
      // No aprobado: se refleja el estado del pago sin pasar por `aprobarOrden`.
      await prisma.order.update({
        where: { id: order.id },
        data: { status: orderStatus },
      });

      await prisma.payment.create({
        data: {
          orderId: order.id,
          externalReference: String(payment.id),
          mpPaymentId: String(payment.id),
          paymentMethodId: data.paymentMethodId,
          statusDetail: payment.status_detail ?? null,
          amount: order.total,
          status: paymentStatus,
          rawPayload: payment as object,
        },
      });
    }

    return NextResponse.json({
      status: mpStatus,
      paymentId: payment.id,
      statusDetail: payment.status_detail,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Payment process error:", error);
    return NextResponse.json({ error: "Error procesando el pago" }, { status: 500 });
  }
}
