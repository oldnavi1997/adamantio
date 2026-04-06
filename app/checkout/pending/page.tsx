import Link from "next/link";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function CheckoutPendingPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <Clock className="h-20 w-20 text-yellow-500 mx-auto mb-6" />
      <h1 className="text-3xl font-bold text-[#111111] mb-3">Pago en proceso</h1>
      <p className="text-gray-600 mb-8">
        Tu pago está siendo verificado. Te notificaremos por email cuando se confirme.
      </p>
      <Link href="/">
        <Button size="lg" variant="outline">Volver al inicio</Button>
      </Link>
    </div>
  );
}
