import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatsCard } from "@/components/admin/StatsCard";
import { PaymentStatusBadge } from "@/components/admin/OrderStatusBadge";
import { Package, ShoppingCart, DollarSign, Users, Plus, Tag, ArrowRight } from "lucide-react";
import { formatPEN } from "@/lib/utils";

export const metadata = { title: "Dashboard | Admin" };

export default async function AdminDashboard() {
  const [totalProducts, totalOrders, totalUsers, totalCategories, revenueData, recentOrders] =
    await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.user.count(),
      prisma.category.count(),
      prisma.payment.aggregate({
        where: { status: "APPROVED" },
        _sum: { amount: true },
      }),
      prisma.order.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
          address: true,
          payments: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      }),
    ]);

  const revenue = Number(revenueData._sum.amount || 0);

  return (
    <div className="animate-[fade-in_0.4s_ease-out_both]">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-[11px] font-medium text-[#d4af37] uppercase tracking-[0.3em] mb-2">
            Panel de control
          </p>
          <h1
            className="text-2xl font-light text-[#111111] text-pretty"
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
          >
            Dashboard
          </h1>
        </div>
        <p className="text-xs text-[#111111]/35 uppercase tracking-[0.12em] hidden sm:block">
          {new Date().toLocaleDateString("es-PE", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatsCard
          title="Productos activos"
          value={totalProducts}
          icon={<Package className="h-4.5 w-4.5" />}
        />
        <StatsCard
          title="Total pedidos"
          value={totalOrders}
          icon={<ShoppingCart className="h-4.5 w-4.5" />}
        />
        <StatsCard
          title="Ventas aprobadas"
          value={formatPEN(revenue)}
          icon={<DollarSign className="h-4.5 w-4.5" />}
          accent
        />
        <StatsCard
          title="Usuarios"
          value={totalUsers}
          icon={<Users className="h-4.5 w-4.5" />}
        />
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent orders — 2 cols */}
        <div className="lg:col-span-2 bg-white border border-[#111111]/6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#111111]/6">
            <p className="text-[11px] font-medium text-[#111111]/50 uppercase tracking-[0.2em]">
              Pedidos recientes
            </p>
            <Link
              href="/admin/pedidos"
              className="flex items-center gap-1 text-[11px] text-[#d4af37] hover:text-[#b4952f] uppercase tracking-[0.15em] transition-[color] duration-200"
              aria-label="Ver todos los pedidos"
            >
              Ver todos
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-12 text-center text-[#111111]/25 text-sm font-light"
              style={{ fontFamily: "var(--font-sans, sans-serif)" }}>
              Sin pedidos todavía
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#111111]/4">
                  <th scope="col" className="text-left px-5 py-3 text-[11px] font-medium text-[#111111]/35 uppercase tracking-[0.2em]">
                    ID
                  </th>
                  <th scope="col" className="text-left px-5 py-3 text-[11px] font-medium text-[#111111]/35 uppercase tracking-[0.2em]">
                    Cliente
                  </th>
                  <th scope="col" className="text-right px-5 py-3 text-[11px] font-medium text-[#111111]/35 uppercase tracking-[0.2em]">
                    Total
                  </th>
                  <th scope="col" className="text-center px-5 py-3 text-[11px] font-medium text-[#111111]/35 uppercase tracking-[0.2em]">
                    Pago
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => {
                  const latestPayment = order.payments[0];
                  const clientName = order.address?.fullName ?? "—";
                  const clientEmail = order.guestEmail ?? order.address?.phone ?? "—";
                  return (
                    <tr
                      key={order.id}
                      className="border-b border-[#111111]/4 last:border-0 hover:bg-[#f8f7f4]/60 transition-[background-color] duration-150"
                    >
                      <td className="px-5 py-3 font-mono text-xs text-[#111111]/50 tabular-nums">
                        {order.id.slice(0, 8)}…
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm text-[#111111]">{clientName}</p>
                        <p className="text-xs text-[#111111]/35 mt-0.5">{clientEmail}</p>
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-medium text-[#111111] tabular-nums">
                        {formatPEN(Number(order.total))}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {latestPayment ? (
                          <PaymentStatusBadge status={latestPayment.status} />
                        ) : (
                          <span className="text-xs text-[#111111]/30">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Right column — 1 col */}
        <div className="space-y-5">
          {/* Categories summary */}
          <div className="bg-white border border-[#111111]/6 p-5 transition-[border-color] duration-200 hover:border-[#111111]/12">
            <p className="text-[11px] font-medium text-[#111111]/40 uppercase tracking-[0.2em] mb-1.5">
              Categorías
            </p>
            <p
              className="text-3xl font-light text-[#111111] mb-3 tabular-nums"
              style={{ fontFamily: "var(--font-sans, sans-serif)", fontVariantNumeric: "tabular-nums" }}
            >
              {totalCategories}
            </p>
            <Link
              href="/admin/categorias"
              className="text-[11px] text-[#d4af37] hover:text-[#b4952f] uppercase tracking-[0.15em] transition-[color] duration-200 flex items-center gap-1"
            >
              Gestionar
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>

          {/* Quick actions */}
          <div className="bg-white border border-[#111111]/6 p-5">
            <p className="text-[11px] font-medium text-[#111111]/40 uppercase tracking-[0.2em] mb-4">
              Acciones rápidas
            </p>
            <div className="space-y-2">
              <Link
                href="/admin/productos/nuevo"
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-[#111111] font-medium uppercase tracking-[0.1em] border border-[#111111]/10 hover:bg-[#111111] hover:text-white hover:border-[#111111] transition-[background-color,border-color,color] duration-200 touch-manipulation"
              >
                <Plus className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                Nuevo producto
              </Link>
              <Link
                href="/admin/categorias"
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-[#111111] font-medium uppercase tracking-[0.1em] border border-[#111111]/10 hover:bg-[#111111] hover:text-white hover:border-[#111111] transition-[background-color,border-color,color] duration-200 touch-manipulation"
              >
                <Tag className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                Gestionar categorías
              </Link>
              <Link
                href="/admin/pedidos"
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-[#111111] font-medium uppercase tracking-[0.1em] border border-[#111111]/10 hover:bg-[#111111] hover:text-white hover:border-[#111111] transition-[background-color,border-color,color] duration-200 touch-manipulation"
              >
                <ShoppingCart className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                Ver todos los pedidos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
