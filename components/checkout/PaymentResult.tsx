"use client";

import { XCircle, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface PaymentResultProps {
  status: string;
  paymentId?: string;
  statusDetail?: string;
  error?: string;
  onRetry?: () => void;
}

export function PaymentResult({ status, statusDetail, error, onRetry }: PaymentResultProps) {
  if (status === "in_process" || status === "pending") {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-yellow-100 p-8 text-center">
        <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-[#111111] mb-2">Pago en proceso</h2>
        <p className="text-gray-600 mb-6">
          Tu pago está siendo procesado. Te notificaremos por email cuando se confirme.
        </p>
        <Link href="/joyas">
          <Button variant="outline">Volver a la tienda</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-red-100 p-8 text-center">
      <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-[#111111] mb-2">Pago rechazado</h2>
      <p className="text-gray-600 mb-2">
        {error || "No pudimos procesar tu pago. Verificá los datos de tu tarjeta."}
      </p>
      {statusDetail && (
        <p className="text-sm text-gray-400 mb-6">Detalle: {statusDetail}</p>
      )}
      {onRetry && (
        <Button onClick={onRetry}>Intentar nuevamente</Button>
      )}
    </div>
  );
}
