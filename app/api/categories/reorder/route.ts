import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const items: { id: string; sortOrder: number }[] = await req.json();
    await Promise.all(
      items.map(({ id, sortOrder }) =>
        prisma.category.update({ where: { id }, data: { sortOrder } })
      )
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error al guardar el orden" }, { status: 500 });
  }
}
