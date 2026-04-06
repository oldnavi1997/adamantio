import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const max_results = Number(searchParams.get("max_results") ?? "50");
  const next_cursor = searchParams.get("next_cursor") ?? undefined;

  try {
    const query = cloudinary.search
      .expression("folder:adamantio")
      .sort_by("created_at", "desc")
      .max_results(max_results);

    if (next_cursor) query.next_cursor(next_cursor);

    const result = await query.execute();

    const images = (result.resources as { secure_url: string; public_id: string; resource_type: string }[]).map(
      (r) => ({ url: r.secure_url, publicId: r.public_id, resourceType: r.resource_type })
    );

    return NextResponse.json({
      images,
      next_cursor: result.next_cursor ?? null,
    });
  } catch (err) {
    console.error("Cloudinary API error:", err);
    return NextResponse.json({ error: "Error al obtener imágenes" }, { status: 500 });
  }
}
