import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Punto único de aprobación de una orden.
 *
 * Existe por una razón concreta: con Izipay, la respuesta del navegador
 * (`/api/payments/izipay/confirm`) y la notificación servidor-a-servidor (el
 * IPN) llegan por caminos distintos y compiten en CADA venta. Sin una guarda
 * atómica, las dos descontarían stock. Mercado Pago tiene el mismo problema en
 * menor grado, porque reintenta sus webhooks por diseño.
 *
 * **Nunca pongas una orden en PAID con un `prisma.order.update` suelto.** Toda
 * aprobación —Izipay, Mercado Pago, el dev bypass— pasa por aquí.
 */

export type OpcionesAprobacion = {
  /** Pasarela que cobró: "mercadopago" | "izipay". */
  provider: string;
  /** Referencia única del pago en la pasarela. `Payment.externalReference` es @unique. */
  externalReference: string;
  providerPaymentId?: string | null;
  paymentMethodId?: string | null;
  statusDetail?: string | null;
  rawPayload?: unknown;
};

export type ResultadoAprobacion = {
  /** true si otra vía ya había aprobado esta orden. El llamador no debe reenviar correos. */
  yaProcesada: boolean;
  stockNote?: string | null;
};

type ProductoBloqueado = {
  id: string;
  name: string;
  esPar: boolean;
  stock: number;
  stockHombre: number;
  stockMujer: number;
  stockAlmacen: number;
  stockAlmacenHombre: number;
  stockAlmacenMujer: number;
};

/**
 * Bloquea las filas de producto dentro de la transacción.
 *
 * El descuento decide entre almacén y tienda leyendo el stock y escribiendo
 * valores absolutos. Sin el `FOR UPDATE`, dos aprobaciones simultáneas —o una
 * venta del POS, que toca los mismos rows— leerían el mismo valor y la segunda
 * escritura pisaría a la primera. `ORDER BY id` evita deadlocks.
 */
async function bloquearProductos(
  tx: Prisma.TransactionClient,
  productIds: string[]
): Promise<ProductoBloqueado[]> {
  if (productIds.length === 0) return [];
  return tx.$queryRaw<ProductoBloqueado[]>`
    SELECT id, name, "esPar", stock, "stockHombre", "stockMujer",
           "stockAlmacen", "stockAlmacenHombre", "stockAlmacenMujer"
    FROM "Product"
    WHERE id IN (${Prisma.join(productIds)})
    ORDER BY id
    FOR UPDATE
  `;
}

export async function aprobarOrden(
  orderId: string,
  opts: OpcionesAprobacion
): Promise<ResultadoAprobacion> {
  return prisma.$transaction(
    async (tx) => {
      // 1. Compare-and-swap: un único UPDATE decide quién procesa la orden.
      //    `count === 0` es el camino de "alguien llegó antes"; no lo cambies
      //    por un findUnique + if, que no es atómico.
      const { count } = await tx.order.updateMany({
        where: { id: orderId, stockDeducted: false },
        data: {
          stockDeducted: true,
          status: "PAID",
          paymentProvider: opts.provider,
        },
      });
      if (count === 0) return { yaProcesada: true };

      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (!order) throw new Error(`aprobarOrden: orden ${orderId} no encontrada`);

      // 2. Descuento de stock. La regla es la de siempre: si el almacén cubre
      //    la cantidad sale de ahí, si no de tienda; un producto `esPar`
      //    consume el doble del stock agregado.
      const productIds = [...new Set(order.items.map((i) => i.productId).filter(Boolean))] as string[];
      const bloqueados = await bloquearProductos(tx, productIds);
      const porProducto = new Map(bloqueados.map((p) => [p.id, p]));

      const notas: string[] = [];

      for (const item of order.items) {
        if (!item.productId) continue;
        const p = porProducto.get(item.productId);
        if (!p) continue;

        const qty = item.quantity;
        const agregado = p.esPar ? qty * 2 : qty;

        const cabeEnAlmacen = p.esPar
          ? p.stockAlmacenHombre >= qty && p.stockAlmacenMujer >= qty
          : p.stockAlmacenHombre >= qty;

        if (cabeEnAlmacen) {
          await tx.product.update({
            where: { id: p.id },
            data: {
              stockAlmacenHombre: Math.max(0, p.stockAlmacenHombre - qty),
              ...(p.esPar && { stockAlmacenMujer: Math.max(0, p.stockAlmacenMujer - qty) }),
              stockAlmacen: Math.max(0, p.stockAlmacen - agregado),
              stock: Math.max(0, p.stock - agregado),
            },
          });
          notas.push(`${p.name}: descontado de ALMACÉN`);
        } else {
          await tx.product.update({
            where: { id: p.id },
            data: {
              stockHombre: Math.max(0, p.stockHombre - qty),
              ...(p.esPar && { stockMujer: Math.max(0, p.stockMujer - qty) }),
              stock: Math.max(0, p.stock - agregado),
            },
          });
          notas.push(`${p.name}: descontado de TIENDA`);
        }

        // La fila bloqueada se queda desfasada si el mismo producto aparece en
        // dos líneas del pedido; se actualiza en memoria para que la segunda
        // decida con el stock real.
        p.stockAlmacenHombre = cabeEnAlmacen ? Math.max(0, p.stockAlmacenHombre - qty) : p.stockAlmacenHombre;
        if (p.esPar && cabeEnAlmacen) p.stockAlmacenMujer = Math.max(0, p.stockAlmacenMujer - qty);
        if (cabeEnAlmacen) p.stockAlmacen = Math.max(0, p.stockAlmacen - agregado);
        if (!cabeEnAlmacen) {
          p.stockHombre = Math.max(0, p.stockHombre - qty);
          if (p.esPar) p.stockMujer = Math.max(0, p.stockMujer - qty);
        }
        p.stock = Math.max(0, p.stock - agregado);
      }

      const stockNote = notas.length > 0 ? notas.join(" | ") : null;
      if (stockNote) {
        await tx.order.update({ where: { id: orderId }, data: { stockNote } });
      }

      // 3. El comprobante de pago va dentro del CAS a propósito: sólo lo
      //    escribe quien ganó. Es un upsert y no un create porque
      //    `externalReference` es @unique y puede existir ya una fila
      //    rechazada del mismo pago — Mercado Pago rechaza primero y aprueba
      //    después vía webhook más a menudo de lo que parece.
      await tx.payment.upsert({
        where: { externalReference: opts.externalReference },
        create: {
          orderId,
          externalReference: opts.externalReference,
          mpPaymentId: opts.providerPaymentId ?? null,
          paymentMethodId: opts.paymentMethodId ?? null,
          statusDetail: opts.statusDetail ?? null,
          amount: order.total,
          status: "APPROVED",
          rawPayload: (opts.rawPayload ?? {}) as Prisma.InputJsonValue,
        },
        update: {
          mpPaymentId: opts.providerPaymentId ?? null,
          paymentMethodId: opts.paymentMethodId ?? null,
          statusDetail: opts.statusDetail ?? null,
          status: "APPROVED",
          rawPayload: (opts.rawPayload ?? {}) as Prisma.InputJsonValue,
        },
      });

      return { yaProcesada: false, stockNote };
    },
    { timeout: 15_000, maxWait: 10_000 }
  );
}
