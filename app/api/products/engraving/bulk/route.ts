import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const schema = z.object({
  engravingEnabled: z.boolean(),
  productIds: z.array(z.string()).min(1),
});

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { engravingEnabled, productIds } = schema.parse(await request.json());
  const { count } = await prisma.product.updateMany({
    where: { id: { in: productIds } },
    data: { engravingEnabled },
  });
  return NextResponse.json({ count });
}
