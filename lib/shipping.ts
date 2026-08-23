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

export type Courier = "shalom" | "olva";

export function getShippingCost(courier: Courier, department: string): number {
  if (courier === "shalom") return SHALOM_PRICE;
  return OLVA_PRICE_BY_DEPARTMENT[department] ?? 15;
}

export type PaymentProvider = "mercadopago" | "izipay";

const IGV = 1.18;

/**
 * Comisión de la pasarela que se traslada al comprador.
 *
 * - Mercado Pago: 3.29% + IGV, más S/1 + IGV fijo.
 * - Izipay: 3.44% + IGV, más S/0.69 + IGV de comisión del canal virtual.
 */
export function getPaymentFee(provider: PaymentProvider, base: number): number {
  if (provider === "izipay") return base * 0.0344 * IGV + 0.69 * IGV;
  return base * 0.0329 * IGV + 1.18;
}
