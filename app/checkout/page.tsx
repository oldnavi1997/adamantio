import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { izipayConfigured } from "@/lib/izipay";
import { culqiConfigured } from "@/lib/culqi";

// Las credenciales de las pasarelas se leen en cada request: sin esto, un build
// sin ellas dejaría las pestañas apagadas para siempre en el HTML prerenderizado.
export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return <CheckoutClient izipayEnabled={izipayConfigured()} culqiEnabled={culqiConfigured()} />;
}
