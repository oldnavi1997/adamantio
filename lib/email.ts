import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

function formatPEN(amount: number): string {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(amount);
}

/**
 * Canal de contacto del pie. El remitente es `noreply@adamantio.pe` y nadie lee
 * ese buzón, así que el correo tiene que decirlo y mandar a un canal atendido.
 * Es el mismo número publicado en el libro de reclamaciones y en las políticas.
 */
const WHATSAPP_NUMBER = "51997676742";
const WHATSAPP_DISPLAY = "+51 997 676 742";

const LOGO_URL =
  "https://res.cloudinary.com/dzqns7kss/image/upload/v1772665459/adamantio-logo-1024x299_ol5fgy.png";

export async function sendOrderConfirmation(orderId: string): Promise<void> {
  try {
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      console.error(
        `sendOrderConfirmation: falta ${!process.env.RESEND_API_KEY ? "RESEND_API_KEY" : "EMAIL_FROM"}, ` +
          `el correo del pedido ${orderId} no se envía`
      );
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        address: true,
        user: { select: { email: true } },
      },
    });

    if (!order) {
      console.error(`sendOrderConfirmation: order ${orderId} not found`);
      return;
    }

    const recipientEmail = order.user?.email ?? order.guestEmail;
    if (!recipientEmail) {
      console.warn(`sendOrderConfirmation: no recipient email for order ${orderId}`);
      return;
    }

    const shortId = order.id.slice(-8).toUpperCase();
    const total = Number(order.total);
    const shippingCost = Number(order.shippingCost);
    const subtotal = total - shippingCost - Number(order.mpCommission);
    const freeShipping = shippingCost === 0;
    const address = order.address;
    const recipientName = address?.fullName ?? null;
    const greeting = recipientName ? `Hola, ${recipientName.split(" ")[0]}` : "Hola";

    const itemsHtml = order.items
      .map((item) => {
        const imageUrl = item.product?.imageUrl ?? null;
        const lineTotal = Number(item.productPrice) * item.quantity;
        const extras = [
          item.selectedSize ? `<span style="font-size:12px;color:#666666;">Talla: ${item.selectedSize}</span>` : "",
          item.engravingText ? `<span style="font-size:12px;color:#666666;">Grabado: &ldquo;${item.engravingText}&rdquo;</span>` : "",
        ]
          .filter(Boolean)
          .join("<br>");

        return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #eeeeee;vertical-align:top;width:72px;">
            ${
              imageUrl
                ? `<img src="${imageUrl}" alt="${item.productName}" width="60" height="60" style="border-radius:6px;object-fit:cover;display:block;">`
                : `<div style="width:60px;height:60px;background:#f4f4f4;border-radius:6px;display:inline-block;"></div>`
            }
          </td>
          <td style="padding:12px 12px;border-bottom:1px solid #eeeeee;vertical-align:top;">
            <div style="font-size:14px;font-weight:600;color:#111111;line-height:1.3;">${item.productName}</div>
            <div style="font-size:13px;color:#888888;margin-top:3px;">Cant.: ${item.quantity} × ${formatPEN(Number(item.productPrice))}</div>
            ${extras ? `<div style="margin-top:4px;">${extras}</div>` : ""}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #eeeeee;vertical-align:top;text-align:right;white-space:nowrap;">
            <span style="font-size:14px;font-weight:600;color:#111111;">${formatPEN(lineTotal)}</span>
          </td>
        </tr>`;
      })
      .join("");

    const addressHtml = address
      ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
        <tr><td style="background:#f7f7f7;border-radius:8px;padding:14px 18px;">
          <div style="font-size:13px;color:#555555;">${address.street}${address.district ? `, ${address.district}` : ""}</div>
          <div style="font-size:13px;color:#555555;">${address.city}, ${address.state} ${address.postalCode}</div>
          <div style="font-size:13px;color:#555555;">${address.country}</div>
        </td></tr>
      </table>`
      : "";

    const customerHtml = address
      ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
        <tr><td style="background:#f7f7f7;border-radius:8px;padding:14px 18px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:13px;color:#888888;padding:3px 0;width:120px;">Nombre</td>
              <td style="font-size:13px;color:#111111;font-weight:600;padding:3px 0;">${address.fullName}</td>
            </tr>
            ${address.documentType && address.documentNumber ? `
            <tr>
              <td style="font-size:13px;color:#888888;padding:3px 0;">${address.documentType}</td>
              <td style="font-size:13px;color:#111111;padding:3px 0;">${address.documentNumber}</td>
            </tr>` : ""}
            <tr>
              <td style="font-size:13px;color:#888888;padding:3px 0;">Email</td>
              <td style="font-size:13px;color:#111111;padding:3px 0;">${recipientEmail}</td>
            </tr>
            ${address.phone ? `
            <tr>
              <td style="font-size:13px;color:#888888;padding:3px 0;">Teléfono</td>
              <td style="font-size:13px;color:#111111;padding:3px 0;">${address.phone}</td>
            </tr>` : ""}
          </table>
        </td></tr>
      </table>`
      : "";

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Pedido confirmado #${shortId}</title>
</head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- HEADER -->
        <tr>
          <td style="background:#f0f0f0;border-radius:12px 12px 0 0;padding:24px 32px;text-align:center;">
            <img src="${LOGO_URL}" alt="Adamantio" width="180" height="53" style="display:inline-block;">
          </td>
        </tr>

        <!-- HERO -->
        <tr>
          <td style="background:#ffffff;padding:32px;text-align:center;border-bottom:1px solid #eeeeee;">
            <div style="font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#888888;margin-bottom:8px;">Pedido confirmado</div>
            <div style="font-size:32px;font-weight:700;color:#111111;margin:0 0 4px;">¡Pago aprobado!</div>
            <div style="font-size:15px;color:#555555;margin-top:8px;">${greeting} &mdash; tu pedido está en camino.</div>
            <!-- Order badge -->
            <div style="margin-top:24px;">
              <div style="display:inline-block;background:#111111;color:#ffffff;border-radius:8px;padding:10px 28px;">
                <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#aaaaaa;">Número de pedido</div>
                <div style="font-size:22px;font-weight:700;letter-spacing:4px;color:#ffffff;">#${shortId}</div>
              </div>
            </div>
          </td>
        </tr>

        <!-- ITEMS -->
        <tr>
          <td style="background:#ffffff;padding:24px 32px;margin-top:8px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888888;margin-bottom:16px;">Resumen del pedido</div>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${itemsHtml}
            </table>
            <!-- Divider -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
              <tr>
                <td style="border-top:1px solid #eeeeee;padding-top:12px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size:13px;color:#888888;padding:3px 0;">Subtotal</td>
                      <td style="font-size:13px;color:#333333;text-align:right;padding:3px 0;">${formatPEN(subtotal)}</td>
                    </tr>
                    <tr>
                      <td style="font-size:13px;color:#888888;padding:3px 0;">Envío</td>
                      <td style="font-size:13px;color:#333333;text-align:right;padding:3px 0;">${freeShipping ? "Gratis" : formatPEN(shippingCost)}</td>
                    </tr>
                    <tr>
                      <td colspan="2" style="border-top:1px solid #222222;padding-top:8px;"></td>
                    </tr>
                    <tr>
                      <td style="font-size:16px;font-weight:700;color:#111111;padding-top:4px;">Total</td>
                      <td style="font-size:18px;font-weight:700;color:#111111;text-align:right;padding-top:4px;">${formatPEN(total)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${
          address
            ? `<!-- CUSTOMER -->
        <tr>
          <td style="background:#ffffff;padding:16px 32px 8px;border-top:1px solid #eeeeee;">
            <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888888;margin-bottom:10px;">Datos del cliente</div>
            ${customerHtml}
          </td>
        </tr>
        <!-- ADDRESS -->
        <tr>
          <td style="background:#ffffff;padding:16px 32px 24px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888888;margin-bottom:10px;">Dirección de entrega</div>
            ${addressHtml}
          </td>
        </tr>`
            : ""
        }

        <!-- FOOTER -->
        <tr>
          <td style="background:#111111;border-radius:0 0 12px 12px;padding:24px 32px;text-align:center;">
            <div style="font-size:13px;color:#aaaaaa;">
              Gracias por tu compra en <span style="color:#ffffff;font-weight:600;">Adamantio</span>.
            </div>
            <div style="font-size:12px;color:#666666;margin-top:8px;">
              ¿Preguntas? Escríbenos por WhatsApp al
              <a href="https://wa.me/${WHATSAPP_NUMBER}" style="color:#c9a84c;text-decoration:none;font-weight:600;">${WHATSAPP_DISPLAY}</a>.
            </div>
            <div style="font-size:11px;color:#555555;margin-top:10px;">
              Este correo es automático, por favor no lo respondas.
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const { data, error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM,
      to: recipientEmail,
      subject: `¡Pedido confirmado! #${shortId} — Adamantio`,
      html,
    });

    // Resend NO lanza cuando la API rechaza el envío: devuelve `{ data, error }`.
    // Ignorar el retorno hacía que un dominio sin verificar, una API key mala o
    // el límite de `onboarding@resend.dev` (que solo entrega al dueño de la
    // cuenta) se perdieran en silencio: el cliente no recibía nada y no quedaba
    // ni un log.
    if (error) {
      console.error(
        `sendOrderConfirmation: Resend rechazó el pedido ${orderId} para ${recipientEmail}:`,
        error
      );
      return;
    }

    console.log(`sendOrderConfirmation: pedido ${orderId} enviado a ${recipientEmail} (id ${data?.id})`);
  } catch (error) {
    console.error("sendOrderConfirmation error:", error);
  }
}
