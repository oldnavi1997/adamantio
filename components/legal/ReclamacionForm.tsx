"use client";

import { useId, useState } from "react";
import { DOCUMENT_TYPES } from "@/lib/complaints";

const inputClass =
  "w-full px-3.5 py-2.5 bg-white border border-[#111111]/15 text-sm text-[#111111] placeholder:text-[#111111]/25 focus:outline-none focus:border-[#d4af37] transition-colors duration-200";

const labelClass =
  "block text-[10px] font-medium text-[#111111]/60 uppercase tracking-[0.15em] mb-1.5";

type Result = { code: string; dueAt: string; copySent: boolean };

function Field({
  label,
  htmlFor,
  required,
  hint,
  className = "",
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
        {required && <span className="text-[#d4af37]"> *</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-[#111111]/50">{hint}</p>}
    </div>
  );
}

function FormSection({
  step,
  title,
  description,
  children,
}: {
  step: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-t border-[#111111]/10 pt-8">
      <legend className="sr-only">{title}</legend>
      <div className="mb-5">
        <p className="text-[10px] text-[#d4af37] uppercase tracking-[0.3em] mb-2">{step}</p>
        <h3
          style={{ fontFamily: "var(--font-sans, sans-serif)" }}
          className="text-lg font-light text-[#111111] tracking-wide"
        >
          {title}
        </h3>
        {description && (
          <p className="mt-2 text-[13px] text-[#111111]/60 leading-relaxed">{description}</p>
        )}
      </div>
      {children}
    </fieldset>
  );
}

export function ReclamacionForm() {
  const id = useId();
  const f = (name: string) => `${id}-${name}`;

  const [isMinor, setIsMinor] = useState(false);
  const [type, setType] = useState<"RECLAMO" | "QUEJA">("RECLAMO");
  const [goodType, setGoodType] = useState<"PRODUCTO" | "SERVICIO">("PRODUCTO");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "").trim();
    const rawAmount = text("amount");

    try {
      const response = await fetch("/api/reclamaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: text("fullName"),
          documentType: text("documentType"),
          documentId: text("documentId"),
          phone: text("phone"),
          email: text("email"),
          department: text("department"),
          province: text("province"),
          district: text("district"),
          address: text("address"),
          reference: text("reference"),
          isMinor,
          guardianFullName: text("guardianFullName"),
          guardianDocType: text("guardianDocType") || undefined,
          guardianDocId: text("guardianDocId"),
          guardianPhone: text("guardianPhone"),
          goodType,
          orderNumber: text("orderNumber"),
          incidentAt: text("incidentAt"),
          amount: rawAmount ? Number(rawAmount) : undefined,
          goodDetail: text("goodDetail"),
          type,
          detail: text("detail"),
          request: text("request"),
          accepted: form.get("accepted") === "on",
          website: text("website"),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "No pudimos registrar tu reclamo.");
        return;
      }
      setResult(payload as Result);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div
        role="status"
        className="p-8 rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/5 space-y-4"
      >
        <p className="text-[10px] text-[#d4af37] uppercase tracking-[0.3em]">Reclamo registrado</p>
        <h3
          style={{ fontFamily: "var(--font-sans, sans-serif)" }}
          className="text-2xl font-light text-[#111111] tracking-wide"
        >
          Hoja N.º {result.code}
        </h3>
        <p className="text-[#111111]/70 text-[15px] leading-relaxed">
          Guarda este número como constancia de tu presentación. Te responderemos a más tardar el{" "}
          <strong className="text-[#111111]">{result.dueAt}</strong>, dentro del plazo de quince (15)
          días hábiles.
        </p>
        <p className="text-[#111111]/70 text-[15px] leading-relaxed">
          {result.copySent
            ? "Enviamos una copia de la hoja de reclamación al correo que registraste. Si no la ves, revisa tu carpeta de spam."
            : "No pudimos enviar la copia por correo en este momento, pero tu reclamo quedó registrado con el número de arriba. Escríbenos por WhatsApp citando ese número si necesitas la copia."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10" noValidate={false}>
      {/* 1. Consumidor */}
      <FormSection step="Paso 1" title="Identificación del consumidor reclamante">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombres y apellidos" htmlFor={f("fullName")} required className="sm:col-span-2">
            <input id={f("fullName")} name="fullName" required maxLength={120} className={inputClass} />
          </Field>

          <Field label="Tipo de documento" htmlFor={f("documentType")} required>
            <select id={f("documentType")} name="documentType" required defaultValue="DNI" className={inputClass}>
              {DOCUMENT_TYPES.map((doc) => (
                <option key={doc} value={doc}>
                  {doc}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Número de documento" htmlFor={f("documentId")} required>
            <input id={f("documentId")} name="documentId" required maxLength={20} className={inputClass} />
          </Field>

          <Field label="Celular" htmlFor={f("phone")} required>
            <input id={f("phone")} name="phone" type="tel" required maxLength={20} className={inputClass} />
          </Field>

          <Field
            label="Correo electrónico"
            htmlFor={f("email")}
            required
            hint="Aquí te enviaremos la copia de la hoja y la respuesta."
          >
            <input id={f("email")} name="email" type="email" required maxLength={120} className={inputClass} />
          </Field>

          <Field label="Departamento" htmlFor={f("department")} required>
            <input id={f("department")} name="department" required maxLength={60} className={inputClass} />
          </Field>

          <Field label="Provincia" htmlFor={f("province")} required>
            <input id={f("province")} name="province" required maxLength={60} className={inputClass} />
          </Field>

          <Field label="Distrito" htmlFor={f("district")} required>
            <input id={f("district")} name="district" required maxLength={60} className={inputClass} />
          </Field>

          <Field label="Dirección" htmlFor={f("address")} required>
            <input id={f("address")} name="address" required maxLength={200} className={inputClass} />
          </Field>

          <Field label="Referencia" htmlFor={f("reference")} className="sm:col-span-2">
            <input id={f("reference")} name="reference" maxLength={200} className={inputClass} />
          </Field>
        </div>

        <label className="mt-5 flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isMinor}
            onChange={(e) => setIsMinor(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[#d4af37]"
          />
          <span className="text-[13px] text-[#111111]/70 leading-relaxed">
            El consumidor reclamante es menor de edad. En ese caso el reglamento exige consignar los
            datos del padre o apoderado.
          </span>
        </label>

        {isMinor && (
          <div className="mt-5 p-5 rounded-lg bg-[#111111]/[0.03] border border-[#111111]/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombres y apellidos del apoderado" htmlFor={f("guardianFullName")} required className="sm:col-span-2">
              <input id={f("guardianFullName")} name="guardianFullName" required={isMinor} maxLength={120} className={inputClass} />
            </Field>
            <Field label="Tipo de documento" htmlFor={f("guardianDocType")} required>
              <select id={f("guardianDocType")} name="guardianDocType" required={isMinor} defaultValue="DNI" className={inputClass}>
                {DOCUMENT_TYPES.map((doc) => (
                  <option key={doc} value={doc}>
                    {doc}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Número de documento" htmlFor={f("guardianDocId")} required>
              <input id={f("guardianDocId")} name="guardianDocId" required={isMinor} maxLength={20} className={inputClass} />
            </Field>
            <Field label="Celular del apoderado" htmlFor={f("guardianPhone")} className="sm:col-span-2">
              <input id={f("guardianPhone")} name="guardianPhone" type="tel" maxLength={20} className={inputClass} />
            </Field>
          </div>
        )}
      </FormSection>

      {/* 2. Bien contratado */}
      <FormSection step="Paso 2" title="Identificación del bien contratado">
        <fieldset className="mb-5">
          <legend className={labelClass}>
            Tipo de consumo<span className="text-[#d4af37]"> *</span>
          </legend>
          <div className="flex gap-3">
            {(["PRODUCTO", "SERVICIO"] as const).map((option) => (
              <label
                key={option}
                className={`flex-1 px-4 py-3 border cursor-pointer text-sm transition-colors ${
                  goodType === option
                    ? "border-[#d4af37] bg-[#d4af37]/5 text-[#111111]"
                    : "border-[#111111]/15 bg-white text-[#111111]/70 hover:border-[#111111]/30"
                }`}
              >
                <input
                  type="radio"
                  name="goodTypeChoice"
                  value={option}
                  checked={goodType === option}
                  onChange={() => setGoodType(option)}
                  className="sr-only"
                />
                {option === "PRODUCTO" ? "Producto" : "Servicio"}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="N.º de pedido" htmlFor={f("orderNumber")}>
            <input id={f("orderNumber")} name="orderNumber" maxLength={60} className={inputClass} />
          </Field>
          <Field label="Fecha del incidente" htmlFor={f("incidentAt")}>
            <input id={f("incidentAt")} name="incidentAt" type="date" className={inputClass} />
          </Field>
          <Field label="Monto reclamado (S/)" htmlFor={f("amount")}>
            <input id={f("amount")} name="amount" type="number" min="0" step="0.01" className={inputClass} />
          </Field>
          <Field
            label="Descripción del producto o servicio"
            htmlFor={f("goodDetail")}
            required
            className="sm:col-span-3"
          >
            <textarea id={f("goodDetail")} name="goodDetail" required rows={3} maxLength={1500} className={inputClass} />
          </Field>
        </div>
      </FormSection>

      {/* 3. Detalle */}
      <FormSection step="Paso 3" title="Detalle de la reclamación y pedido del consumidor">
        <fieldset className="mb-5">
          <legend className={labelClass}>
            Tipo<span className="text-[#d4af37]"> *</span>
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(
              [
                {
                  value: "RECLAMO" as const,
                  title: "Reclamo",
                  description: "Disconformidad con el producto o servicio recibido.",
                },
                {
                  value: "QUEJA" as const,
                  title: "Queja",
                  description: "Malestar por la atención al público, no con el producto.",
                },
              ]
            ).map((option) => (
              <label
                key={option.value}
                className={`p-4 border cursor-pointer transition-colors ${
                  type === option.value
                    ? "border-[#d4af37] bg-[#d4af37]/5"
                    : "border-[#111111]/15 bg-white hover:border-[#111111]/30"
                }`}
              >
                <input
                  type="radio"
                  name="typeChoice"
                  value={option.value}
                  checked={type === option.value}
                  onChange={() => setType(option.value)}
                  className="sr-only"
                />
                <span className="block text-sm text-[#111111]">{option.title}</span>
                <span className="block mt-1 text-[12px] text-[#111111]/60 leading-relaxed">
                  {option.description}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-4">
          <Field
            label={type === "QUEJA" ? "Detalle de la queja" : "Detalle del reclamo"}
            htmlFor={f("detail")}
            required
          >
            <textarea id={f("detail")} name="detail" required rows={5} maxLength={3000} className={inputClass} />
          </Field>
          <Field
            label="Pedido del consumidor"
            htmlFor={f("request")}
            required
            hint="Qué solución esperas: cambio, devolución, reparación, disculpas, etc."
          >
            <textarea id={f("request")} name="request" required rows={3} maxLength={1500} className={inputClass} />
          </Field>
        </div>
      </FormSection>

      {/* Conformidad */}
      <div className="border-t border-[#111111]/10 pt-8 space-y-5">
        <div className="p-5 rounded-lg border border-[#d4af37]/30 bg-[#d4af37]/5 space-y-3">
          <p className="text-[13px] text-[#111111]/75 leading-relaxed">
            El proveedor debe dar respuesta al reclamo en un plazo no mayor a{" "}
            <strong className="text-[#111111]">quince (15) días hábiles</strong>, ampliable por
            quince (15) días hábiles adicionales previa comunicación al consumidor.
          </p>
          <p className="text-[13px] text-[#111111]/75 leading-relaxed">
            La formulación del reclamo no impide acudir a otras vías de solución de controversias ni
            es requisito previo para interponer una denuncia ante el Indecopi.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" name="accepted" required className="mt-0.5 w-4 h-4 accent-[#d4af37]" />
          <span className="text-[13px] text-[#111111]/70 leading-relaxed">
            Declaro que la información consignada es veraz y que me encuentro conforme con los
            términos de mi reclamo o queja. Autorizo que Adamantio me contacte por correo o teléfono
            para atenderlo, conforme a la{" "}
            <a href="/politica-de-privacidad" className="text-[#d4af37] hover:underline">
              política de privacidad
            </a>
            .<span className="text-[#d4af37]"> *</span>
          </span>
        </label>

        {/* Trampa antispam: invisible para personas, irresistible para bots. */}
        <div aria-hidden="true" className="hidden">
          <label htmlFor={f("website")}>No completar</label>
          <input id={f("website")} name="website" tabIndex={-1} autoComplete="off" />
        </div>

        {error && (
          <p role="alert" className="text-[13px] text-red-600 leading-relaxed">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center bg-[#111111] text-white px-7 py-3.5 text-[11px] font-medium uppercase tracking-[0.12em] transition-all duration-300 hover:bg-[#0a0a0a] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2"
        >
          {submitting && (
            <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {submitting ? "Enviando" : "Enviar reclamo"}
        </button>
      </div>
    </form>
  );
}
