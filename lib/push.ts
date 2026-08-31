import { prisma } from "@/lib/prisma";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_RECEIPTS_URL = "https://exp.host/--/api/v2/push/getReceipts";

/**
 * Expo tarda un momento en tener el recibo listo: el ticket sólo dice que
 * aceptó el mensaje, el recibo dice si FCM lo entregó. Cinco segundos alcanzan
 * de sobra y esto corre siempre dentro de `after()`, así que no demora ninguna
 * respuesta.
 */
const ESPERA_RECIBOS_MS = 5_000;

type Ticket =
  | { status: "ok"; id: string }
  | { status: "error"; message?: string; details?: { error?: string } };

type Recibo =
  | { status: "ok" }
  | { status: "error"; message?: string; details?: { error?: string } };

/**
 * Borra los tokens que Expo declaró muertos.
 *
 * Es lo que evita que la tabla se llene de fantasmas: Android regenera el token
 * en cada reinstalación o borrado de datos, la app registra el nuevo y el viejo
 * se quedaba para siempre. Un token muerto no rompe el envío a los vivos, pero
 * hace que "se envió correctamente" deje de significar "sonó el celular", que es
 * justo lo que enmascaró esta falla durante semanas.
 */
async function borrarTokens(tokens: string[], motivo: string): Promise<void> {
  if (tokens.length === 0) return;
  try {
    await prisma.pushToken.deleteMany({ where: { token: { in: tokens } } });
    console.warn(`[push] ${tokens.length} token(s) borrados (${motivo})`);
  } catch (err) {
    console.error("[push] no se pudieron borrar los tokens muertos:", err);
  }
}

/** Consulta los recibos y purga los `DeviceNotRegistered`. */
async function revisarRecibos(porTicket: Map<string, string>): Promise<void> {
  await new Promise((r) => setTimeout(r, ESPERA_RECIBOS_MS));

  const res = await fetch(EXPO_RECEIPTS_URL, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ ids: [...porTicket.keys()] }),
  });
  if (!res.ok) {
    console.error("[push] getReceipts falló:", res.status, await res.text());
    return;
  }

  const { data } = (await res.json()) as { data?: Record<string, Recibo> };
  const muertos: string[] = [];

  for (const [ticketId, recibo] of Object.entries(data ?? {})) {
    if (recibo.status !== "error") continue;
    const token = porTicket.get(ticketId);
    // `DeviceNotRegistered` es definitivo: la app ya no está en ese dispositivo.
    // El resto (MessageRateExceeded, MessageTooBig…) es transitorio o nuestro,
    // así que se registra pero no se borra nada.
    if (token && recibo.details?.error === "DeviceNotRegistered") muertos.push(token);
    else console.error("[push] recibo con error:", recibo.details?.error, recibo.message);
  }

  await borrarTokens(muertos, "recibo DeviceNotRegistered");
}

/**
 * Avisa a los dispositivos del POS que entró un pedido pagado. Best-effort:
 * nunca lanza, para que un fallo de push no tumbe el cobro.
 *
 * **Llámala siempre dentro de `after()`**, nunca como promesa suelta: en Vercel
 * la función se congela al devolver la respuesta y el envío se queda a medias.
 *
 * El sonido propio (chaching.wav) lo pone el canal Android "pedidos" que crea la
 * app móvil, de ahí el `channelId`. En iOS suena el de por defecto.
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

    if (!order) {
      console.error(`[push] orden ${orderId} no encontrada`);
      return;
    }
    if (tokens.length === 0) {
      console.warn("[push] no hay ningún dispositivo registrado en PushToken");
      return;
    }

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

    // Expo acepta hasta 100 mensajes por request; los equipos del POS son pocos.
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });

    if (!res.ok) {
      console.error("[push] Expo push falló:", res.status, await res.text());
      return;
    }

    // Los tickets vienen en el mismo orden que los mensajes.
    const { data } = (await res.json()) as { data?: Ticket[] };
    const tickets = data ?? [];
    const porTicket = new Map<string, string>();
    const muertos: string[] = [];

    tickets.forEach((ticket, i) => {
      const token = tokens[i]?.token;
      if (!token) return;
      if (ticket.status === "ok") {
        porTicket.set(ticket.id, token);
      } else if (ticket.details?.error === "DeviceNotRegistered") {
        muertos.push(token);
      } else {
        console.error("[push] ticket con error:", ticket.details?.error, ticket.message);
      }
    });

    await borrarTokens(muertos, "ticket DeviceNotRegistered");
    if (porTicket.size > 0) await revisarRecibos(porTicket);
  } catch (err) {
    console.error("[push] sendOrderPaidPush error:", err);
  }
}
