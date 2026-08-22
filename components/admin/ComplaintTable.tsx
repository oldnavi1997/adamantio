import Link from "next/link";
import { Eye } from "lucide-react";
import { ComplaintStatus, ComplaintType } from "@/app/generated/prisma/client";
import { ComplaintDueBadge, ComplaintStatusBadge, ComplaintTypeBadge } from "./ComplaintBadges";

export interface ComplaintRow {
  id: string;
  code: string;
  fullName: string;
  email: string;
  type: ComplaintType;
  status: ComplaintStatus;
  createdAt: string;
  daysLeft: number;
}

export function ComplaintTable({ complaints }: { complaints: ComplaintRow[] }) {
  if (complaints.length === 0) {
    return (
      <div className="text-center py-16 text-[#111111]/30">
        <p className="text-sm font-light" style={{ fontFamily: "var(--font-sans, sans-serif)" }}>
          No hay reclamos en esta vista
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="px-5 py-4 border-b border-[#111111]/6">
        <p className="text-[11px] text-[#111111]/40 uppercase tracking-[0.2em]">
          {complaints.length} {complaints.length === 1 ? "hoja" : "hojas"}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#111111]/6">
              {["Hoja", "Consumidor", "Tipo", "Plazo", "Estado", "Fecha", ""].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className={`py-3 px-4 text-[11px] font-medium text-[#111111]/40 uppercase tracking-[0.2em] ${
                    h === "Tipo" || h === "Plazo" || h === "Estado"
                      ? "text-center"
                      : h === ""
                        ? ""
                        : "text-left"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {complaints.map((complaint) => (
              <tr
                key={complaint.id}
                className="border-b border-[#111111]/4 hover:bg-[#f8f7f4]/60 transition-[background-color] duration-150"
              >
                <td className="py-3.5 px-4 font-mono text-xs text-[#111111]/60 tabular-nums whitespace-nowrap">
                  {complaint.code}
                </td>
                <td className="py-3.5 px-4">
                  <p className="font-medium text-[#111111] text-sm">{complaint.fullName}</p>
                  <p className="text-xs text-[#111111]/35 mt-0.5">{complaint.email}</p>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <ComplaintTypeBadge type={complaint.type} />
                </td>
                <td className="py-3.5 px-4 text-center">
                  <ComplaintDueBadge daysLeft={complaint.daysLeft} status={complaint.status} />
                </td>
                <td className="py-3.5 px-4 text-center">
                  <ComplaintStatusBadge status={complaint.status} />
                </td>
                <td className="py-3.5 px-4 text-xs text-[#111111]/40 tabular-nums whitespace-nowrap">
                  {complaint.createdAt}
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex justify-end">
                    <Link
                      href={`/admin/reclamaciones/${complaint.id}`}
                      className="p-1.5 text-[#111111]/30 hover:text-[#111111] hover:bg-[#f8f7f4] transition-[color,background-color] duration-150 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]/20"
                      aria-label={`Ver hoja ${complaint.code}`}
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
