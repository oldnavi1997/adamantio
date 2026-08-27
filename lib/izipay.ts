import crypto from "node:crypto";
import type { Address, Order } from "@/app/generated/prisma/client";
import { aCentimos } from "@/lib/utils";

/**
 * Cliente de Izipay Perú sobre la pasarela Lyra/Krypton V4 (`api.micuentaweb.pe`).
 *
 * A diferencia de Mercado Pago, el backend no ejecuta el cargo: pide un
 * `formToken`, el formulario embebido cobra, y nosotros validamos la firma del
 * resultado. Toda la confianza descansa en esa firma, y hay DOS claves distintas:
 *
 * - `IZIPAY_HMAC_SHA256` firma lo que devuelve el navegador (`KR.onSubmit`).
 * - `IZIPAY_PASSWORD` firma lo que llega por la URL de notificación (IPN).
 *
 * El propio payload dice cuál usar en `kr-hash-key`. Usar la que no es hace que
 * un pago legítimo se rechace, así que no las intercambies.
 */

const JS_URL =
  "https://static.micuentaweb.pe/static/js/krypton-client/V4.0/stable/kr-payment-form.min.js";
const CSS_URL = "https://static.micuentaweb.pe/static/js/krypton-client/V4.0/ext/classic.css";
const THEME_JS_URL = "https://static.micuentaweb.pe/static/js/krypton-client/V4.0/ext/classic.js";

export function izipayUrls() {
  return {
    api: process.env.IZIPAY_API_URL || "https://api.micuentaweb.pe",
    js: JS_URL,
    css: CSS_URL,
    themeJs: THEME_JS_URL,
  };
}

/** La pestaña Izipay del checkout sólo aparece si esto es true. */
export function izipayConfigured(): boolean {
  return Boolean(
    process.env.IZIPAY_USERNAME &&
      process.env.IZIPAY_PASSWORD &&
      process.env.IZIPAY_PUBLIC_KEY &&
      process.env.IZIPAY_HMAC_SHA256
  );
}

// ─── Forma de `kr-answer` ───

export type KrTransaction = {
  uuid?: string;
  amount?: number;
  currency?: string;
  status?: string;
  detailedStatus?: string;
  paymentMethodType?: string;
  errorMessage?: string | null;
  detailedErrorMessage?: string | null;
  transactionDetails?: {
    cardDetails?: { pan?: string; effectiveBrand?: string };
  };
};

export type KrAnswer = {
  shopId?: string;
  /** PAID | UNPAID | RUNNING | PARTIALLY_PAID */
  orderStatus?: string;
  orderCycle?: string;
  orderDetails?: {
    orderId?: string;
    orderTotalAmount?: number;
    orderCurrency?: string;
  };
  transactions?: KrTransaction[];
};

// ─── formToken ───

/**
 * `POST /api-payment/V4/Charge/CreatePayment`. Devuelve el `formToken` que el
 * formulario embebido necesita para renderizarse.
 *
 * El importe va en la unidad mínima de la moneda: PEN tiene 2 decimales, así que
 * S/149.00 se envía como 14900.
 */
/**
 * `orderId` es el cuid de la orden. Adamantio no tiene un `orderNumber`, y el
 * cuid ya es único, estable y opaco: sirve tal cual como clave de correlación,
 * que es lo único que Izipay devuelve para identificar el pago.
 *
 * Los datos del comprador viven en la relación `Address`, no en la orden.
 */
export async function crearFormToken(order: Order & { address: Address | null }): Promise<string> {
  const { api } = izipayUrls();
  const auth = Buffer.from(
    `${process.env.IZIPAY_USERNAME}:${process.env.IZIPAY_PASSWORD}`
  ).toString("base64");

  const res = await fetch(`${api}/api-payment/V4/Charge/CreatePayment`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: aCentimos(Number(order.total)),
      currency: "PEN",
      orderId: order.id,
      customer: {
        email: order.contactEmail ?? undefined,
        reference: order.userId ?? undefined,
        billingDetails: {
          firstName: order.address?.fullName || undefined,
          address: order.address?.street || undefined,
          // `district` es el distrito y `state` el departamento; Lyra espera
          // ciudad y región, así que se mapean en ese orden.
          city: order.address?.district || order.address?.city || undefined,
          state: order.address?.state || undefined,
          zipCode: order.address?.postalCode || undefined,
          country: "PE",
          phoneNumber: order.address?.phone || undefined,
          identityType: order.address?.documentType || undefined,
          identityCode: order.address?.documentNumber || undefined,
          language: "ES",
        },
      },
    }),
    signal: AbortSignal.timeout(15_000),
  });

  const data = await res.json().catch(() => null);
  const formToken = data?.answer?.formToken;

  if (!res.ok || data?.status !== "SUCCESS" || !formToken) {
    const detalle = data?.answer?.errorMessage || data?.answer?.detailedErrorMessage;
    throw new Error(`Izipay CreatePayment falló (${res.status}): ${detalle ?? "sin detalle"}`);
  }
  return formToken as string;
}

// ─── Validación de firma ───

/**
 * `kr-hash` = HMAC-SHA256 hexadecimal de la cadena `kr-answer` tal cual se
 * transmitió, con la clave que indique `kr-hash-key`:
 *
 * - `"sha256_hmac"` → clave HMAC-SHA-256 (respuesta del navegador)
 * - `"password"`    → contraseña de la API REST (IPN)
 *
 * Se compara también una variante con `\/` desescapado: algunos clientes
 * serializan el JSON escapando las barras y el hash se calcula sobre el
 * original.
 */
export function validarKrHash(args: {
  krAnswer: string;
  krHash: string;
  krHashKey?: string;
}): boolean {
  const clave =
    args.krHashKey === "password"
      ? process.env.IZIPAY_PASSWORD
      : process.env.IZIPAY_HMAC_SHA256;

  if (!clave || !args.krAnswer || !args.krHash) return false;

  const candidatos = new Set([args.krAnswer, args.krAnswer.split("\\/").join("/")]);
  return [...candidatos].some((texto) => {
    const esperado = crypto.createHmac("sha256", clave).update(texto, "utf8").digest("hex");
    const a = Buffer.from(esperado, "utf8");
    const b = Buffer.from(args.krHash, "utf8");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

// ─── Normalización al vocabulario interno ───

/**
 * Lyra reporta CARD, YAPE, PLIN… pero el POS sólo entiende su enum
 * `PaymentMethod`. Todo lo que no sea Yape cuenta como cobro con tarjeta.
 */
export function mapIzipayPayMethod(paymentMethodType?: string): "TARJETA" | "YAPE" {
  return paymentMethodType?.toUpperCase().includes("YAPE") ? "YAPE" : "TARJETA";
}

/** Sólo `PAID` es un cobro completo; `PARTIALLY_PAID` y `RUNNING` no lo son. */
export function esPagado(answer: KrAnswer): boolean {
  return answer.orderStatus === "PAID";
}

/** La transacción con la que se cobró, para sacar id, importe y método. */
export function transaccionPrincipal(answer: KrAnswer): KrTransaction | undefined {
  const txs = answer.transactions ?? [];
  return txs.find((t) => t.status === "PAID") ?? txs[0];
}
