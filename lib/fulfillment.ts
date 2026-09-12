import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ETIQUETA_CORTA, esVariante, piezasDeVariante } from "@/lib/variantes";
import { resumenEscalares } from "@/lib/tallas";

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
  stockPorTalla: boolean;
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
    SELECT id, name, "esPar", "stockPorTalla", stock, "stockHombre", "stockMujer",
           "stockAlmacen", "stockAlmacenHombre", "stockAlmacenMujer"
    FROM "Product"
    WHERE id IN (${Prisma.join(productIds)})
    ORDER BY id
    FOR UPDATE
  `;
}

/**
 * Descuenta una línea de un producto que lleva inventario por talla.
 *
 * La condición de stock va DENTRO del `where` del `updateMany`: si otra venta
 * se llevó la última unidad entre medias, la actualización no afecta a ninguna
 * fila y nos enteramos, en vez de leer primero y escribir sobre un dato viejo.
 * Es el patrón que el punto de venta ya usa en sus traslados.
 *
 * No se lanza cuando no cuadra. La orden ya está cobrada y el
 * compare-and-swap ya se consumió: un throw la dejaría sin aprobar y el
 * webhook reintentaría en bucle. Se descuenta lo que se pueda y queda escrito
 * en la nota para que el dueño lo vea.
 */
async function descontarTalla(
  tx: Prisma.TransactionClient,
  p: ProductoBloqueado,
  talla: string | null,
  qty: number
): Promise<string> {
  const fila = talla
    ? await tx.productSize.findUnique({
        where: { productId_talla: { productId: p.id, talla } },
      })
    : null;

  // Un pedido creado antes de activar la bandera, o con una talla que ya no
  // existe, no tiene de dónde descontar. Se deja constancia y se sigue: el
  // resumen se recalcula igual y el dueño ve qué pasó.
  if (!fila) {
    await sincronizarEscalares(tx, p.id);
    return `${p.name}: SIN TALLA${talla ? ` («${talla}» ya no existe)` : ""}, revisar a mano`;
  }

  // Sale del almacén lo que haya, y el resto de tienda.
  //
  // El reparto no es un lujo: el checkout valida contra el total de la talla,
  // sumando las dos ubicaciones. Descontar de una sola, todo o nada, dejaba
  // pedidos cobrados sin descontar cuando las unidades estaban repartidas —dos
  // en tienda y una en almacén para un pedido de tres, por ejemplo—.
  const deAlmacen = Math.min(fila.stockAlmacen, qty);
  const deTienda = qty - deAlmacen;

  // Las dos condiciones van dentro del `where` para que el reparto entero sea
  // atómico: o se descuentan las dos partes o no se descuenta ninguna.
  const { count } = await tx.productSize.updateMany({
    where: {
      id: fila.id,
      ...(deAlmacen > 0 && { stockAlmacen: { gte: deAlmacen } }),
      ...(deTienda > 0 && { stockTienda: { gte: deTienda } }),
    },
    data: {
      ...(deAlmacen > 0 && { stockAlmacen: { decrement: deAlmacen } }),
      ...(deTienda > 0 && { stockTienda: { decrement: deTienda } }),
    },
  });

  await sincronizarEscalares(tx, p.id);

  if (count !== 1) {
    return `${p.name} (talla ${fila.talla}): SIN STOCK para ${qty}, revisar a mano`;
  }
  const donde =
    deAlmacen > 0 && deTienda > 0
      ? `${deAlmacen} de ALMACÉN y ${deTienda} de TIENDA`
      : deAlmacen > 0
        ? "ALMACÉN"
        : "TIENDA";
  return `${p.name} (talla ${fila.talla}): descontado de ${donde}`;
}

/**
 * Reescribe los cuatro contadores del producto a partir de sus tallas.
 *
 * Son un resumen, no una fuente: es lo que hace que el catálogo, Algolia, el
 * feed y el inventario del punto de venta sigan leyendo `stock` y acertando.
 */
async function sincronizarEscalares(tx: Prisma.TransactionClient, productId: string) {
  const filas = await tx.productSize.findMany({
    where: { productId },
    select: { stockTienda: true, stockAlmacen: true },
  });
  await tx.product.update({ where: { id: productId }, data: resumenEscalares(filas) });
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

      // 2. Descuento de stock. Si el almacén cubre la cantidad sale de ahí, si
      //    no de tienda. Cuántas piezas de cada lado consume la línea lo dice
      //    `piezasDeVariante`, que es también donde vive la compatibilidad:
      //    una variante nula sobre un producto `esPar` es la pareja completa,
      //    que es como se vendía antes y como se cobraron las órdenes que
      //    puedan estar todavía sin pagar.
      const productIds = [...new Set(order.items.map((i) => i.productId).filter(Boolean))] as string[];
      const bloqueados = await bloquearProductos(tx, productIds);
      const porProducto = new Map(bloqueados.map((p) => [p.id, p]));

      const notas: string[] = [];

      for (const item of order.items) {
        if (!item.productId) continue;
        const p = porProducto.get(item.productId);
        if (!p) continue;

        const qty = item.quantity;

        // Inventario por talla. Es excluyente con `esPar` —hay un CHECK en la
        // base— así que se resuelve entero aquí y la línea no sigue.
        if (p.stockPorTalla) {
          const nota = await descontarTalla(tx, p, item.selectedSize, qty);
          notas.push(nota);
          continue;
        }

        const variante = esVariante(item.variante) ? item.variante : null;
        const unidad = piezasDeVariante(variante, p.esPar);
        const necH = unidad.hombre * qty;
        const necM = unidad.mujer * qty;
        const agregado = necH + necM;

        const cabeEnAlmacen = p.stockAlmacenHombre >= necH && p.stockAlmacenMujer >= necM;

        // Las escrituras van condicionadas a que la línea consuma ese lado. No
        // es cosmética: reescribir una columna que el pedido no toca amplía sin
        // motivo el choque con el POS, que escribe estas mismas filas.
        if (cabeEnAlmacen) {
          await tx.product.update({
            where: { id: p.id },
            data: {
              ...(necH > 0 && { stockAlmacenHombre: Math.max(0, p.stockAlmacenHombre - necH) }),
              ...(necM > 0 && { stockAlmacenMujer: Math.max(0, p.stockAlmacenMujer - necM) }),
              stockAlmacen: Math.max(0, p.stockAlmacen - agregado),
              stock: Math.max(0, p.stock - agregado),
            },
          });
        } else {
          await tx.product.update({
            where: { id: p.id },
            data: {
              ...(necH > 0 && { stockHombre: Math.max(0, p.stockHombre - necH) }),
              ...(necM > 0 && { stockMujer: Math.max(0, p.stockMujer - necM) }),
              stock: Math.max(0, p.stock - agregado),
            },
          });
        }

        // La etiqueta nunca lleva `|`: el admin parte esta nota por ese carácter.
        const queEs = variante ? ` (${ETIQUETA_CORTA[variante]})` : "";
        notas.push(`${p.name}${queEs}: descontado de ${cabeEnAlmacen ? "ALMACÉN" : "TIENDA"}`);

        // La fila bloqueada se queda desfasada si el mismo producto aparece en
        // dos líneas del pedido; se actualiza en memoria para que la segunda
        // decida con el stock real.
        if (cabeEnAlmacen) {
          p.stockAlmacenHombre = Math.max(0, p.stockAlmacenHombre - necH);
          p.stockAlmacenMujer = Math.max(0, p.stockAlmacenMujer - necM);
          p.stockAlmacen = Math.max(0, p.stockAlmacen - agregado);
        } else {
          p.stockHombre = Math.max(0, p.stockHombre - necH);
          p.stockMujer = Math.max(0, p.stockMujer - necM);
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
