import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paymentClient } from "@/lib/mercadopago";

function mapMpStatusToPaymentStatus(mpStatus: string) {
  switch (mpStatus) {
    case "approved": return "APPROVED";
    case "rejected": return "REJECTED";
    case "in_process": return "IN_PROCESS";
    case "pending": return "PENDING";
    case "cancelled": return "CANCELLED";
    default: return "PENDING";
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

    const mpStatus = payment.status || "pending";
    const paymentStatus = mapMpStatusToPaymentStatus(mpStatus);

    await prisma.order.update({
      where: { id: payment.external_reference },
      data: {
        mpPaymentId: paymentId,
        mpStatus,
        paymentStatus: paymentStatus as "PENDING" | "APPROVED" | "REJECTED" | "IN_PROCESS" | "CANCELLED",
        orderStatus: paymentStatus === "APPROVED" ? "PAID" : undefined,
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
