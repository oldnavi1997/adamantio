import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function CheckoutFailurePage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <XCircle className="h-20 w-20 text-red-500 mx-auto mb-6" />
      <h1 className="text-3xl font-bold text-[#111111] mb-3">Pago rechazado</h1>
      <p className="text-gray-600 mb-8">
        No pudimos procesar tu pago. Por favor intentá nuevamente.
      </p>
      <Link href="/checkout">
        <Button size="lg">Reintentar</Button>
      </Link>
    </div>
  );
}
