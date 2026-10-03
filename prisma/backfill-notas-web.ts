/**
 * Emite la nota de venta del POS para los pedidos web cobrados que no la tienen.
 *
 * También pone la etiqueta de envío a las notas web que no la tienen (las que
 * se emitieron antes de que existieran las etiquetas), si el pedido iba por
 * Shalom u Olva.
 *
 * Sirve para dos cosas: los pedidos aprobados antes de que existiera la nota, y
 * los que la perdieron porque `emitirNotaVentaWeb` falló después de aprobar
 * (va fuera de la transacción a propósito, ver `lib/nota-venta-web.ts`).
 *
 * No toca el stock: ya lo descontó `aprobarOrden`. Cada nota queda fechada el
 * día en que se cobró el pedido, no hoy. Es idempotente, se puede repetir.
 *
 *   npx tsx prisma/backfill-notas-web.ts           # dice qué haría
 *   npx tsx prisma/backfill-notas-web.ts --aplicar # las escribe
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  const aplicar = process.argv.includes("--aplicar");
  // Import dinámico: `lib/prisma` lee DATABASE_URL al cargarse, y los import
  // estáticos se resuelven antes que el dotenv de arriba.
  const { prisma } = await import("@/lib/prisma");
  const { emitirNotaVentaWeb, reponerEnvioWeb } = await import("@/lib/nota-venta-web");

  const sinEtiqueta = await prisma.sale.findMany({
    where: {
      canal: "WEB",
      datosEnvio: null,
      order: { courier: { in: ["shalom", "olva"] } },
    },
    select: { id: true },
  });
  if (sinEtiqueta.length > 0) {
    if (aplicar) {
      let puestas = 0;
      for (const s of sinEtiqueta) if (await reponerEnvioWeb(s.id)) puestas++;
      console.log(`${puestas} etiquetas de envío repuestas en notas web.\n`);
    } else {
      console.log(`${sinEtiqueta.length} notas web con envío sin etiqueta.\n`);
    }
  }

  const pendientes = await prisma.order.findMany({
    where: { stockDeducted: true, sale: null },
    select: {
      id: true,
      total: true,
      createdAt: true,
      payments: {
        where: { status: "APPROVED" },
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { updatedAt: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (pendientes.length === 0) {
    console.log("Todos los pedidos cobrados ya tienen su nota de venta.");
    await prisma.$disconnect();
    return;
  }

  for (const o of pendientes) {
    const fecha = o.payments[0]?.updatedAt ?? o.createdAt;
    console.log(
      `#${o.id.slice(-8).toUpperCase()}  ${fecha.toISOString().slice(0, 10)}  ` +
        `S/ ${Number(o.total).toFixed(2)}`
    );
  }

  if (!aplicar) {
    console.log(`\n${pendientes.length} pedidos sin nota. Repite con --aplicar para emitirlas.`);
    await prisma.$disconnect();
    return;
  }

  let creadas = 0;
  for (const o of pendientes) {
    const fecha = o.payments[0]?.updatedAt ?? o.createdAt;
    try {
      const r = await emitirNotaVentaWeb(o.id, fecha);
      if (r.creada) creadas++;
      else console.log(`#${o.id.slice(-8).toUpperCase()}: ${r.motivo}`);
    } catch (err) {
      console.error(`#${o.id.slice(-8).toUpperCase()}: falló`, err);
    }
  }

  console.log(`\n${creadas} de ${pendientes.length} notas emitidas.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
