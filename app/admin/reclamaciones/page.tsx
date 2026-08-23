import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ComplaintTable, type ComplaintRow } from "@/components/admin/ComplaintTable";
import { complaintCode, daysUntil } from "@/lib/complaints";
import { cn } from "@/lib/utils";

export const metadata = { title: "Reclamaciones | Admin" };

const FILTERS = [
  { key: "pendientes", label: "Pendientes" },
  { key: "respondidos", label: "Respondidos" },
  { key: "todos", label: "Todos" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function whereFor(filter: FilterKey) {
  if (filter === "pendientes") return { status: "PENDIENTE" as const };
  if (filter === "respondidos") return { status: "RESPONDIDO" as const };
  return {};
}

export default async function AdminComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const filter: FilterKey = FILTERS.some((f) => f.key === estado)
    ? (estado as FilterKey)
    : "pendientes";

  const [raw, pendingCount, respondedCount, overdueCount] = await Promise.all([
    prisma.complaint.findMany({
      where: whereFor(filter),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        number: true,
        fullName: true,
        email: true,
        type: true,
        status: true,
        createdAt: true,
        dueAt: true,
      },
    }),
    prisma.complaint.count({ where: { status: "PENDIENTE" } }),
    prisma.complaint.count({ where: { status: "RESPONDIDO" } }),
    prisma.complaint.count({ where: { status: "PENDIENTE", dueAt: { lt: new Date() } } }),
  ]);

  // Fecha y días restantes se resuelven aquí: la tabla los recibe ya formateados
  // para que servidor y cliente rendericen lo mismo.
  const complaints: ComplaintRow[] = raw.map((complaint) => ({
    id: complaint.id,
    code: complaintCode(complaint.number, complaint.createdAt),
    fullName: complaint.fullName,
    email: complaint.email,
    type: complaint.type,
    status: complaint.status,
    createdAt: complaint.createdAt.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "America/Lima",
    }),
    daysLeft: daysUntil(complaint.dueAt),
  }));

  const counts: Record<FilterKey, number> = {
    pendientes: pendingCount,
    respondidos: respondedCount,
    todos: pendingCount + respondedCount,
  };

  return (
    <div>
      <div className="mb-8">
        <p className="text-[9px] font-medium text-[#d4af37] uppercase tracking-[0.3em] mb-2">
          Gestión
        </p>
        <h1
          className="text-2xl font-light text-[#111111]"
          style={{ fontFamily: "var(--font-sans, sans-serif)" }}
        >
          Libro de Reclamaciones
        </h1>
        <p className="mt-2 text-xs text-[#111111]/40 leading-relaxed max-w-xl">
          Cada hoja debe responderse dentro de quince (15) días hábiles. La columna
          &laquo;Plazo&raquo; cuenta los días que faltan para el vencimiento.
        </p>
      </div>

      {overdueCount > 0 && (
        <div
          role="alert"
          className="mb-6 px-5 py-4 bg-red-50 border border-red-200/60 text-[13px] text-red-700"
        >
          {overdueCount === 1
            ? "Hay 1 reclamo con el plazo legal de respuesta vencido."
            : `Hay ${overdueCount} reclamos con el plazo legal de respuesta vencido.`}
        </div>
      )}

      <div className="flex gap-1 mb-4" role="tablist" aria-label="Filtrar reclamos">
        {FILTERS.map(({ key, label }) => (
          <Link
            key={key}
            href={`/admin/reclamaciones?estado=${key}`}
            role="tab"
            aria-selected={filter === key}
            className={cn(
              "px-4 py-2 text-[11px] font-medium uppercase tracking-[0.15em] border transition-[background-color,border-color,color] duration-200",
              filter === key
                ? "bg-[#111111] text-white border-[#111111]"
                : "bg-white text-[#111111]/50 border-[#111111]/10 hover:text-[#111111] hover:border-[#111111]/25"
            )}
          >
            {label}
            <span className="ml-2 tabular-nums opacity-60">{counts[key]}</span>
          </Link>
        ))}
      </div>

      <div className="bg-white border border-[#111111]/6">
        <ComplaintTable complaints={complaints} />
      </div>
    </div>
  );
}
