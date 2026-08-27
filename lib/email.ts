import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { complaintCode, formatLimaDate, formatLimaDateTime } from "@/lib/complaints";
import { COURIER_LABELS, destinoResumen, esRecojo, type Courier } from "@/lib/shipping";

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

    const recipientEmail = order.contactEmail ?? order.user?.email;
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
    const greeting = recipientName ? `Hola, ${escapeHtml(recipientName.split(" ")[0])}` : "Hola";

    const itemsHtml = order.items
      .map((item) => {
        const imageUrl = item.product?.imageUrl ?? null;
        const lineTotal = Number(item.productPrice) * item.quantity;
        const extras = [
          item.selectedSize ? `<span style="font-size:12px;color:#666666;">Talla: ${escapeHtml(item.selectedSize)}</span>` : "",
          item.engravingText ? `<span style="font-size:12px;color:#666666;">Grabado: &ldquo;${escapeHtml(item.engravingText)}&rdquo;</span>` : "",
        ]
          .filter(Boolean)
          .join("<br>");

        return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #eeeeee;vertical-align:top;width:72px;">
            ${
              imageUrl
                ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.productName)}" width="60" height="60" style="border-radius:6px;object-fit:cover;display:block;">`
                : `<div style="width:60px;height:60px;background:#f4f4f4;border-radius:6px;display:inline-block;"></div>`
            }
          </td>
          <td style="padding:12px 12px;border-bottom:1px solid #eeeeee;vertical-align:top;">
            <div style="font-size:14px;font-weight:600;color:#111111;line-height:1.3;">${escapeHtml(item.productName)}</div>
            <div style="font-size:13px;color:#888888;margin-top:3px;">Cant.: ${item.quantity} × ${formatPEN(Number(item.productPrice))}</div>
            ${extras ? `<div style="margin-top:4px;">${extras}</div>` : ""}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #eeeeee;vertical-align:top;text-align:right;white-space:nowrap;">
            <span style="font-size:14px;font-weight:600;color:#111111;">${formatPEN(lineTotal)}</span>
          </td>
        </tr>`;
      })
      .join("");

    // Con Shalom el destino es una agencia y en recojo es el local, no un
    // domicilio: conviene que el comprador lo relea tal como lo eligió. Nulo en
    // los pedidos anteriores a que se guardara el courier, y no se pinta.
    const courier = order.courier as Courier | null;
    const envioHtml = courier
      ? `<div style="font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:0.08em;padding-bottom:6px;">
          ${
            esRecojo(courier)
              ? escapeHtml(COURIER_LABELS[courier])
              : `Envío por ${escapeHtml(COURIER_LABELS[courier])} — ${escapeHtml(destinoResumen(courier).toLowerCase())}`
          }
        </div>`
      : "";

    const addressHtml = address
      ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
        <tr><td style="background:#f7f7f7;border-radius:8px;padding:14px 18px;">
          ${envioHtml}
          <div style="font-size:13px;color:#555555;">${escapeHtml(address.street)}${address.district ? `, ${escapeHtml(address.district)}` : ""}</div>
          <div style="font-size:13px;color:#555555;">${escapeHtml(address.city)}, ${escapeHtml(address.state)} ${escapeHtml(address.postalCode)}</div>
          <div style="font-size:13px;color:#555555;">${escapeHtml(address.country)}</div>
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
              <td style="font-size:13px;color:#111111;font-weight:600;padding:3px 0;">${escapeHtml(address.fullName)}</td>
            </tr>
            ${address.documentType && address.documentNumber ? `
            <tr>
              <td style="font-size:13px;color:#888888;padding:3px 0;">${escapeHtml(address.documentType)}</td>
              <td style="font-size:13px;color:#111111;padding:3px 0;">${escapeHtml(address.documentNumber)}</td>
            </tr>` : ""}
            <tr>
              <td style="font-size:13px;color:#888888;padding:3px 0;">Email</td>
              <td style="font-size:13px;color:#111111;padding:3px 0;">${escapeHtml(recipientEmail)}</td>
            </tr>
            ${address.phone ? `
            <tr>
              <td style="font-size:13px;color:#888888;padding:3px 0;">Teléfono</td>
              <td style="font-size:13px;color:#111111;padding:3px 0;">${escapeHtml(address.phone)}</td>
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

/**
 * Copia de la hoja de reclamación al consumidor y aviso interno.
 *
 * El Reglamento del Libro de Reclamaciones obliga a que, en la modalidad
 * virtual, el proveedor remita al consumidor una copia de la hoja al correo
 * que consignó, en el momento de la presentación. Si el envío falla, el
 * reclamo ya quedó registrado en la base: por eso esto nunca lanza, solo
 * informa si la copia salió.
 */
export async function sendComplaintEmails(complaintId: string): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      console.error(
        `sendComplaintEmails: falta ${!process.env.RESEND_API_KEY ? "RESEND_API_KEY" : "EMAIL_FROM"}, ` +
          `la copia de la hoja ${complaintId} no se envía`
      );
      return false;
    }

    const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) {
      console.error(`sendComplaintEmails: hoja ${complaintId} no encontrada`);
      return false;
    }

    const code = complaintCode(complaint.number, complaint.createdAt);
    const isQueja = complaint.type === "QUEJA";
    const label = isQueja ? "queja" : "reclamo";

    const row = (key: string, value: string | null | undefined) =>
      value
        ? `<tr>
             <td style="padding:6px 12px 6px 0;font-size:12px;color:#888888;white-space:nowrap;vertical-align:top;">${key}</td>
             <td style="padding:6px 0;font-size:13px;color:#111111;vertical-align:top;">${escapeHtml(value)}</td>
           </tr>`
        : "";

    const block = (title: string, rows: string) => `
      <tr>
        <td style="background:#ffffff;padding:18px 32px 6px;border-top:1px solid #eeeeee;">
          <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888888;margin-bottom:8px;">${title}</div>
          <table cellpadding="0" cellspacing="0" border="0" width="100%">${rows}</table>
        </td>
      </tr>`;

    const consumerRows =
      row("Nombres y apellidos", complaint.fullName) +
      row("Documento", `${complaint.documentType} ${complaint.documentId}`) +
      row("Celular", complaint.phone) +
      row("Correo", complaint.email) +
      row("Domicilio", complaint.address) +
      row("Ubicación", `${complaint.district}, ${complaint.province}, ${complaint.department}`) +
      row("Referencia", complaint.reference) +
      (complaint.isMinor
        ? row("Menor de edad", "Sí") +
          row("Apoderado", complaint.guardianFullName) +
          row(
            "Documento del apoderado",
            complaint.guardianDocType && complaint.guardianDocId
              ? `${complaint.guardianDocType} ${complaint.guardianDocId}`
              : null
          ) +
          row("Celular del apoderado", complaint.guardianPhone)
        : "");

    const goodRows =
      row("Tipo de consumo", complaint.goodType === "SERVICIO" ? "Servicio" : "Producto") +
      row("N.º de pedido", complaint.orderNumber) +
      row("Fecha del incidente", complaint.incidentAt ? formatLimaDate(complaint.incidentAt) : null) +
      row("Monto reclamado", complaint.amount ? formatPEN(Number(complaint.amount)) : null) +
      row("Descripción", complaint.goodDetail);

    const detailRows =
      row(
        "Tipo",
        isQueja
          ? "Queja (disconformidad con la atención)"
          : "Reclamo (disconformidad con el producto o servicio)"
      ) +
      row("Detalle", complaint.detail) +
      row("Pedido del consumidor", complaint.request);

    const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f4;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

        <tr>
          <td style="background:#111111;border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
            <img src="${LOGO_URL}" alt="Adamantio" width="130" style="display:block;margin:0 auto 14px;filter:brightness(0) invert(1);">
            <div style="font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#c9a84c;">Libro de Reclamaciones</div>
            <div style="font-size:20px;color:#ffffff;margin-top:8px;">Hoja N.&ordm; ${code}</div>
            <div style="font-size:12px;color:#aaaaaa;margin-top:6px;">${formatLimaDateTime(complaint.createdAt)}</div>
          </td>
        </tr>

        <tr>
          <td style="background:#ffffff;padding:24px 32px 4px;">
            <div style="font-size:14px;color:#333333;line-height:1.6;">
              Hola, ${escapeHtml(complaint.fullName.split(" ")[0])}. Registramos tu ${label} en nuestro
              Libro de Reclamaciones. Esta es la copia de la hoja, gu&aacute;rdala como constancia.
            </div>
          </td>
        </tr>

        ${block("Identificación del consumidor", consumerRows)}
        ${block("Identificación del bien contratado", goodRows)}
        ${block(`Detalle de la ${label}`, detailRows)}

        <tr>
          <td style="background:#ffffff;padding:18px 32px 24px;border-top:1px solid #eeeeee;">
            <div style="background:#faf7ee;border:1px solid #e6d9ac;border-radius:8px;padding:16px;">
              <div style="font-size:13px;color:#333333;line-height:1.7;">
                Te responderemos a m&aacute;s tardar el
                <strong>${formatLimaDate(complaint.dueAt)}</strong>, dentro del plazo de quince (15)
                d&iacute;as h&aacute;biles que fija el art&iacute;culo 24 del C&oacute;digo de Protecci&oacute;n y Defensa del
                Consumidor. Si la naturaleza del ${label} lo justifica, el plazo puede ampliarse por
                quince (15) d&iacute;as h&aacute;biles m&aacute;s, y te lo comunicaremos antes de que venza el primero.
              </div>
              <div style="font-size:12px;color:#666666;line-height:1.7;margin-top:12px;">
                La formulaci&oacute;n del ${label} no impide acudir a otras v&iacute;as de soluci&oacute;n de
                controversias ni es requisito previo para interponer una denuncia ante el Indecopi.
              </div>
            </div>
          </td>
        </tr>

        <tr>
          <td style="background:#111111;border-radius:0 0 12px 12px;padding:24px 32px;text-align:center;">
            <div style="font-size:12px;color:#aaaaaa;">
              &iquest;Necesitas agregar algo? Escr&iacute;benos por WhatsApp al
              <a href="https://wa.me/${WHATSAPP_NUMBER}" style="color:#c9a84c;text-decoration:none;font-weight:600;">${WHATSAPP_DISPLAY}</a>
              citando la hoja ${code}.
            </div>
            <div style="font-size:11px;color:#555555;margin-top:10px;">
              Este correo es autom&aacute;tico, por favor no lo respondas.
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
      to: complaint.email,
      subject: `Hoja de reclamación ${code} — Adamantio`,
      html,
    });

    if (error) {
      console.error(
        `sendComplaintEmails: Resend rechazó la copia de ${code} para ${complaint.email}:`,
        error
      );
      return false;
    }

    console.log(`sendComplaintEmails: copia de ${code} enviada a ${complaint.email} (id ${data?.id})`);

    // Aviso interno. Va aparte para que un fallo aquí no afecte a la copia del
    // consumidor, que es la que exige el reglamento.
    const notifyTo = process.env.COMPLAINTS_EMAIL;
    if (notifyTo) {
      const { error: notifyError } = await getResend().emails.send({
        from: process.env.EMAIL_FROM,
        to: notifyTo,
        replyTo: complaint.email,
        subject: `Nuevo ${label} ${code} — responder antes del ${formatLimaDate(complaint.dueAt)}`,
        html,
      });
      if (notifyError) {
        console.error(`sendComplaintEmails: no se pudo avisar a ${notifyTo} de ${code}:`, notifyError);
      }
    } else {
      console.warn(
        `sendComplaintEmails: COMPLAINTS_EMAIL sin configurar, nadie recibe el aviso de ${code}`
      );
    }

    return true;
  } catch (error) {
    console.error("sendComplaintEmails error:", error);
    return false;
  }
}

/**
 * Todo lo que escribe el comprador —el detalle del reclamo, el grabado, la
 * agencia de destino, su nombre— se interpola en el HTML de estos correos.
 * Escapa `& < > "`, así que sirve igual dentro de un atributo entrecomillado.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Respuesta del proveedor al consumidor. Es la comunicación que cierra el
 * plazo de quince (15) días hábiles del artículo 24 del Código, así que se
 * manda en cuanto el admin la registra y se cita el número de hoja para que el
 * consumidor pueda acreditarla ante el Indecopi.
 */
export async function sendComplaintResponse(complaintId: string): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      console.error(
        `sendComplaintResponse: falta ${!process.env.RESEND_API_KEY ? "RESEND_API_KEY" : "EMAIL_FROM"}, ` +
          `la respuesta de la hoja ${complaintId} no se envía`
      );
      return false;
    }

    const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint || !complaint.response) {
      console.error(`sendComplaintResponse: hoja ${complaintId} sin respuesta registrada`);
      return false;
    }

    const code = complaintCode(complaint.number, complaint.createdAt);
    const label = complaint.type === "QUEJA" ? "queja" : "reclamo";
    const responseHtml = escapeHtml(complaint.response).replace(/\n/g, "<br>");

    const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f4;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

        <tr>
          <td style="background:#111111;border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
            <img src="${LOGO_URL}" alt="Adamantio" width="130" style="display:block;margin:0 auto 14px;filter:brightness(0) invert(1);">
            <div style="font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#c9a84c;">Respuesta a tu ${label}</div>
            <div style="font-size:20px;color:#ffffff;margin-top:8px;">Hoja N.&ordm; ${code}</div>
          </td>
        </tr>

        <tr>
          <td style="background:#ffffff;padding:24px 32px 8px;">
            <div style="font-size:14px;color:#333333;line-height:1.6;">
              Hola, ${escapeHtml(complaint.fullName.split(" ")[0])}. Esta es nuestra respuesta al
              ${label} que presentaste el ${formatLimaDate(complaint.createdAt)}.
            </div>
          </td>
        </tr>

        <tr>
          <td style="background:#ffffff;padding:8px 32px 24px;">
            <div style="background:#fafafa;border-left:3px solid #c9a84c;padding:18px 20px;font-size:14px;color:#333333;line-height:1.7;">
              ${responseHtml}
            </div>
          </td>
        </tr>

        <tr>
          <td style="background:#ffffff;padding:0 32px 24px;">
            <div style="font-size:12px;color:#666666;line-height:1.7;">
              Si no estás conforme con esta respuesta, puedes acudir a otras v&iacute;as de soluci&oacute;n de
              controversias o presentar una denuncia ante el Indecopi. Nuestra respuesta no limita
              ninguno de esos derechos.
            </div>
          </td>
        </tr>

        <tr>
          <td style="background:#111111;border-radius:0 0 12px 12px;padding:24px 32px;text-align:center;">
            <div style="font-size:12px;color:#aaaaaa;">
              &iquest;Necesitas conversarlo? Escr&iacute;benos por WhatsApp al
              <a href="https://wa.me/${WHATSAPP_NUMBER}" style="color:#c9a84c;text-decoration:none;font-weight:600;">${WHATSAPP_DISPLAY}</a>
              citando la hoja ${code}.
            </div>
            <div style="font-size:11px;color:#555555;margin-top:10px;">
              Este correo es autom&aacute;tico, por favor no lo respondas.
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
      to: complaint.email,
      subject: `Respuesta a tu ${label} ${code} — Adamantio`,
      html,
    });

    if (error) {
      console.error(
        `sendComplaintResponse: Resend rechazó la respuesta de ${code} para ${complaint.email}:`,
        error
      );
      return false;
    }

    console.log(`sendComplaintResponse: respuesta de ${code} enviada a ${complaint.email} (id ${data?.id})`);
    return true;
  } catch (error) {
    console.error("sendComplaintResponse error:", error);
    return false;
  }
}
