"use client";

import { useEffect, useRef, useState } from "react";
import { formatPEN } from "@/lib/utils";
import { PaymentProcessingOverlay } from "@/components/checkout/PaymentProcessingOverlay";
import { cargarCss, cargarScript } from "@/components/checkout/cargar-recursos";

interface IzipayFormProps {
  total: number;
  /** La orden ya existe: Adamantio la crea al pasar del formulario al pago. */
  orderId: string;
  onPaymentResult: (result: {
    status: string;
    paymentId?: string;
    statusDetail?: string;
    error?: string;
  }) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const window: any;

const CONTENEDOR = "izipay-form";

/** Corta el overlay si la pasarela nunca responde, para no dejar la página muerta. */
const LIMITE_PROCESANDO_MS = 4 * 60 * 1000;

/**
 * Pago con Izipay (pasarela Lyra/Krypton V4) en formulario embebido.
 *
 * El cargo lo ejecuta el propio formulario de Izipay. Nosotros pedimos un
 * `formToken` al servidor, montamos el form, y cuando `KR.onSubmit` nos entrega
 * el resultado lo mandamos a `/api/payments/izipay/confirm`, que valida la firma
 * antes de aprobar nada. `onSubmit` devuelve `false` para que Krypton no
 * redirija: el checkout resuelve todo en la misma página.
 *
 * La URL de notificación (IPN) hace el mismo trabajo en paralelo, así que si el
 * comprador cierra la pestaña el pedido se aprueba igual.
 */
export function IzipayForm({ total, orderId, onPaymentResult }: IzipayFormProps) {
  const [preparando, setPreparando] = useState(false);
  const [formMontado, setFormMontado] = useState(false);
  const [procesando, setProcesando] = useState(false);
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

  const abrirOverlay = () => {
    if (procesandoRef.current) return false; // ya hay un cobro en curso
    procesandoRef.current = true;
    setProcesando(true);
    temporizadorRef.current = setTimeout(() => {
      cerrarOverlay();
      setError(
        "El pago está tardando más de lo normal. No vuelvas a intentarlo todavía: " +
          "si el cobro se completó te llegará el correo de confirmación."
      );
    }, LIMITE_PROCESANDO_MS);
    return true;
  };

  const cerrarOverlay = () => {
    procesandoRef.current = false;
    setProcesando(false);
    if (temporizadorRef.current) {
      clearTimeout(temporizadorRef.current);
      temporizadorRef.current = null;
    }
  };

  useEffect(() => () => {
    if (temporizadorRef.current) clearTimeout(temporizadorRef.current);
  }, []);

  /**
   * El desafío 3D Secure lo pinta Krypton en un popin propio sobre la página.
   * Si nuestro overlay siguiera encima, el comprador no podría autenticarse y el
   * pago quedaría colgado — así que en cuanto aparece una capa de Krypton nos
   * apartamos y le devolvemos la página. Krypton muestra su propio indicador de
   * carga durante ese tramo.
   */
  useEffect(() => {
    if (!procesando) return;
    const hayCapaDeKrypton = () =>
      Array.from(document.querySelectorAll<HTMLElement>("[class*='kr-']")).some((el) => {
        if (el.closest(`#${CONTENEDOR}`)) return false; // el formulario embebido no cuenta
        const s = getComputedStyle(el);
        return (
          (s.position === "fixed" || s.position === "absolute") &&
          s.display !== "none" &&
          s.visibility !== "hidden" &&
          el.getBoundingClientRect().height > 120
        );
      });

    if (hayCapaDeKrypton()) {
      setProcesando(false); // se aparta, pero `procesandoRef` sigue bloqueando el doble pago
      return;
    }
    const observador = new MutationObserver(() => {
      if (hayCapaDeKrypton()) setProcesando(false);
    });
    observador.observe(document.body, { childList: true, subtree: true, attributes: true });
    return () => observador.disconnect();
  }, [procesando]);

  const iniciar = async () => {
    setError(null);
    setPreparando(true);
    try {
      const res = await fetch("/api/payments/izipay/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo iniciar el pago");

      cargarCss(data.cssUrl);
      await cargarScript(
        data.jsUrl,
        {
          // Krypton tiene una lista cerrada de idiomas y "es-PE" no está en ella;
          // el propio ejemplo de Izipay usa el castellano de España.
          "kr-language": "es-ES",
          "kr-public-key": data.publicKey,
        },
        "Izipay"
      );
      await cargarScript(data.themeJsUrl, {}, "Izipay");

      const KR = window.KR;
      if (!KR) throw new Error("El formulario de Izipay no se cargó");

      await KR.setFormConfig({ formToken: data.formToken, "kr-language": "es-ES" });

      // ── Ciclo de vida: abre el overlay al empezar el cobro, lo cierra sólo
      //    con una respuesta (aprobado, rechazado, error o 3DS abortado).
      KR.button?.onClick?.(() => {
        abrirOverlay();
      });

      KR.onError?.((err: { errorMessage?: string; detailedErrorMessage?: string }) => {
        cerrarOverlay();
        setError(err?.detailedErrorMessage || err?.errorMessage || "El pago no se pudo procesar");
      });

      KR.on3dSecureAbort?.(() => {
        cerrarOverlay();
        setError("Se canceló la verificación de seguridad. Puedes intentarlo de nuevo.");
      });

      KR.onPopinClosed?.(() => cerrarOverlay());

      /**
       * OJO: esta función NO puede ser `async`.
       *
       * Krypton sólo cancela su redirección si el callback devuelve `false`
       * síncrono o una promesa *rechazada*. Una función `async` devuelve una
       * promesa *cumplida* con el valor `false`, que Krypton interpreta como
       * "adelante": redirige, y el comprador se queda con el overlay colgado
       * mientras la página navega por debajo. El trabajo asíncrono va aparte.
       */
      const confirmar = async (paymentData: { rawClientAnswer: string; hash: string }) => {
        try {
          const conf = await fetch("/api/payments/izipay/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              krAnswer: paymentData.rawClientAnswer,
              krHash: paymentData.hash,
            }),
          });
          const resultado = await conf.json();
          if (!conf.ok) {
            onPaymentResultRef.current({
              status: "error",
              error: resultado.error || "No se pudo confirmar el pago",
            });
          } else {
            onPaymentResultRef.current({
              status: resultado.status,
              paymentId: resultado.paymentId,
              statusDetail: resultado.statusDetail,
            });
          }
        } catch {
          // El cobro pudo haberse hecho: el IPN lo resolverá del lado servidor.
          onPaymentResultRef.current({
            status: "in_process",
            statusDetail: "Estamos confirmando tu pago. Te avisaremos por correo.",
          });
        } finally {
          // Se cierra al final: el resultado ya está en pantalla o se redirigió.
          cerrarOverlay();
        }
      };

      KR.onSubmit((paymentData: { rawClientAnswer: string; hash: string }) => {
        // Con 3DS el overlay se apartó solo; al volver aquí ya se está cobrando.
        procesandoRef.current = true;
        setProcesando(true);
        void confirmar(paymentData);
        // Síncrono y a secas: es lo único que frena la redirección de Krypton.
        return false;
      });

      const { result } = await KR.attachForm(`#${CONTENEDOR}`);
      await KR.showForm(result.formId);
      setFormMontado(true);
    } catch (err: unknown) {
      cerrarOverlay();
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setPreparando(false);
    }
  };

  return (
    <div className="space-y-4">
      <PaymentProcessingOverlay visible={procesando} />

      {!formMontado && (
        <p className="text-xs text-[#111111]/50 leading-relaxed">
          Paga con tarjeta de crédito o débito a través de Izipay. El formulario se abre aquí
          mismo; no sales de esta página.
        </p>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>
      )}

      {/*
        Krypton monta el formulario aquí. El contenedor está siempre en el DOM y
        visible: con `display:none` el cliente mide 0px de ancho y el formulario
        sale roto. Vacío no ocupa nada, así que no estorba.
      */}
      <div id={CONTENEDOR} />

      {!formMontado && (
        <button
          type="button"
          onClick={iniciar}
          disabled={preparando}
          className="w-full bg-[#1a1a2e] text-white text-xs font-medium tracking-wide py-3 hover:bg-[#2a2a4e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
        >
          {preparando ? "Preparando pago..." : `Pagar ${formatPEN(total)} con Izipay`}
        </button>
      )}
    </div>
  );
}
