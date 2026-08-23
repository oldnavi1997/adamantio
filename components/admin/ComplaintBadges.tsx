import { Badge } from "@/components/ui/Badge";
import { ComplaintStatus, ComplaintType } from "@/app/generated/prisma/client";

export function ComplaintTypeBadge({ type }: { type: ComplaintType }) {
  return (
    <Badge variant={type === "QUEJA" ? "info" : "default"}>
      {type === "QUEJA" ? "Queja" : "Reclamo"}
    </Badge>
  );
}

export function ComplaintStatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <Badge variant={status === "RESPONDIDO" ? "success" : "warning"}>
      {status === "RESPONDIDO" ? "Respondido" : "Pendiente"}
    </Badge>
  );
}

/**
 * Cuánto queda del plazo legal de respuesta. `daysLeft` se calcula en el
 * servidor y llega como prop: hacerlo aquí con `new Date()` daría un valor
 * distinto en cliente y rompería la hidratación.
 */
export function ComplaintDueBadge({
  daysLeft,
  status,
}: {
  daysLeft: number;
  status: ComplaintStatus;
}) {
  if (status === "RESPONDIDO") {
    return <span className="text-xs text-[#111111]/30">—</span>;
  }
  if (daysLeft < 0) {
    return <Badge variant="danger">Vencido</Badge>;
  }
  if (daysLeft === 0) {
    return <Badge variant="danger">Vence hoy</Badge>;
  }
  return (
    <Badge variant={daysLeft <= 3 ? "warning" : "default"}>
      {daysLeft} {daysLeft === 1 ? "día" : "días"}
    </Badge>
  );
}
