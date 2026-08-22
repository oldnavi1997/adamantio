import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendComplaintEmails } from "@/lib/email";
import {
  DOCUMENT_TYPES,
  RESPONSE_BUSINESS_DAYS,
  addBusinessDays,
  complaintCode,
  formatLimaDate,
} from "@/lib/complaints";

const trimmed = (min: number, max: number) => z.string().trim().min(min).max(max);

const complaintSchema = z
  .object({
    // 1. Identificación del consumidor reclamante
    fullName: trimmed(3, 120),
    documentType: z.enum(DOCUMENT_TYPES),
    documentId: trimmed(6, 20),
    phone: trimmed(6, 20),
    email: z.string().trim().toLowerCase().email().max(120),
    department: trimmed(2, 60),
    province: trimmed(2, 60),
    district: trimmed(2, 60),
    address: trimmed(5, 200),
    reference: trimmed(0, 200).optional().or(z.literal("")),

    isMinor: z.boolean().default(false),
    guardianFullName: trimmed(0, 120).optional().or(z.literal("")),
    guardianDocType: z.enum(DOCUMENT_TYPES).optional(),
    guardianDocId: trimmed(0, 20).optional().or(z.literal("")),
    guardianPhone: trimmed(0, 20).optional().or(z.literal("")),

    // 2. Identificación del bien contratado
    goodType: z.enum(["PRODUCTO", "SERVICIO"]),
    orderNumber: trimmed(0, 60).optional().or(z.literal("")),
    incidentAt: z.string().trim().optional().or(z.literal("")),
    amount: z.number().nonnegative().max(9_999_999).optional(),
    goodDetail: trimmed(5, 1500),

    // 3. Detalle de la reclamación
    type: z.enum(["RECLAMO", "QUEJA"]),
    detail: trimmed(10, 3000),
    request: trimmed(10, 1500),

    // 4. Conformidad del consumidor
    accepted: z.literal(true),

    // Trampa antispam: los bots rellenan todo lo que encuentran.
    website: z.string().max(0).optional(),
  })
  // Si el reclamante es menor de edad el reglamento exige consignar los datos
  // del padre o apoderado, así que dejan de ser opcionales.
  .refine((d) => !d.isMinor || (d.guardianFullName && d.guardianDocType && d.guardianDocId), {
    message: "Si el consumidor es menor de edad, debes consignar los datos del padre o apoderado",
    path: ["guardianFullName"],
  });

const emptyToNull = (value: string | undefined) => (value && value.length > 0 ? value : null);

/**
 * Zod redacta sus mensajes en inglés y este formulario lo llena un consumidor,
 * así que el error que vuelve a pantalla se traduce por campo. El navegador ya
 * bloquea la mayoría con `required`; esto cubre el resto.
 */
const FIELD_MESSAGES: Record<string, string> = {
  fullName: "Ingresa tus nombres y apellidos.",
  documentType: "Elige un tipo de documento válido.",
  documentId: "Ingresa tu número de documento.",
  phone: "Ingresa un celular de contacto.",
  email: "Ingresa un correo electrónico válido: ahí te enviamos la copia de la hoja.",
  department: "Ingresa tu departamento.",
  province: "Ingresa tu provincia.",
  district: "Ingresa tu distrito.",
  address: "Ingresa tu dirección.",
  reference: "La referencia es demasiado larga.",
  guardianFullName: "Ingresa los nombres y apellidos del padre o apoderado.",
  guardianDocType: "Elige el tipo de documento del padre o apoderado.",
  guardianDocId: "Ingresa el número de documento del padre o apoderado.",
  goodType: "Indica si tu reclamo es por un producto o por un servicio.",
  orderNumber: "El número de pedido es demasiado largo.",
  amount: "El monto reclamado debe ser un número válido.",
  goodDetail: "Describe el producto o servicio contratado.",
  type: "Indica si se trata de un reclamo o de una queja.",
  detail: "Cuéntanos el detalle de tu reclamo o queja (mínimo 10 caracteres).",
  request: "Indica qué solución esperas (mínimo 10 caracteres).",
  accepted: "Debes declarar tu conformidad con los términos del reclamo o queja.",
};

function humanMessage(issue: z.core.$ZodIssue): string {
  if (issue.code === "custom") return issue.message;
  return (
    FIELD_MESSAGES[String(issue.path[0] ?? "")] ??
    "Revisa los datos del formulario e inténtalo de nuevo."
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = complaintSchema.parse(body);

    const now = new Date();
    const incidentAt = data.incidentAt ? new Date(data.incidentAt) : null;
    if (incidentAt && Number.isNaN(incidentAt.getTime())) {
      return NextResponse.json({ error: "La fecha del incidente no es válida" }, { status: 400 });
    }

    const complaint = await prisma.complaint.create({
      data: {
        fullName: data.fullName,
        documentType: data.documentType,
        documentId: data.documentId,
        phone: data.phone,
        email: data.email,
        department: data.department,
        province: data.province,
        district: data.district,
        address: data.address,
        reference: emptyToNull(data.reference),

        isMinor: data.isMinor,
        guardianFullName: data.isMinor ? emptyToNull(data.guardianFullName) : null,
        guardianDocType: data.isMinor ? (data.guardianDocType ?? null) : null,
        guardianDocId: data.isMinor ? emptyToNull(data.guardianDocId) : null,
        guardianPhone: data.isMinor ? emptyToNull(data.guardianPhone) : null,

        goodType: data.goodType,
        orderNumber: emptyToNull(data.orderNumber),
        incidentAt,
        amount: data.amount ?? null,
        goodDetail: data.goodDetail,

        type: data.type,
        detail: data.detail,
        request: data.request,

        dueAt: addBusinessDays(now, RESPONSE_BUSINESS_DAYS),
      },
    });

    // La copia al consumidor es una obligación del reglamento, pero la hoja ya
    // quedó registrada: si Resend falla se responde igual con el correlativo y
    // se avisa en pantalla, en vez de perder el reclamo.
    const copySent = await sendComplaintEmails(complaint.id);
    if (copySent) {
      await prisma.complaint.update({
        where: { id: complaint.id },
        data: { copySentAt: new Date() },
      });
    }

    return NextResponse.json(
      {
        code: complaintCode(complaint.number, complaint.createdAt),
        dueAt: formatLimaDate(complaint.dueAt),
        copySent,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issue = error.issues[0];
      return NextResponse.json(
        { error: issue ? humanMessage(issue) : "Revisa los datos del formulario." },
        { status: 400 }
      );
    }
    console.error("POST /api/reclamaciones:", error);
    return NextResponse.json(
      { error: "No pudimos registrar tu reclamo. Inténtalo de nuevo en unos minutos." },
      { status: 500 }
    );
  }
}
