import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { izipayConfigured } from "@/lib/izipay";

// Las credenciales de Izipay se leen en cada request: sin esto, un build sin
// ellas dejaría la pestaña apagada para siempre en el HTML prerenderizado.
export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return <CheckoutClient izipayEnabled={izipayConfigured()} />;
}
