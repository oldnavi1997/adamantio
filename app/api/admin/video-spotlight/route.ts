import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { VIDEO_SPOTLIGHT_KEY, videoPosterUrl } from "@/lib/video-spotlight";
import { getVideoSpotlightConfig } from "@/lib/video-spotlight-server";

const schema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      video: z.string().url(),
      poster: z.string().optional(),
    })
  ),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const items = await getVideoSpotlightConfig();
  return NextResponse.json({ items });
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

  // Recalcular el póster en el server para robustez.
  const items = parsed.items.map((it) => ({
    productId: it.productId,
    video: it.video,
    poster: videoPosterUrl(it.video),
  }));

  await prisma.siteSetting.upsert({
    where: { key: VIDEO_SPOTLIGHT_KEY },
    create: { key: VIDEO_SPOTLIGHT_KEY, value: items },
    update: { value: items },
  });

  return NextResponse.json({ items });
}
