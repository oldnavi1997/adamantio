import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function CheckoutSuccessPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
      <h1 className="text-3xl font-bold text-[#111111] mb-3">¡Pago aprobado!</h1>
      <p className="text-gray-600 mb-8">
        Tu pedido fue confirmado. Recibirás un email con los detalles.
      </p>
      <Link href="/joyas">
        <Button size="lg">Seguir comprando</Button>
      </Link>
    </div>
  );
}
