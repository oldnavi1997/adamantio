import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { paymentClient } from "@/lib/mercadopago";
import { sendOrderConfirmation } from "@/lib/email";

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

      await prisma.order.update({
        where: { id: orderId },
        data: { status: "PAID" },
      });

      await prisma.payment.create({
        data: {
          orderId,
          externalReference: `dev-${orderId}`,
          mpPaymentId: "dev-bypass",
          paymentMethodId: "dev",
          statusDetail: "accredited",
          amount: order.total,
          status: "APPROVED",
          rawPayload: {},
        },
      });

      sendOrderConfirmation(orderId).catch(console.error);
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

    if (paymentStatus === "APPROVED") {
      sendOrderConfirmation(order.id).catch(console.error);

      // Decrementar stock en POS
      const orderItems = await prisma.orderItem.findMany({
        where: { orderId: order.id },
        include: { product: { select: { sku: true } } },
      });
      for (const item of orderItems) {
        if (item.product?.sku) {
          await prisma.$executeRaw`
            UPDATE pos."Product"
            SET stock = GREATEST(0, stock - ${item.quantity})
            WHERE sku = ${item.product.sku}
          `;
        }
      }
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
