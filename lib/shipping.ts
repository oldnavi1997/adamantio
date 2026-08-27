/**
 * Costos de envío y comisión de pasarela.
 *
 * Vive aquí porque el servidor y el cliente tienen que calcular exactamente lo
 * mismo: `create-order` fija el importe real y `CheckoutForm` lo previsualiza.
 * Antes la tabla y la fórmula estaban copiadas en los dos archivos.
 */

export const SHALOM_PRICE = 8;

export const OLVA_PRICE_BY_DEPARTMENT: Record<string, number> = {
  Amazonas: 18, Ancash: 18, Apurimac: 15, Ayacucho: 15, Cajamarca: 16,
  Cusco: 15, Huancavelica: 16, Huanuco: 18, Ica: 15, Junin: 16,
  "La Libertad": 16, Lambayeque: 18, Lima: 15, Loreto: 20,
  "Madre de Dios": 16, Moquegua: 12, Pasco: 16, Piura: 18, Puno: 12,
  "San Martin": 18, Tacna: 12, Tumbes: 20, Ucayali: 16, Arequipa: 15, Callao: 15,
};

/**
 * Modo de entrega elegido en el checkout.
 *
 * `"tienda"` no es un courier, es recojo en el local. Se llama igual que los
 * otros dos porque comparte el campo (`Order.courier`) y el selector: para el
 * comprador es una opción más de "cómo lo recibo".
 */
export type Courier = "shalom" | "olva" | "tienda";

/** Modos que sí implican un envío, y por tanto una dirección de destino. */
export type CourierEnvio = Exclude<Courier, "tienda">;

/** Etiquetas para el panel de administración y el checkout. */
export const COURIER_LABELS: Record<Courier, string> = {
  shalom: "Shalom",
  olva: "Olva Courier",
  tienda: "Recojo en tienda",
};

/**
 * El local donde se recoge. La dirección **la fija el servidor** al crear la
 * orden: el comprador no la escribe, así que no hay nada que validar ni que un
 * cliente manipulado pueda cambiar.
 *
 * Los nombres de distrito/provincia/departamento son los de `peru-ubigeo.json`,
 * para que se lean igual que los de cualquier otro pedido.
 */
export const TIENDA = {
  street: "Calle Rivero 107, oficina 202",
  district: "Arequipa",
  province: "Arequipa",
  department: "Arequipa",
  postalCode: "040101",
} as const;

/** Recoger en el local no tiene costo de envío. */
export function esRecojo(courier: Courier): courier is "tienda" {
  return courier === "tienda";
}

/**
 * Rótulos del campo de destino, por courier.
 *
 * Shalom entrega **solo en agencia**: hay que decir a cuál va el paquete. Olva
 * admite agencia o domicilio. El campo es el mismo (`Address.street`), pero no
 * puede llamarse "calle" en los dos casos.
 *
 * La copia vive aquí por lo mismo que `getShippingCost`: la usan el checkout, la
 * página de confirmación y el correo, y tienen que decir exactamente lo mismo.
 */
export const DESTINO_COPY: Record<
  CourierEnvio,
  {
    /** Rótulo del input en el checkout. */
    label: string;
    /** Ejemplo dentro del input. */
    placeholder: string;
    /** Mensaje de validación cuando falta. */
    error: string;
    /** Rótulo al releer el pedido: confirmación y correo. */
    resumen: string;
  }
> = {
  shalom: {
    label: "Indique la agencia Shalom destino",
    placeholder: "Ej.: Agencia Chorrillos - Av. Guardia Civil 123",
    error: "Indica la agencia Shalom de destino",
    resumen: "Agencia",
  },
  olva: {
    label: "Indique la agencia o dirección",
    placeholder: "Ej.: Agencia Olva Miraflores, o Av. Arequipa 1234 Dpto 501",
    error: "Indica la agencia o la dirección de entrega",
    resumen: "Agencia o dirección",
  },
};

/** Rótulo del destino al releer el pedido, ya sea envío o recojo. */
export function destinoResumen(courier: Courier): string {
  return esRecojo(courier) ? "Recojo en" : DESTINO_COPY[courier].resumen;
}

export function getShippingCost(courier: Courier, department: string): number {
  if (esRecojo(courier)) return 0;
  if (courier === "shalom") return SHALOM_PRICE;
  return OLVA_PRICE_BY_DEPARTMENT[department] ?? 15;
}

export type PaymentProvider = "mercadopago" | "izipay" | "culqi";

/** Etiquetas para el panel de administración. */
export const PROVIDER_LABELS: Record<PaymentProvider, string> = {
  culqi: "Culqi",
  izipay: "Izipay",
  mercadopago: "Mercado Pago",
};

const IGV = 1.18;

/** Culqi cobra el fijo en dólares; el tipo de cambio es el referencial acordado. */
const CULQI_FIJO_USD = 0.2;
const CULQI_TIPO_CAMBIO = 3.85;

/**
 * Comisión de la pasarela que se traslada al comprador.
 *
 * - Mercado Pago: 3.29% + IGV, más S/1 + IGV fijo.
 * - Izipay: 3.44% + IGV, más S/0.69 + IGV de comisión del canal virtual.
 * - Culqi: 3.44% + USD 0.20. OJO: esta tarifa ya viene con IGV incluido, por eso
 *   —a diferencia de las otras dos— no se multiplica por `IGV`. No es un olvido.
 */
export function getPaymentFee(provider: PaymentProvider, base: number): number {
  if (provider === "culqi") return base * 0.0344 + CULQI_FIJO_USD * CULQI_TIPO_CAMBIO;
  if (provider === "izipay") return base * 0.0344 * IGV + 0.69 * IGV;
  return base * 0.0329 * IGV + 1.18;
}
