"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cart";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { CardPaymentBrick } from "@/components/checkout/CardPaymentBrick";
import { IzipayForm } from "@/components/checkout/IzipayForm";
import { PaymentResult } from "@/components/checkout/PaymentResult";
import { ShippingFormData } from "@/types";
import type { PaymentProvider } from "@/lib/shipping";

type Step = "form" | "payment" | "result";

interface PaymentResultData {
  status: string;
  paymentId?: string;
  statusDetail?: string;
  error?: string;
}

export function CheckoutClient({ izipayEnabled }: { izipayEnabled: boolean }) {
  const { items, subtotal, clearCart } = useCartStore();
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [email, setEmail] = useState("");
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResultData | null>(null);
  const [savedShipping, setSavedShipping] = useState<ShippingFormData | null>(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [mpCommission, setMpCommission] = useState(0);
  const [provider, setProvider] = useState<PaymentProvider>(
    izipayEnabled ? "izipay" : "mercadopago"
  );

  const sub = subtotal();
  const isTestMode = items.some((i) => i.testMode);
  const hasFreeShipping = items.some((i) => i.freeShipping);

  useEffect(() => {
    if (items.length === 0 && step !== "result") {
      router.push("/carrito");
    }
  }, [items.length, step, router]);

  if (items.length === 0 && step !== "result") return null;

  /**
   * Crea la orden con la pasarela indicada. La comisión va dentro del total, así
   * que cambiar de pasarela obliga a crear una orden nueva; la anterior se queda
   * en PENDING, igual que cualquier checkout que no se termina.
   */
  const crearOrden = async (shippingData: ShippingFormData, pasarela: PaymentProvider) => {
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
        paymentProvider: pasarela,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Error creando la orden");
    }

    const data = await res.json();
    setOrderId(data.orderId);
    setTotal(data.total);
    setShippingCost(data.shippingCost);
    setMpCommission(data.mpCommission);
    return data;
  };

  const handleShippingSubmit = async (shippingData: ShippingFormData) => {
    setLoadingOrder(true);
    try {
      await crearOrden(shippingData, provider);
      setEmail(shippingData.email);
      setSavedShipping(shippingData);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setStep("payment");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleProviderChange = async (pasarela: PaymentProvider) => {
    if (pasarela === provider || !savedShipping) return;
    setProvider(pasarela);
    setLoadingOrder(true);
    try {
      await crearOrden(savedShipping, pasarela);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setLoadingOrder(false);
    }
  };

  const handlePaymentResult = (result: PaymentResultData) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      <h2 className="text-2xl font-semibold text-[#111111] mb-8">Checkout</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {step === "form" && (
            <CheckoutForm onSubmit={handleShippingSubmit} loading={loadingOrder} subtotal={sub} isTestMode={isTestMode} freeShipping={hasFreeShipping} paymentProvider={provider} defaultValues={savedShipping ?? undefined} />
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
              {/* Tu orden — visible solo en mobile (en desktop está en la columna derecha) */}
              <div className="lg:hidden">
                <OrderSummary
                  items={items}
                  subtotal={sub}
                  shippingCost={shippingCost}
                  mpCommission={mpCommission}
                  total={total}
                />
              </div>
              {izipayEnabled && (
                <div className="flex border border-gray-200 rounded-xl overflow-hidden">
                  {([
                    { id: "izipay" as const, label: "Izipay", activo: "bg-[#e30613] text-white" },
                    { id: "mercadopago" as const, label: "Tarjeta", activo: "bg-[#111111] text-white" },
                  ]).map((t, i) => (
                    <button
                      key={t.id}
                      type="button"
                      disabled={loadingOrder}
                      onClick={() => handleProviderChange(t.id)}
                      className={`flex-1 py-3 text-sm font-medium transition-colors disabled:opacity-50 ${
                        i > 0 ? "border-l border-gray-200" : ""
                      } ${provider === t.id ? t.activo : "bg-white text-gray-500 hover:text-[#111111]"}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}

              {provider === "izipay" && izipayEnabled ? (
                <IzipayForm
                  total={total}
                  orderId={orderId}
                  onPaymentResult={handlePaymentResult}
                />
              ) : (
                <CardPaymentBrick
                  total={total}
                  orderId={orderId}
                  email={email}
                  onPaymentResult={handlePaymentResult}
                />
              )}
            </>
          )}

          {step === "result" && paymentResult && (
            <PaymentResult
              status={paymentResult.status}
              paymentId={paymentResult.paymentId}
              statusDetail={paymentResult.statusDetail}
              error={paymentResult.error}
              onRetry={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setStep("payment"); setPaymentResult(null); }}
            />
          )}
        </div>

        {step === "form" && (
          <div>
            <OrderSummary items={items} subtotal={sub} />
          </div>
        )}
        {step === "payment" && (
          <div className="hidden lg:block">
            <OrderSummary
              items={items}
              subtotal={sub}
              shippingCost={shippingCost}
              mpCommission={mpCommission}
              total={total}
            />
          </div>
        )}
      </div>
    </div>
  );
}
