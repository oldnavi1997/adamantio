import { prisma } from "@/lib/prisma";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/**
 * Sends a "new paid order" push to every registered POS device. Best-effort:
 * never throws, so a push failure can't break the payment webhook.
 *
 * The custom sound (chaching.wav) is driven by the Android notification channel
 * "pedidos" created in the mobile app, hence `channelId`. iOS falls back to the
 * default sound for now.
 */
export async function sendOrderPaidPush(orderId: string): Promise<void> {
  try {
    const [order, tokens] = await Promise.all([
      prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true },
      }),
      prisma.pushToken.findMany({ select: { token: true } }),
    ]);

    if (!order || tokens.length === 0) return;

    const buyer = order.user?.fullName ?? order.contactEmail ?? "Cliente web";
    const total = new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      maximumFractionDigits: 0,
    }).format(Number(order.total));

    const messages = tokens.map((t) => ({
      to: t.token,
      title: "🛍️ Nuevo pedido web",
      body: `${buyer} · ${total}`,
      data: { orderId: order.id },
      sound: "default",
      channelId: "pedidos",
      priority: "high",
    }));

    // Expo accepts up to 100 messages per request; POS devices are few.
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    if (!res.ok) {
      console.error("[push] Expo push failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("[push] sendOrderPaidPush error:", err);
  }
}
