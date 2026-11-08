import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Las rutas de escritura de categorías rechazan a quien no es ADMIN antes de
 * tocar la base. El Prisma falso revienta si alguien lo usa.
 */
const sesion = vi.hoisted(() => ({ actual: null as null | { user: { role: string } } }));

vi.mock("next-auth", () => ({ getServerSession: vi.fn(async () => sesion.actual) }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/algolia-sync", () => ({ reindexarProductos: vi.fn(async () => {}), indexProduct: vi.fn() }));
vi.mock("next/cache", () => ({ unstable_cache: <T>(f: T) => f, revalidateTag: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: new Proxy(
    {},
    {
      get(_t, prop) {
        throw new Error(`Prisma no debía usarse (${String(prop)})`);
      },
    }
  ),
}));

import * as raiz from "@/app/api/categories/route";
import * as porId from "@/app/api/categories/[id]/route";
import * as reorden from "@/app/api/categories/reorder/route";
import * as lote from "@/app/api/products/bulk-categories/route";

const ctx = { params: Promise.resolve({ id: "abc" }) };
const json = (body: unknown, method = "POST") =>
  new Request("http://localhost/api/categories", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const escrituras: [string, () => Promise<Response>][] = [
  ["POST /api/categories", () => raiz.POST(json({ name: "Nueva" }))],
  ["PATCH /api/categories/[id]", () => porId.PATCH(json({ name: "Otra" }, "PATCH"), ctx)],
  ["PUT /api/categories/[id]", () => porId.PUT(json({ name: "Otra" }, "PUT"), ctx)],
  ["DELETE /api/categories/[id]", () => porId.DELETE(new Request("http://localhost", { method: "DELETE" }), ctx)],
  ["PATCH /api/categories/reorder", () => reorden.PATCH(json([{ id: "a", sortOrder: 0 }], "PATCH"))],
  [
    "POST /api/products/bulk-categories",
    () => lote.POST(json({ productIds: ["p"], categoryIds: ["c"], mode: "add" }) as never),
  ],
];

describe("endpoints administrativos", () => {
  beforeEach(() => {
    sesion.actual = null;
  });

  it.each(escrituras)("%s → 401 sin sesión", async (_n, llamar) => {
    const res = await llamar();
    expect(res.status).toBe(401);
  });

  it.each(escrituras)("%s → 403 con sesión de cliente", async (_n, llamar) => {
    sesion.actual = { user: { role: "USER" } };
    const res = await llamar();
    expect(res.status).toBe(403);
  });

  it("un admin con datos inválidos recibe 400 y la base no se toca", async () => {
    sesion.actual = { user: { role: "ADMIN" } };
    const res = await raiz.POST(json({ name: "x", parentId: "../../etc" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it("rechaza campos desconocidos", async () => {
    sesion.actual = { user: { role: "ADMIN" } };
    const res = await porId.PATCH(json({ level: 1 }, "PATCH"), ctx);
    expect(res.status).toBe(400);
  });

  it("rechaza un id con caracteres no permitidos", async () => {
    sesion.actual = { user: { role: "ADMIN" } };
    const res = await porId.DELETE(new Request("http://localhost", { method: "DELETE" }), {
      params: Promise.resolve({ id: "a;DROP" }),
    });
    expect(res.status).toBe(400);
  });
});
