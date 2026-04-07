"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cart";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { CardPaymentBrick } from "@/components/checkout/CardPaymentBrick";
import { PaymentResult } from "@/components/checkout/PaymentResult";
import { ShippingFormData } from "@/types";

type Step = "form" | "payment" | "result";

interface PaymentResultData {
  status: string;
  paymentId?: string;
  statusDetail?: string;
  error?: string;
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCartStore();
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [email, setEmail] = useState("");
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResultData | null>(null);
  const [savedShipping, setSavedShipping] = useState<ShippingFormData | null>(null);

  const sub = subtotal();
  const isTestMode = items.some((i) => i.testMode);

  useEffect(() => {
    if (items.length === 0 && step !== "result") {
      router.push("/carrito");
    }
  }, [items.length, step, router]);

  if (items.length === 0 && step !== "result") return null;

  const handleShippingSubmit = async (shippingData: ShippingFormData) => {
    setLoadingOrder(true);
    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            id: i.id,
            quantity: i.quantity,
            engravingText: i.engravingText,
            selectedSize: i.size,
          })),
          shipping: shippingData,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Error creando la orden");
        return;
      }

      const data = await res.json();
      setOrderId(data.orderId);
      setTotal(data.total);
      setEmail(shippingData.email);
      setSavedShipping(shippingData);
      setStep("payment");
    } catch {
      alert("Error de conexión");
    } finally {
      setLoadingOrder(false);
    }
  };

  const handlePaymentResult = (result: PaymentResultData) => {
    if (result.status === "approved" && orderId) {
      setStep("result"); // prevent the cart-empty useEffect from redirecting to /carrito
      clearCart();
      router.push(`/pedido/confirmacion/${orderId}`);
      return;
    }
    setPaymentResult(result);
    setStep("result");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold text-[#111111] mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {step === "form" && (
            <CheckoutForm onSubmit={handleShippingSubmit} loading={loadingOrder} subtotal={sub} isTestMode={isTestMode} defaultValues={savedShipping ?? undefined} />
          )}

          {step === "payment" && orderId && (
            <>
              {savedShipping && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start justify-between gap-4">
                  <div className="space-y-0.5 text-sm">
                    <p className="font-medium text-[#111111]">{savedShipping.firstName} {savedShipping.lastName} · {savedShipping.documentType} {savedShipping.documentNumber}</p>
                    <p className="text-gray-500">{savedShipping.street}, {savedShipping.district}</p>
                    <p className="text-gray-500">{savedShipping.province}, {savedShipping.department} {savedShipping.postalCode}</p>
                    <p className="text-gray-500">{savedShipping.email} · {savedShipping.phone}</p>
                    <p className="text-gray-400 text-xs capitalize">Courier: {savedShipping.courier === "shalom" ? "Shalom" : "Olva"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setStep("form"); setOrderId(null); }}
                    className="text-sm text-[#111111] underline underline-offset-2 hover:text-gray-500 transition-colors shrink-0"
                  >
                    Editar
                  </button>
                </div>
              )}
              <CardPaymentBrick
                total={total}
                orderId={orderId}
                email={email}
                onPaymentResult={handlePaymentResult}
              />
            </>
          )}

          {step === "result" && paymentResult && (
            <PaymentResult
              status={paymentResult.status}
              paymentId={paymentResult.paymentId}
              statusDetail={paymentResult.statusDetail}
              error={paymentResult.error}
              onRetry={() => { setStep("payment"); setPaymentResult(null); }}
            />
          )}
        </div>

        {step !== "result" && (
          <div>
            <OrderSummary items={items} subtotal={sub} />
          </div>
        )}
      </div>
    </div>
  );
}
