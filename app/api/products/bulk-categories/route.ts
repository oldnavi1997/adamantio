import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const bulkSchema = z.object({
  productIds: z.array(z.string()).min(1),
  categoryIds: z.array(z.string()).min(1),
  mode: z.enum(["add", "set", "remove"]),
  primaryCategoryId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { productIds, categoryIds, mode, primaryCategoryId } = bulkSchema.parse(body);

    const categoryConnect = categoryIds.map((id) => ({ id }));

    await prisma.$transaction(
      productIds.map((id) =>
        prisma.product.update({
          where: { id },
          data: {
            categories:
              mode === "add"
                ? { connect: categoryConnect }
                : mode === "set"
                ? { set: categoryConnect }
                : { disconnect: categoryConnect },
            ...(primaryCategoryId ? { primaryCategoryId } : {}),
          },
        })
      )
    );

    return NextResponse.json({ success: true, updated: productIds.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
