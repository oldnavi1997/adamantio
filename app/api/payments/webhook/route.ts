import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paymentClient } from "@/lib/mercadopago";
import { PaymentStatus } from "@/app/generated/prisma/client";

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

    const paymentStatus = mapMpStatus(payment.status ?? "pending");

    await prisma.payment.updateMany({
      where: { orderId: payment.external_reference },
      data: {
        mpPaymentId: paymentId,
        status: paymentStatus,
        statusDetail: payment.status_detail ?? null,
      },
    });

    if (paymentStatus === PaymentStatus.APPROVED) {
      await prisma.order.update({
        where: { id: payment.external_reference },
        data: { status: "PAID" },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
