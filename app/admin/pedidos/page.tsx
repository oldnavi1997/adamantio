import { prisma } from "@/lib/prisma";
import { OrderTable } from "@/components/admin/OrderTable";

export const metadata = { title: "Pedidos | Admin" };

export default async function AdminOrdersPage() {
  const raw = await prisma.order.findMany({
    include: {
      items: { include: { product: true } },
      user: true,
      address: true,
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });
  const orders = JSON.parse(JSON.stringify(raw));

  return (
    <div>
      <div className="mb-8">
        <p className="text-[9px] font-medium text-[#d4af37] uppercase tracking-[0.3em] mb-2">
          Gestión
        </p>
        <h1
          className="text-2xl font-light text-[#111111]"
          style={{ fontFamily: "var(--font-sans, sans-serif)" }}
        >
          Pedidos
        </h1>
      </div>
      <div className="bg-white border border-[#111111]/6">
        <OrderTable orders={orders} />
      </div>
    </div>
  );
}
