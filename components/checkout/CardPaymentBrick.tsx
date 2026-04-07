"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";

const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!;
const IS_DEV = process.env.NODE_ENV === "development";

const MP_REJECTION_MESSAGES: Record<string, string> = {
  cc_rejected_bad_filled_security_code: "El código de seguridad (CVV) es incorrecto. Revísalo e intenta de nuevo.",
  cc_rejected_bad_filled_card_number: "El número de tarjeta es incorrecto. Revísalo e intenta de nuevo.",
  cc_rejected_bad_filled_date: "La fecha de vencimiento es incorrecta. Revísala e intenta de nuevo.",
  cc_rejected_insufficient_amount: "Tu tarjeta no tiene fondos suficientes.",
  cc_rejected_card_disabled: "Tu tarjeta está inhabilitada. Comunícate con tu banco.",
  cc_rejected_max_attempts: "Superaste el límite de intentos permitidos. Usa otra tarjeta.",
  cc_rejected_duplicated_payment: "Ya realizaste un pago por este monto. Si necesitas pagar de nuevo, usa otra tarjeta.",
  cc_rejected_other_reason: "Tu tarjeta fue rechazada. Intenta con otra tarjeta o método de pago.",
  cc_rejected_call_for_authorize: "Tu banco requiere que autorices el pago. Llama a tu banco e intenta de nuevo.",
  cc_rejected_high_risk: "El pago fue rechazado por políticas de seguridad. Intenta con otro método de pago.",
  bank_error: "Hubo un error con el banco. Intenta de nuevo en unos minutos.",
};

interface Props {
  total: number;
  orderId: string;
  email: string;
  onPaymentResult: (result: { status: string; paymentId?: string; statusDetail?: string; error?: string }) => void;
}

const mpInitialized = { current: false };

export function CardPaymentBrick({ total, orderId, email, onPaymentResult }: Props) {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "yape">("card");
  const [yapePhone, setYapePhone] = useState("");
  const [yapeOtpDigits, setYapeOtpDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const yapeOtp = yapeOtpDigits.join("");

  useEffect(() => {
    if (!IS_DEV && !mpInitialized.current) {
      initMercadoPago(MP_PUBLIC_KEY, { locale: "es-PE" });
      mpInitialized.current = true;
    }
  }, []);

  const handleOtpChange = useCallback((index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setYapeOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  }, []);

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !yapeOtpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }, [yapeOtpDigits]);

  const handleOtpPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const digits = pasted.split("");
    setYapeOtpDigits((prev) => {
      const next = [...prev];
      digits.forEach((d, i) => { next[i] = d; });
      return next;
    });
    otpRefs.current[Math.min(digits.length, 5)]?.focus();
  }, []);

  async function callProcess(body: Record<string, unknown>) {
    const res = await fetch("/api/payments/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      onPaymentResult({ status: "error", error: data.error || "Error procesando el pago" });
      return;
    }
    const detail = data.statusDetail ?? "";
    if (data.status === "rejected") {
      setError(MP_REJECTION_MESSAGES[detail] ?? "El pago fue rechazado. Revisa los datos e intenta de nuevo.");
      return;
    }
    onPaymentResult({ status: data.status, paymentId: data.paymentId, statusDetail: detail });
  }

  async function handleYapeSubmit() {
    setError("");
    if (!/^9\d{8}$/.test(yapePhone.trim())) {
      setError("Ingresa un número de celular válido de 9 dígitos que empiece con 9.");
      return;
    }
    if (yapeOtp.length !== 6 || !/^\d{6}$/.test(yapeOtp)) {
      setError("Ingresa el código de aprobación de 6 dígitos de Yape.");
      return;
    }
    setLoading(true);
    try {
      const requestId = crypto.randomUUID();
      const tokenRes = await fetch(
        `https://api.mercadopago.com/platforms/pci/yape/v1/payment?public_key=${MP_PUBLIC_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: yapePhone.trim(), otp: yapeOtp, requestId }),
        }
      );
      if (!tokenRes.ok) throw new Error("No se pudo verificar tu cuenta de Yape.");
      const tokenData = await tokenRes.json() as { id?: string };
      if (!tokenData?.id) throw new Error("No se pudo generar el token de Yape.");

      await callProcess({
        orderId,
        token: tokenData.id,
        paymentMethodId: "yape",
        installments: 1,
        email,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Dev bypass
  if (IS_DEV) {
    const handleDevBypass = async () => {
      setLoading(true);
      try {
        await callProcess({ orderId, devBypass: true });
      } finally {
        setLoading(false);
      }
    };
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-[#111111] mb-4">Datos de pago</h2>
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 mb-4 text-sm text-yellow-800">
          <strong>Modo desarrollo</strong> — Mercado Pago desactivado
        </div>
        <button
          onClick={handleDevBypass}
          disabled={loading}
          className="w-full bg-[#111111] text-white py-3 rounded-lg font-medium hover:bg-[#333] disabled:opacity-50 transition-colors"
        >
          {loading ? "Procesando..." : "Simular pago aprobado"}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
      <h2 className="font-semibold text-[#111111]">Datos de pago</h2>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(["card", "yape"] as const).map((method) => (
          <button
            key={method}
            type="button"
            onClick={() => { setPaymentMethod(method); setError(""); }}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
              paymentMethod === method
                ? "border-[#111111] text-[#111111]"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {method === "card" ? "Tarjeta" : "Yape"}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
      )}

      {paymentMethod === "card" && (
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-lg bg-white/95">
              <svg className="animate-spin h-10 w-10 text-[#111111]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm font-medium text-[#111111]">Procesando pago…</p>
              <p className="text-xs text-gray-400">No cierres esta ventana</p>
            </div>
          )}
          <CardPayment
            initialization={{ amount: total }}
            customization={{ paymentMethods: { maxInstallments: 12 } }}
            onSubmit={async (formData) => {
              setLoading(true);
              setError("");
              try {
                await callProcess({
                  orderId,
                  token: formData.token,
                  paymentMethodId: formData.payment_method_id,
                  issuerId: formData.issuer_id,
                  installments: formData.installments,
                  email: formData.payer?.email ?? email,
                });
              } finally {
                setLoading(false);
              }
            }}
            onError={(err) => {
              console.error("Brick error:", err);
              onPaymentResult({ status: "error", error: "Error en el formulario de pago" });
            }}
          />
        </div>
      )}

      {paymentMethod === "yape" && (
        <div className="relative space-y-4">
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-lg bg-white/95">
              <svg className="animate-spin h-10 w-10 text-[#5D2D8C]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm font-medium text-[#111111]">Verificando pago con Yape…</p>
              <p className="text-xs text-gray-400">No cierres esta ventana</p>
            </div>
          )}
          <p className="text-sm text-gray-500">Abre Yape, ve a <strong>Cobrar → Pagar por código</strong> y obtén tu código de aprobación.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número de celular (9 dígitos)</label>
            <input
              type="tel"
              value={yapePhone}
              onChange={(e) => setYapePhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
              placeholder="9XXXXXXXX"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Código de aprobación (6 dígitos)</label>
            <div className="flex gap-2" onPaste={handleOtpPaste}>
              {yapeOtpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  maxLength={1}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-10 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111111]"
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={handleYapeSubmit}
            disabled={loading}
            className="w-full bg-[#5D2D8C] text-white py-3 rounded-lg font-medium hover:bg-[#4a2470] disabled:opacity-50 transition-colors"
          >
            {loading ? "Verificando..." : "Pagar con Yape"}
          </button>
        </div>
      )}
    </div>
  );
}
