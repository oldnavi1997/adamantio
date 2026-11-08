import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { CategoryRuleError } from "@/lib/category-tree";

/**
 * `null` si quien llama es ADMIN; si no, la respuesta que hay que devolver.
 * 401 sin sesión, 403 con sesión de cliente.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  return null;
}

export async function isAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return session?.user.role === "ADMIN";
}

/** Traduce los errores del módulo de categorías a una respuesta con el mismo formato `{ error }`. */
export function respuestaDeError(error: unknown, contexto: string): NextResponse {
  if (error instanceof CategoryRuleError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? "Datos inválidos", issues: error.issues },
      { status: 400 }
    );
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: "El cuerpo no es JSON válido" }, { status: 400 });
  }
  const code = (error as { code?: string })?.code;
  if (code === "P2002") {
    return NextResponse.json({ error: "Ya existe una categoría con ese nombre o slug" }, { status: 409 });
  }
  if (code === "P2003") {
    return NextResponse.json({ error: "La categoría todavía tiene productos asignados" }, { status: 409 });
  }
  if (code === "P2025") {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }
  console.error(`${contexto}:`, error);
  return NextResponse.json({ error: "Error interno" }, { status: 500 });
}
