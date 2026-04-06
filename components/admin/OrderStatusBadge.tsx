import { Badge } from "@/components/ui/Badge";
import { OrderStatus, PaymentStatus } from "@/app/generated/prisma/client";

const orderStatusConfig: Record<OrderStatus, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }> = {
  PENDING:   { label: "Pendiente", variant: "warning" },
  PAID:      { label: "Pagado",    variant: "success" },
  SHIPPED:   { label: "Enviado",   variant: "info" },
  CANCELLED: { label: "Cancelado", variant: "danger" },
};

const paymentStatusConfig: Record<PaymentStatus, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }> = {
  PENDING:  { label: "Pendiente", variant: "warning" },
  APPROVED: { label: "Aprobado",  variant: "success" },
  REJECTED: { label: "Rechazado", variant: "danger" },
  CANCELLED: { label: "Cancelado", variant: "danger" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = orderStatusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = paymentStatusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
