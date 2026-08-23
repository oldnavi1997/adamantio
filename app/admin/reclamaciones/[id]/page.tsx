import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPEN } from "@/lib/utils";
import { complaintCode, daysUntil, formatLimaDate, formatLimaDateTime } from "@/lib/complaints";
import {
  ComplaintDueBadge,
  ComplaintStatusBadge,
  ComplaintTypeBadge,
} from "@/components/admin/ComplaintBadges";
import { ComplaintResponsePanel } from "@/components/admin/ComplaintResponsePanel";

export const metadata = { title: "Hoja de reclamación | Admin" };

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-[#111111]/6">
      <div className="px-5 py-4 border-b border-[#111111]/6">
        <h2 className="text-[11px] font-medium text-[#111111]/50 uppercase tracking-[0.2em]">
          {title}
        </h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 py-2 border-b border-[#111111]/4 last:border-0">
      <dt className="text-[11px] text-[#111111]/40 uppercase tracking-[0.12em] pt-0.5">{label}</dt>
      <dd className="text-sm text-[#111111] whitespace-pre-wrap break-words">{value}</dd>
    </div>
  );
}

export default async function AdminComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) notFound();

  const code = complaintCode(complaint.number, complaint.createdAt);
  const label = complaint.type === "QUEJA" ? "queja" : "reclamo";

  return (
    <div className="space-y-6">
      <Link
        href="/admin/reclamaciones"
        className="inline-flex items-center gap-2 text-[11px] text-[#111111]/40 hover:text-[#111111] uppercase tracking-[0.15em] transition-[color] duration-200"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Reclamaciones
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[9px] font-medium text-[#d4af37] uppercase tracking-[0.3em] mb-2">
            Hoja de reclamación
          </p>
          <h1
            className="text-2xl font-light text-[#111111] font-mono tabular-nums"
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
          >
            {code}
          </h1>
          <p className="text-xs text-[#111111]/40 mt-1.5">
            Presentada el {formatLimaDateTime(complaint.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ComplaintTypeBadge type={complaint.type} />
          <ComplaintDueBadge daysLeft={daysUntil(complaint.dueAt)} status={complaint.status} />
          <ComplaintStatusBadge status={complaint.status} />
        </div>
      </div>

      <div
        className={`px-5 py-4 border text-[13px] leading-relaxed ${
          complaint.status === "RESPONDIDO"
            ? "bg-emerald-50 border-emerald-200/60 text-emerald-800"
            : daysUntil(complaint.dueAt) < 0
              ? "bg-red-50 border-red-200/60 text-red-700"
              : "bg-amber-50 border-amber-200/60 text-amber-800"
        }`}
      >
        {complaint.status === "RESPONDIDO" && complaint.respondedAt
          ? `Respondida el ${formatLimaDate(complaint.respondedAt)}.`
          : daysUntil(complaint.dueAt) < 0
            ? `El plazo legal venció el ${formatLimaDate(complaint.dueAt)}. Responde cuanto antes.`
            : `Plazo legal de respuesta: hasta el ${formatLimaDate(complaint.dueAt)}.`}
        {!complaint.copySentAt && (
          <> La copia automática al consumidor no llegó a enviarse, confírmalo por otro canal.</>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="1. Identificación del consumidor">
          <dl>
            <Row label="Nombre" value={complaint.fullName} />
            <Row label="Documento" value={`${complaint.documentType} ${complaint.documentId}`} />
            <Row
              label="Celular"
              value={
                <a href={`tel:${complaint.phone}`} className="text-[#d4af37] hover:underline">
                  {complaint.phone}
                </a>
              }
            />
            <Row
              label="Correo"
              value={
                <a href={`mailto:${complaint.email}`} className="text-[#d4af37] hover:underline">
                  {complaint.email}
                </a>
              }
            />
            <Row label="Dirección" value={complaint.address} />
            <Row
              label="Ubicación"
              value={`${complaint.district}, ${complaint.province}, ${complaint.department}`}
            />
            <Row label="Referencia" value={complaint.reference} />
            {complaint.isMinor && (
              <>
                <Row label="Menor de edad" value="Sí" />
                <Row label="Apoderado" value={complaint.guardianFullName} />
                <Row
                  label="Doc. apoderado"
                  value={
                    complaint.guardianDocType && complaint.guardianDocId
                      ? `${complaint.guardianDocType} ${complaint.guardianDocId}`
                      : null
                  }
                />
                <Row label="Cel. apoderado" value={complaint.guardianPhone} />
              </>
            )}
          </dl>
        </Card>

        <Card title="2. Bien contratado">
          <dl>
            <Row
              label="Tipo de consumo"
              value={complaint.goodType === "SERVICIO" ? "Servicio" : "Producto"}
            />
            <Row label="N.º de pedido" value={complaint.orderNumber} />
            <Row
              label="Fecha incidente"
              value={complaint.incidentAt ? formatLimaDate(complaint.incidentAt) : null}
            />
            <Row
              label="Monto reclamado"
              value={complaint.amount ? formatPEN(Number(complaint.amount)) : null}
            />
            <Row label="Descripción" value={complaint.goodDetail} />
          </dl>
        </Card>
      </div>

      <Card title={`3. Detalle de la ${label} y pedido del consumidor`}>
        <dl>
          <Row label={`Detalle de la ${label}`} value={complaint.detail} />
          <Row label="Pedido" value={complaint.request} />
        </dl>
      </Card>

      <Card title="4. Respuesta del proveedor">
        <ComplaintResponsePanel
          complaintId={complaint.id}
          initialResponse={complaint.response}
          respondedAt={complaint.respondedAt ? complaint.respondedAt.toISOString() : null}
        />
      </Card>
    </div>
  );
}
