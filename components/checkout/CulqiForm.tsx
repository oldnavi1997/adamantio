"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatPEN } from "@/lib/utils";
import { PaymentProcessingOverlay } from "@/components/checkout/PaymentProcessingOverlay";
import { cargarScript } from "@/components/checkout/cargar-recursos";

interface CulqiFormProps {
  total: number;
  /** La orden ya existe: Adamantio la crea al pasar del formulario al pago. */
  orderId: string;
  email: string;
  onPaymentResult: (result: {
    status: string;
    paymentId?: string;
    statusDetail?: string;
    error?: string;
  }) => void;
}

/** Corta el overlay si la pasarela nunca responde, para no dejar la página muerta. */
const LIMITE_PROCESANDO_MS = 4 * 60 * 1000;

// ─── Lo que Culqi cuelga de `window` ───

type Culqi3DSGlobal = {
  publicKey: string;
  settings: unknown;
  generateDevice: () => Promise<string | null>;
  initAuthentication: (tokenId: string) => void;
  reset: () => void;
};

type CulqiCheckoutInstance = {
  culqi: () => void;
  open: () => void;
  close?: () => void;
  token?: { id?: string };
  error?: { user_message?: string; merchant_message?: string };
};

type CulqiCheckoutCtor = new (publicKey: string, config: unknown) => CulqiCheckoutInstance;

function globales() {
  const w = window as unknown as {
    Culqi3DS?: Culqi3DSGlobal;
    CulqiCheckout?: CulqiCheckoutCtor;
  };
  return { Culqi3DS: w.Culqi3DS, CulqiCheckout: w.CulqiCheckout };
}

/**
 * Pago con Culqi (tarjeta y Yape) en el Checkout Custom.
 *
 * Al revés que Izipay, aquí el navegador NO cobra: el checkout de Culqi sólo
 * tokeniza y el cargo lo ejecuta `/api/payments/culqi/charge` con el importe de
 * la BD. Por eso no hay ninguna firma que validar de vuelta.
 *
 * La parte delicada es el 3D Secure, que va en dos tiempos:
 *
 *   token → cargo → `auth_required` → Culqi3DS.initAuthentication → cargo otra vez
 *
 * El resultado del reto NO llega por callback ni por promesa: Culqi lo publica
 * con `postMessage` sobre nuestra propia ventana, de ahí el listener de
 * `message`. Por eso `Culqi3DS.settings.charge.returnUrl` tiene que apuntar a
 * una URL nuestra, y por eso se filtra por `event.origin`.
 */
export function CulqiForm({ total, orderId, email, onPaymentResult }: CulqiFormProps) {
  const [preparando, setPreparando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  /** El reto 3DS está en pantalla: lo pinta Culqi, no nosotros. */
  const [autenticando, setAutenticando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPaymentResultRef = useRef(onPaymentResult);
  onPaymentResultRef.current = onPaymentResult;

  /**
   * Espejo síncrono de `procesando`. El estado de React se aplica en el
   * siguiente render, así que un doble clic rápido podría colarse antes de que
   * `procesando` valga true; el ref se actualiza en el acto.
   */
  const procesandoRef = useRef(false);
  const temporizadorRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Datos del intento en curso. El cargo que va después del reto 3DS tiene que
   * repetir EL MISMO token y el MISMO device id, o Culqi lo rechaza.
   */
  const intentoRef = useRef<{ tokenId: string; deviceFingerPrintId?: string } | null>(null);

  const cerrarOverlay = useCallback(() => {
    procesandoRef.current = false;
    setProcesando(false);
    setAutenticando(false);
    if (temporizadorRef.current) {
      clearTimeout(temporizadorRef.current);
      temporizadorRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    if (temporizadorRef.current) clearTimeout(temporizadorRef.current);
  }, []);

  const cobrar = useCallback(
    async (authentication3DS?: Record<string, unknown>) => {
      const intento = intentoRef.current;
      if (!intento) return;

      setError(null);
      setAutenticando(false);
      procesandoRef.current = true;
      setProcesando(true);
      if (!temporizadorRef.current) {
        temporizadorRef.current = setTimeout(() => {
          cerrarOverlay();
          setError(
            "El pago está tardando más de lo normal. No vuelvas a intentarlo todavía: " +
              "si el cobro se completó te llegará el correo de confirmación."
          );
        }, LIMITE_PROCESANDO_MS);
      }

      try {
        const res = await fetch("/api/payments/culqi/charge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            tokenId: intento.tokenId,
            deviceFingerPrintId: intento.deviceFingerPrintId,
            authentication3DS,
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          cerrarOverlay();
          setError(data.error || "No se pudo procesar el pago");
          return;
        }

        if (data.status === "auth_required") {
          // El reto lo pinta Culqi sobre la página: nos apartamos o el comprador
          // no podría escribir el código. `procesandoRef` sigue en true, así que
          // el bloqueo de doble cobro no se levanta.
          setProcesando(false);
          setAutenticando(true);
          globales().Culqi3DS?.initAuthentication(intento.tokenId);
          return;
        }

        cerrarOverlay();
        onPaymentResultRef.current({
          status: data.status,
          paymentId: data.paymentId,
          statusDetail: data.statusDetail,
        });
      } catch {
        cerrarOverlay();
        // El cargo pudo haberse ejecutado: el webhook lo resolverá del lado servidor.
        onPaymentResultRef.current({
          status: "in_process",
          statusDetail: "Estamos confirmando tu pago. Te avisaremos por correo.",
        });
      }
    },
    [orderId, cerrarOverlay]
  );

  // Resultado del reto 3DS. Culqi lo publica con `postMessage` sobre nuestra
  // ventana; se filtra por origen porque cualquier iframe puede escribir aquí.
  useEffect(() => {
    const alRecibirMensaje = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const data = e.data as
        | { parameters3DS?: Record<string, unknown>; error?: unknown; loading?: boolean }
        | null;
      if (!data || typeof data !== "object") return;

      if (data.parameters3DS) {
        void cobrar(data.parameters3DS);
        return;
      }
      if (data.error) {
        cerrarOverlay();
        const mensaje =
          typeof data.error === "string"
            ? data.error
            : (data.error as { user_message?: string })?.user_message;
        setError(mensaje || "No se pudo completar la verificación de seguridad.");
        return;
      }
      // Mientras Culqi enseña su propio loader, el nuestro sobra.
      if (data.loading === true) setProcesando(false);
    };

    window.addEventListener("message", alRecibirMensaje);
    return () => window.removeEventListener("message", alRecibirMensaje);
  }, [cobrar, cerrarOverlay]);

  const iniciar = async () => {
    if (procesandoRef.current) return;
    setError(null);
    setPreparando(true);
    try {
      const res = await fetch("/api/payments/culqi/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo iniciar el pago");

      await cargarScript(data.tresDSUrl, { defer: "true" }, "Culqi");
      await cargarScript(data.jsUrl, {}, "Culqi");

      const { Culqi3DS, CulqiCheckout } = globales();
      if (!Culqi3DS || !CulqiCheckout) throw new Error("El formulario de Culqi no se cargó");

      const correo = data.email || email;

      // `reset()` limpia las instancias del intento anterior; sin él, un segundo
      // pago en la misma pestaña arrastra el token viejo.
      Culqi3DS.reset();
      Culqi3DS.publicKey = data.publicKey;
      Culqi3DS.settings = {
        charge: { totalAmount: data.amount, returnUrl: data.returnUrl },
        card: { email: correo },
      };

      // Huella del dispositivo para el motor antifraude. Va en el cargo y tiene
      // que repetirse igual tras el reto 3DS.
      const deviceFingerPrintId = (await Culqi3DS.generateDevice()) ?? undefined;

      const checkout = new CulqiCheckout(data.publicKey, {
        // `currency` y `amount` son obligatorios para que aparezca Yape.
        settings: { title: "Adamantio", currency: data.currency, amount: data.amount },
        client: { email: correo },
        options: {
          lang: "es",
          // Sin cuotas por ahora: habilitarlas obliga a decidir quién asume el
          // recargo y a propagar el número de cuotas hasta el cargo.
          installments: false,
          modal: true,
          paymentMethods: {
            tarjeta: true,
            yape: true,
            billetera: false,
            bancaMovil: false,
            agente: false,
            cuotealo: false,
          },
          paymentMethodsSort: ["tarjeta", "yape"],
        },
        appearance: {
          theme: "default",
          hiddenCulqiLogo: false,
          // Los métodos de pago salen como tarjetas horizontales arriba del
          // formulario, en vez de la columna lateral. Valores válidos:
          // sidebar | sliderTop | select.
          menuType: "sliderTop",
          // Sólo el verbo: Culqi le concatena el importe por su cuenta, así
          // que un "Pagar S/ 190.07" aquí sale como "Pagar S/ 190.07 S/ 190.07".
          buttonCardPayText: "Pagar",
          defaultStyle: {
            bannerColor: "#111111",
            buttonBackground: "#111111",
            menuColor: "#111111",
          },
        },
      });

      checkout.culqi = () => {
        const tokenId = checkout.token?.id;
        if (!tokenId) {
          setError(
            checkout.error?.user_message ||
              checkout.error?.merchant_message ||
              "No se pudo generar el token de pago"
          );
          return;
        }
        checkout.close?.();
        intentoRef.current = { tokenId, deviceFingerPrintId };
        void cobrar();
      };

      checkout.open();
    } catch (err) {
      cerrarOverlay();
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setPreparando(false);
    }
  };

  return (
    <div className="space-y-4">
      <PaymentProcessingOverlay visible={procesando} />

      <p className="text-xs text-[#111111]/50 leading-relaxed">
        {autenticando
          ? "Completa la verificación de seguridad de tu banco para terminar el pago. No cierres esta página."
          : "Paga con tarjeta de crédito o débito, o con Yape, a través de Culqi. El formulario se abre aquí mismo; no sales de esta página."}
      </p>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>
      )}

      <button
        type="button"
        onClick={iniciar}
        disabled={preparando || procesando || autenticando}
        className="w-full bg-[#1a1a2e] text-white text-xs font-medium tracking-wide py-3 hover:bg-[#2a2a4e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
      >
        {autenticando
          ? "Verificando con tu banco..."
          : preparando
            ? "Preparando pago..."
            : `Pagar ${formatPEN(total)} con Culqi`}
      </button>
    </div>
  );
}
