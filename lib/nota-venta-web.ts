import { randomUUID } from "node:crypto";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { COURIER_LABELS, type Courier } from "@/lib/shipping";
import { esVariante } from "@/lib/variantes";

/**
 * Nota de venta de un pedido web, para que la venta aparezca en el POS.
 *
 * Es la réplica de lo que luminus hace con su serie NV002, adaptada al modelo
 * del POS de Adamantio: una fila en `Sale` con `canal = "WEB"`, firmada por el
 * usuario de sistema «Tienda Web» y vinculada al `Customer` del comprador.
 *
 * Tres decisiones que no son obvias:
 *
 * - **Va después de aprobar, no dentro de la transacción.** La orden ya está
 *   cobrada: si la nota fallara dentro de `aprobarOrden`, se desharía la
 *   aprobación y el webhook reintentaría en bucle con el dinero ya en la
 *   pasarela. Aquí falla en silencio y `prisma/backfill-notas-web.ts` la
 *   repone.
 * - **No toca el stock.** Lo descontó `aprobarOrden`; la nota solo lo cuenta.
 *   Por eso el POS no deja borrar una venta web: devolvería las unidades a un
 *   sitio del que quizá no salieron.
 * - **No suma a la caja.** El dinero entra por Izipay/Culqi, no por el cajón,
 *   así que `cajaSessionId` queda vacío y el arqueo del cajero no cambia.
 *
 * Es idempotente por `Sale.orderId`, que es UNIQUE: llamarla dos veces deja
 * una sola nota.
 */

/** Usuario de sistema que firma las notas web. `Sale.userId` es NOT NULL. */
const CAJERO_WEB_EMAIL = "web@adamantio.com";
const CAJERO_WEB_NOMBRE = "Tienda Web";

const redondear2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Crea (si falta) el usuario que firma las notas web.
 *
 * `ON CONFLICT` y no un `upsert` de Prisma: dos aprobaciones simultáneas la
 * primera vez chocarían en el índice único del correo. El hash `!` no es un
 * bcrypt válido, así que `bcrypt.compare` siempre da falso: no es una cuenta
 * con la que se pueda entrar ni en la web ni en el POS.
 */
async function cajeroWeb(): Promise<string> {
  await prisma.$executeRaw`
    INSERT INTO "User" (id, email, "passwordHash", "fullName", role, "createdAt", "updatedAt")
    VALUES (${randomUUID()}, ${CAJERO_WEB_EMAIL}, '!', ${CAJERO_WEB_NOMBRE},
            'CUSTOMER'::"UserRole", NOW(), NOW())
    ON CONFLICT (email) DO NOTHING
  `;
  const u = await prisma.user.findUniqueOrThrow({
    where: { email: CAJERO_WEB_EMAIL },
    select: { id: true },
  });
  return u.id;
}

/**
 * Vincula el comprador a un `Customer` del POS por su documento.
 *
 * `DO NOTHING` a propósito, que es la regla del POS: un cliente que ya existe
 * no se pisa, porque su nombre puede venir de RENIEC o estar corregido a mano.
 * Sin documento no se vincula: el repaso de la nota lleva igual sus datos.
 */
async function clienteDelPedido(datos: {
  documentType: string;
  documentNumber: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
}): Promise<string | null> {
  const tipo = datos.documentType.trim().toUpperCase();
  const numero = datos.documentNumber.trim();
  if (!tipo || !numero) return null;

  await prisma.$executeRaw`
    INSERT INTO "Customer"
      (id, name, "documentType", "documentNumber", phone, email, address, "createdAt", "updatedAt")
    VALUES (${randomUUID()}, ${datos.name}, ${tipo}, ${numero}, ${datos.phone}, ${datos.email},
            ${datos.address}, NOW(), NOW())
    ON CONFLICT ("documentType", "documentNumber") DO NOTHING
  `;
  const c = await prisma.customer.findUnique({
    where: { documentType_documentNumber: { documentType: tipo, documentNumber: numero } },
    select: { id: true },
  });
  return c?.id ?? null;
}

/** Del vocabulario de la pasarela al enum del POS. Culqi ya lo manda traducido. */
function metodoDePago(paymentMethodId: string | null | undefined): "TARJETA" | "YAPE" {
  return paymentMethodId?.toUpperCase().includes("YAPE") ? "YAPE" : "TARJETA";
}

type DireccionPedido = {
  fullName: string;
  phone: string;
  documentType: string;
  documentNumber: string;
  street: string;
  district: string;
  city: string;
};

/**
 * La etiqueta del paquete de un pedido web, o `null` si no viaja (recojo en
 * tienda, o un pedido antiguo sin courier).
 *
 * Shalom solo entrega en agencia. Olva admite agencia o domicilio, pero el
 * checkout lo guarda en un único campo libre, así que se decide por el texto:
 * si dice «agencia» es una sede, si no una dirección. En el POS se corrige.
 */
export function envioDelPedido(courier: string | null, dir: DireccionPedido | null) {
  if (!dir || (courier !== "shalom" && courier !== "olva")) return null;
  const limpio = (t: string) => t.replace(/\s+/g, " ").trim();
  const destino = limpio(dir.street);
  const modalidad =
    courier === "shalom" || /agencia/i.test(destino) ? "AGENCIA" : "DIRECCION";
  return {
    nombre: limpio(dir.fullName),
    tipoDocumento: dir.documentNumber.trim() ? dir.documentType.trim() || "DNI" : null,
    numeroDocumento: dir.documentNumber.trim() || null,
    celular: limpio(dir.phone),
    // El distrito es lo que más se parece a la «ciudad» de la etiqueta:
    // Juliaca es un distrito de la provincia de San Román.
    ciudad: limpio(dir.district || dir.city),
    courier: courier.toUpperCase(),
    modalidad,
    destino,
  };
}

/**
 * Crea la etiqueta de una nota web que no la tiene. Solo la usa el script de
 * relleno, para las notas emitidas antes de que existieran las etiquetas.
 */
export async function reponerEnvioWeb(saleId: string): Promise<boolean> {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    select: { datosEnvio: { select: { id: true } }, order: { include: { address: true } } },
  });
  if (!sale?.order || sale.datosEnvio) return false;
  const datos = envioDelPedido(sale.order.courier, sale.order.address);
  if (!datos) return false;
  await prisma.saleEnvio.create({ data: { saleId, ...datos } });
  return true;
}

export type ResultadoNota =
  | { creada: true; saleId: string }
  | { creada: false; motivo: "ya-existe" | "no-pagada" | "no-encontrada" };

/**
 * Emite la nota de venta de un pedido ya aprobado.
 *
 * `fecha` solo la pasa el script de relleno, para que una nota atrasada quede
 * en el día en que se cobró y no en el de hoy.
 */
export async function emitirNotaVentaWeb(
  orderId: string,
  fecha?: Date
): Promise<ResultadoNota> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      sale: { select: { id: true } },
      address: true,
      items: { include: { product: { select: { esPar: true, stockPorTalla: true } } } },
      payments: {
        where: { status: "APPROVED" },
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { paymentMethodId: true },
      },
    },
  });
  if (!order) return { creada: false, motivo: "no-encontrada" };
  if (order.sale) return { creada: false, motivo: "ya-existe" };
  // `stockDeducted` y no `status`: el admin puede mover un pedido a SHIPPED, y
  // lo que dice que se cobró es haber pasado por el compare-and-swap.
  if (!order.stockDeducted) return { creada: false, motivo: "no-pagada" };

  const recojo = order.courier === "tienda";
  const dir = order.address;
  const nombre = dir?.fullName.replace(/\s+/g, " ").trim() || null;
  const direccion = dir
    ? [dir.street, dir.district, dir.city, dir.state].filter((p) => p && p.trim()).join(", ")
    : null;

  const [userId, customerId] = await Promise.all([
    cajeroWeb(),
    dir
      ? clienteDelPedido({
          documentType: dir.documentType,
          documentNumber: dir.documentNumber,
          name: nombre ?? "CLIENTES VARIOS",
          phone: dir.phone || null,
          email: order.contactEmail,
          // Solo Olva entrega a domicilio. En Shalom el destino es una agencia
          // y en recojo es el propio local: ninguno es la dirección del cliente.
          address: order.courier === "olva" ? direccion : null,
        })
      : Promise.resolve(null),
  ]);

  const datosEnvio = envioDelPedido(order.courier, dir);

  const subtotal = redondear2(
    order.items.reduce((s, i) => s + Number(i.productPrice) * i.quantity, 0)
  );
  const envio = Number(order.shippingCost);
  const total = Number(order.total);
  // Lo normal es que cuadre al céntimo. Si no, la diferencia se absorbe para
  // que el invariante total = subtotal − descuento + envío + comisión se cumpla
  // siempre: lo que falta va como descuento y lo que sobra —pedidos anteriores a
  // que se guardaran el envío y la comisión— se suma a la comisión y se anota.
  const diferencia = redondear2(total - (subtotal + envio + Number(order.mpCommission)));
  const descuento = diferencia < 0 ? -diferencia : 0;
  const comision = redondear2(Number(order.mpCommission) + Math.max(0, diferencia));

  const items = order.items
    // `SaleItem.productId` es NOT NULL. Una línea cuyo producto se borró queda
    // fuera del detalle, pero su importe sigue en el subtotal y la nota lo dice.
    .filter((i) => i.productId && i.product)
    .map((i) => {
      const p = i.product!;
      // El POS decide qué contador tocar con `generoVenta`. Una variante nula
      // sobre un `esPar` es la pareja completa, como en `piezasDeVariante`.
      const generoVenta = p.stockPorTalla
        ? null
        : p.esPar
          ? esVariante(i.variante)
            ? i.variante
            : "PAREJA"
          : null;
      return {
        productId: i.productId!,
        cantidad: i.quantity,
        precioUnitario: Number(i.productPrice),
        descuento: 0,
        subtotal: redondear2(Number(i.productPrice) * i.quantity),
        generoVenta,
        talla: p.stockPorTalla ? i.selectedSize : null,
      };
    });

  const sinProducto = order.items.filter((i) => !i.productId || !i.product);
  const proveedor =
    { culqi: "Culqi", izipay: "Izipay", mercadopago: "Mercado Pago" }[order.paymentProvider] ??
    order.paymentProvider;
  const entrega = order.courier
    ? (COURIER_LABELS[order.courier as Courier] ?? order.courier)
    : null;

  const notas = [
    `Pedido web #${order.id.slice(-8).toUpperCase()} · ${proveedor}`,
    recojo
      ? "Entrega: recojo en tienda"
      : `Entrega: ${[entrega, direccion].filter(Boolean).join(" · ") || "—"}`,
    `Contacto: ${[nombre, dir?.phone, order.contactEmail].filter(Boolean).join(" · ") || "—"}`,
    ...order.items
      .filter((i) => i.engravingText?.trim())
      .map((i) => `Grabado (${i.productName}): ${i.engravingText!.trim()}`),
    ...sinProducto.map(
      (i) => `Sin producto en el POS: ${i.productName} × ${i.quantity} (S/ ${Number(i.productPrice).toFixed(2)})`
    ),
    diferencia > 0 ? `Cargos sin desglosar en el pedido: S/ ${diferencia.toFixed(2)}` : null,
    order.stockNote ? `Stock: ${order.stockNote.split(" | ").join(" · ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const sale = await prisma.sale.create({
      data: {
        userId,
        customerId,
        canal: "WEB",
        orderId: order.id,
        subtotal,
        descuento,
        envio,
        comision,
        total,
        metodoPago: metodoDePago(order.payments[0]?.paymentMethodId),
        notas,
        ...(fecha && { createdAt: fecha }),
        ...(datosEnvio && { datosEnvio: { create: datosEnvio } }),
        items: { create: items },
      },
      select: { id: true },
    });
    return { creada: true, saleId: sale.id };
  } catch (err) {
    // La otra vía (webhook o navegador) ganó la carrera por la misma nota.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { creada: false, motivo: "ya-existe" };
    }
    throw err;
  }
}
