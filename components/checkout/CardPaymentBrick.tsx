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
    <>
      {/* Full-screen overlay while processing */}
      {loading && (
        <div className="checkout-processing-overlay">
          <div className="checkout-processing-content">
            <div className="checkout-spinner" />
            <p>{paymentMethod === "yape" ? "Verificando pago con Yape…" : "Procesando pago…"}</p>
            <p className="muted">No cierres esta ventana</p>
          </div>
        </div>
      )}

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
        <div>
          <div style={{ display: loading ? "none" : "block" }}>
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
        </div>
      )}

      {paymentMethod === "yape" && (
        <div>
          <div className="yape-card">
            <div className="yape-header">
              <img src="https://res.cloudinary.com/dzqns7kss/image/upload/v1772670756/Yape-App-Logo-Vector.svg-_g36q5h.png" alt="Yape" className="yape-logo" width="32" height="32" />
              <div>
                <strong className="yape-title">Paga con Yape en pocos segundos</strong>
                <p className="yape-subtitle">Completa los siguientes datos y confirma tu compra.</p>
              </div>
            </div>

            <label className="yape-field">
              <span className="yape-label">Celular asociado a Yape</span>
              <input
                type="tel"
                className="yape-input"
                value={yapePhone}
                onChange={(e) => setYapePhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
                placeholder="Ej.: 999 123 456"
                maxLength={9}
              />
            </label>

            <div className="yape-field">
              <span className="yape-label">Código de aprobación</span>
              <div className="yape-otp-row" onPaste={handleOtpPaste}>
                {yapeOtpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    className="yape-otp-digit"
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    maxLength={1}
                  />
                ))}
              </div>
            </div>

            <div className="yape-info">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="8" r="7.5" stroke="#009EE3" fill="#E8F4FD"/>
                <text x="8" y="12" textAnchor="middle" fill="#009EE3" fontSize="11" fontWeight="700">i</text>
              </svg>
              <span>Recuerda tener activada la opción &quot;Compras por internet&quot; en Yape y verificar tu límite diario.</span>
            </div>

            <button
              type="button"
              disabled={loading || !yapePhone.trim() || yapeOtp.length !== 6}
              onClick={handleYapeSubmit}
              className="yape-submit-btn"
            >
              {loading ? "Procesando..." : "Pagar con Yape"}
            </button>

            <p className="yape-footer">Procesado por Mercado Pago</p>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
