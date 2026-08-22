import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { sendComplaintResponse } from "@/lib/email";

const respondSchema = z.object({
  response: z.string().trim().min(10, { error: "La respuesta debe tener al menos 10 caracteres." }).max(5000),
  // Registrar sin notificar sirve cuando ya se respondió por otro canal y solo
  // se está dejando constancia en la hoja.
  notify: z.boolean().default(true),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const data = respondSchema.parse(body);

    const existing = await prisma.complaint.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Hoja no encontrada" }, { status: 404 });
    }

    await prisma.complaint.update({
      where: { id },
      data: {
        response: data.response,
        status: "RESPONDIDO",
        // La fecha de respuesta acredita el cumplimiento del plazo legal, así
        // que se fija la primera vez y no se pisa al corregir el texto.
        respondedAt: existing.respondedAt ?? new Date(),
      },
    });

    const notified = data.notify ? await sendComplaintResponse(id) : false;

    return NextResponse.json({ ok: true, notified });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Revisa la respuesta." },
        { status: 400 }
      );
    }
    console.error(`PATCH /api/admin/reclamaciones/${id}:`, error);
    return NextResponse.json({ error: "No pudimos guardar la respuesta." }, { status: 500 });
  }
}
