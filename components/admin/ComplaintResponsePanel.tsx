"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

export function ComplaintResponsePanel({
  complaintId,
  initialResponse,
  respondedAt,
}: {
  complaintId: string;
  initialResponse: string | null;
  respondedAt: string | null;
}) {
  const router = useRouter();
  const [response, setResponse] = useState(initialResponse ?? "");
  const [notify, setNotify] = useState(!respondedAt);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/reclamaciones/${complaintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response, notify }),
      });
      const payload = await res.json();

      if (!res.ok) {
        toast.error(payload.error ?? "No pudimos guardar la respuesta");
        return;
      }
      if (notify && !payload.notified) {
        // La respuesta quedó guardada pero el consumidor no se enteró: hay que
        // decirlo, porque el plazo legal corre igual.
        toast.warning("Respuesta guardada, pero el correo al consumidor no salió. Revisa Resend.");
      } else {
        toast.success(notify ? "Respuesta guardada y enviada al consumidor" : "Respuesta guardada");
      }
      router.refresh();
    } catch {
      toast.error("No pudimos conectar con el servidor");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="complaint-response"
          className="block text-[10px] font-medium text-[#111111]/60 uppercase tracking-[0.15em] mb-1.5"
        >
          Acciones adoptadas por el proveedor
        </label>
        <textarea
          id="complaint-response"
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          rows={8}
          required
          minLength={10}
          maxLength={5000}
          placeholder="Describe la respuesta que recibirá el consumidor: qué se revisó, qué se resolvió y en qué plazo."
          className="w-full px-3.5 py-2.5 bg-white border border-[#111111]/15 text-sm text-[#111111] placeholder:text-[#111111]/25 focus:outline-none focus:border-[#d4af37] transition-colors duration-200"
        />
        <p className="mt-1 text-[11px] text-[#111111]/35">
          {response.length}/5000 caracteres. Este texto se envía tal cual al consumidor.
        </p>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={notify}
          onChange={(e) => setNotify(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-[#d4af37]"
        />
        <span className="text-[13px] text-[#111111]/60 leading-relaxed">
          Enviar la respuesta por correo al consumidor. Desmárcalo solo si ya respondiste por otro
          canal y estás dejando constancia en la hoja.
        </span>
      </label>

      <Button type="submit" loading={saving} disabled={response.trim().length < 10}>
        {respondedAt ? "Actualizar respuesta" : "Registrar respuesta"}
      </Button>
    </form>
  );
}
