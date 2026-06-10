import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { ENGRAVING_SAMPLES_KEY, getGlobalEngravingSamples } from "@/lib/engraving";

const schema = z.object({ images: z.array(z.string().url()) });

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const images = await getGlobalEngravingSamples();
  return NextResponse.json({ images });
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let parsed;
  try {
    parsed = schema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  await prisma.siteSetting.upsert({
    where: { key: ENGRAVING_SAMPLES_KEY },
    create: { key: ENGRAVING_SAMPLES_KEY, value: parsed.images },
    update: { value: parsed.images },
  });

  return NextResponse.json({ images: parsed.images });
}
