import type { Address, Order } from "@/app/generated/prisma/client";
import { aCentimos } from "@/lib/utils";

/**
 * Cliente de Culqi (pagos online: tarjeta y Yape).
 *
 * A diferencia de Izipay, aquí el cargo lo ejecuta NUESTRO backend: el navegador
 * sólo tokeniza con el Checkout Custom y nos manda el `tkn_...`. Eso deja el
 * flujo más cerca del de Mercado Pago que del de Izipay.
 *
 * Lo que sí es propio de Culqi es el 3DS de dos tiempos: el primer cargo puede
 * responder 200 —"autentica al comprador"— en vez de 201, y hay que repetirlo
 * con los parámetros que devuelve la librería Culqi3DS del navegador. El
 * `device_finger_print_id` tiene que ser EL MISMO en los dos intentos.
 */

const JS_URL = "https://js.culqi.com/checkout-js";
const TRES_DS_URL = "https://3ds.culqi.com";

export function culqiUrls() {
  return {
    api: process.env.CULQI_API_URL || "https://api.culqi.com/v2",
    js: JS_URL,
    tresDS: TRES_DS_URL,
  };
}

/** La pestaña Culqi del checkout sólo aparece si esto es true. */
export function culqiConfigured(): boolean {
  return Boolean(process.env.CULQI_PUBLIC_KEY && process.env.CULQI_SECRET_KEY);
}

/** Límites de importe de Culqi, en céntimos. Fuera de rango el cargo ni se intenta. */
export const CULQI_MIN_CENTIMOS = 300;
export const CULQI_MAX_CENTIMOS = 999_900;

// ─── Forma de las respuestas ───

export type CulqiOutcome = {
  /** `venta_exitosa` es el único que cuenta como cobrado. */
  type?: string;
  code?: string;
  merchant_message?: string;
  user_message?: string;
};

export type CulqiSource = {
  /** `tkn_…` para tarjeta, `ype_…` para Yape. Es lo único que los separa. */
  id?: string;
  object?: string;
  type?: string;
  iin?: { card_brand?: string; card_type?: string };
};

export type CulqiCharge = {
  object?: string;
  id?: string;
  amount?: number;
  currency_code?: string;
  outcome?: CulqiOutcome;
  source?: CulqiSource;
  metadata?: Record<string, string>;
};

/** Cuerpo de error de Culqi: `object: "error"` con mensajes ya redactados. */
export type CulqiError = {
  object?: string;
  type?: string;
  code?: string;
  merchant_message?: string;
  user_message?: string;
  charge_id?: string;
};

export type ResultadoCargo =
  | { tipo: "aprobado"; charge: CulqiCharge }
  | { tipo: "requiere3ds" }
  | { tipo: "rechazado"; mensaje: string; raw: unknown };

// ─── Cargo ───

function cabeceras() {
  return {
    Authorization: `Bearer ${process.env.CULQI_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

/** "Ana María Torres Ríos" → { nombre: "Ana", apellido: "María Torres Ríos" }. */
function partirNombre(fullName?: string | null) {
  const partes = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return { nombre: "Cliente", apellido: "Web" };
  if (partes.length === 1) return { nombre: partes[0], apellido: partes[0] };
  return { nombre: partes[0], apellido: partes.slice(1).join(" ") };
}

/**
 * `POST /charges`.
 *
 * El status HTTP es el que manda: 201 cobrado, 200 el motor antifraude pide
 * 3DS, 4xx/5xx rechazado. Un rechazo NO lanza: es un resultado de negocio, no
 * un fallo de red, y el checkout tiene que poder mostrarlo.
 */
export async function crearCargo(
  order: Order & { address: Address | null },
  args: {
    email: string;
    tokenId: string;
    deviceFingerPrintId?: string;
    authentication3DS?: Record<string, unknown>;
  }
): Promise<ResultadoCargo> {
  const { api } = culqiUrls();
  const { nombre, apellido } = partirNombre(order.address?.fullName);

  const res = await fetch(`${api}/charges`, {
    method: "POST",
    headers: cabeceras(),
    body: JSON.stringify({
      // El importe sale de la BD, nunca del navegador.
      amount: aCentimos(Number(order.total)),
      currency_code: "PEN",
      email: args.email,
      source_id: args.tokenId,
      antifraud_details: {
        first_name: nombre,
        last_name: apellido,
        address: order.address?.street || "Sin dirección",
        address_city: order.address?.district || order.address?.city || "Lima",
        country_code: "PE",
        phone_number: order.address?.phone || undefined,
        device_finger_print_id: args.deviceFingerPrintId || undefined,
      },
      // Es lo único que le queda al webhook para encontrar la orden: Culqi no
      // tiene un campo de referencia externa como el `external_reference` de MP.
      metadata: { orderId: order.id },
      ...(args.authentication3DS && { authentication_3DS: args.authentication3DS }),
    }),
    // El 3DS estira la latencia bastante más que un cargo normal.
    signal: AbortSignal.timeout(30_000),
  });

  const data = await res.json().catch(() => null);

  if (res.status === 201 && data?.id) {
    return { tipo: "aprobado", charge: data as CulqiCharge };
  }
  if (res.status === 200) {
    return { tipo: "requiere3ds" };
  }

  const error = (data ?? {}) as CulqiError;
  return {
    tipo: "rechazado",
    mensaje:
      error.user_message ||
      error.merchant_message ||
      `Culqi rechazó el cargo (${res.status})`,
    raw: data ?? { status: res.status },
  };
}

/**
 * `GET /charges/{id}`. La usa el webhook: el cuerpo de la notificación no se
 * valida por firma, así que el estado real se vuelve a pedir a Culqi.
 */
export async function consultarCargo(chargeId: string): Promise<CulqiCharge | null> {
  const { api } = culqiUrls();
  const res = await fetch(`${api}/charges/${encodeURIComponent(chargeId)}`, {
    headers: cabeceras(),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data?.id ? (data as CulqiCharge) : null;
}

// ─── Normalización al vocabulario interno ───

/** Sólo `venta_exitosa` es un cobro completo. */
export function esCargoExitoso(charge: CulqiCharge): boolean {
  return charge.outcome?.type === "venta_exitosa";
}

/**
 * Culqi devuelve el origen del cobro en `source`. El POS sólo entiende su enum
 * `MetodoPago`, así que todo lo que no sea Yape cuenta como tarjeta.
 *
 * **El prefijo del id del token es la única señal fiable.** En un cobro con Yape
 * Culqi devuelve igualmente `source.object: "token"` y `source.type: "card"`,
 * con su `card_number` enmascarado y su marca Visa incluidos; mirar esos campos
 * hace que una venta por Yape se registre como tarjeta. Sólo el `ype_` la
 * distingue. Verificado contra el sandbox con el celular de prueba 900000001.
 */
export function mapCulqiPayMethod(charge: CulqiCharge): "TARJETA" | "YAPE" {
  if (charge.source?.id?.startsWith("ype_")) return "YAPE";
  const marca = [charge.source?.type, charge.source?.object].join(" ").toLowerCase();
  return marca.includes("yape") ? "YAPE" : "TARJETA";
}
