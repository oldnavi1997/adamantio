import Link from "next/link";
import { StatsCard } from "@/components/admin/StatsCard";
import { FilaProductoInsight, FilaTopInsight } from "@/components/admin/FilaProductoInsight";
import { PERIODOS, diasValidos, getInsights, type FilaConteo } from "@/lib/insights";
import { productThumbnail } from "@/lib/media";
import { cn, formatPEN } from "@/lib/utils";

export const metadata = { title: "Insights | Admin" };

const DIAS = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function etiquetaMes(mes: string) {
  const [anio, m] = mes.split("-");
  return `${MESES[Number(m) - 1]} ${anio.slice(2)}`;
}

function pct(parte: number, total: number) {
  return total > 0 ? Math.round((parte / total) * 100) : 0;
}

/** Texto de variación contra el período anterior, o nada si no hay con qué comparar. */
function variacion(actual: number, previo: number | undefined) {
  if (previo === undefined || previo <= 0) return undefined;
  const v = Math.round(((actual - previo) / previo) * 100);
  return `${v >= 0 ? "+" : ""}${v}% vs período anterior`;
}

function Panel({ titulo, nota, children }: { titulo: string; nota?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-[#111111]/6 p-6">
      <h2 className="text-sm font-semibold text-[#111111]">{titulo}</h2>
      {nota && <p className="text-xs text-[#111111]/50 mt-1">{nota}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Vacio() {
  return <p className="py-6 text-center text-sm text-[#111111]/40">Sin datos en este período.</p>;
}

function Barra({ valor, max }: { valor: number; max: number }) {
  return (
    <div className="h-2.5 flex-1 min-w-0">
      <div className="h-full rounded-r bg-[#111111]" style={{ width: `${pct(valor, max)}%` }} />
    </div>
  );
}

function Conteos({ filas, etiqueta }: { filas: FilaConteo[]; etiqueta?: (c: string) => string }) {
  if (filas.length === 0) return <Vacio />;
  const max = Math.max(...filas.map((f) => f.n));
  return (
    <ul className="space-y-2.5">
      {filas.map((f) => (
        <li key={f.clave} className="flex items-center gap-3 text-xs" title={`${f.n} ventas`}>
          <span className="w-24 shrink-0 text-[#111111]/70">{etiqueta ? etiqueta(f.clave) : f.clave}</span>
          <Barra valor={f.n} max={max} />
          <span className="w-8 shrink-0 text-right tabular-nums text-[#111111]">{f.n}</span>
        </li>
      ))}
    </ul>
  );
}

function enlaceProducto(id: string) {
  return `/admin/productos/${id}/editar`;
}

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string }>;
}) {
  const dias = diasValidos((await searchParams).dias);
  const d = await getInsights(dias);
  const { actual, previo } = d;

  const ticket = actual.ventas > 0 ? actual.total / actual.ventas : 0;
  const ticketPrevio = previo && previo.ventas > 0 ? previo.total / previo.ventas : undefined;
  const maxCategoria = Math.max(0, ...d.categorias.map((c) => c.ingresos));
  const maxMes = Math.max(0, ...d.meses.map((m) => m.tienda + m.web));
  const totalCategorias = d.categorias.reduce((a, c) => a + c.ingresos, 0);
  const mejorDia = [...d.diasSemana].sort((a, b) => b.n - a.n)[0];

  const lecturas = [
    d.top[0] && `El más vendido es ${d.top[0].name}, con ${d.top[0].uds} unidades.`,
    d.categorias[0] &&
      `${d.categorias[0].categoria} aporta el ${pct(d.categorias[0].ingresos, totalCategorias)}% de los ingresos por producto.`,
    actual.total > 0 && `La web representa el ${pct(actual.totalWeb, actual.total)}% de la facturación.`,
    mejorDia && `El día con más ventas es el ${DIAS[Number(mejorDia.clave)].toLowerCase()}.`,
    d.riesgo.length > 0 && `${d.riesgo.length} ${d.riesgo.length === 1 ? "producto con demanda se agotaría" : "productos con demanda se agotarían"} en 30 días o menos.`,
    d.dormidosTotal.n > 0 &&
      `${d.dormidosTotal.n} productos activos (${d.dormidosTotal.uds} unidades) no se venden hace ${d.ventanaRitmo} días.`,
  ].filter(Boolean) as string[];

  return (
    <div className="animate-[fade-in_0.4s_ease-out_both] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#111111]">Insights de ventas</h1>
          <p className="text-sm text-[#111111]/50 mt-1">Tienda física y web, sin duplicar pedidos.</p>
        </div>
        <nav aria-label="Período" className="flex border border-[#111111]/10">
          {PERIODOS.map((p) => (
            <Link
              key={p.dias}
              href={`/admin/insights?dias=${p.dias}`}
              aria-current={p.dias === dias ? "page" : undefined}
              className={cn(
                "px-3 py-1.5 text-xs transition-colors",
                p.dias === dias ? "bg-[#111111] text-white" : "text-[#111111]/60 hover:text-[#111111]"
              )}
            >
              {p.etiqueta}
            </Link>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard accent title="Facturación" value={formatPEN(actual.total)} description={variacion(actual.total, previo?.total)} />
        <StatsCard title="Ventas" value={actual.ventas} description={variacion(actual.ventas, previo?.ventas)} />
        <StatsCard title="Ticket promedio" value={formatPEN(ticket)} description={variacion(ticket, ticketPrevio)} />
        <StatsCard title="Unidades" value={actual.unidades} description={variacion(actual.unidades, previo?.unidades)} />
      </div>

      {lecturas.length > 0 && (
        <Panel titulo="Lectura rápida">
          <ul className="grid md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-[#111111]/70">
            {lecturas.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel titulo="Productos más vendidos" nota="Por unidades. El stock es el actual.">
        {d.top.length === 0 ? (
          <Vacio />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-[#111111]/40">
                  <th className="pb-2 pr-3 font-medium">#</th>
                  <th className="pb-2 pr-3 font-medium">Producto</th>
                  <th className="pb-2 pr-3 font-medium text-right">Unidades</th>
                  <th className="pb-2 pr-3 font-medium text-right">Web</th>
                  <th className="pb-2 pr-3 font-medium text-right">Ingresos</th>
                  <th className="pb-2 pr-1 font-medium text-right">Stock</th>
                  <th className="pb-2"><span className="sr-only">Imagen</span></th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {d.top.map((p, i) => (
                  <FilaTopInsight
                    key={p.id}
                    posicion={i + 1}
                    nombre={p.name}
                    href={enlaceProducto(p.id)}
                    foto={productThumbnail(p)}
                    uds={p.uds}
                    web={p.web}
                    ingresos={p.ingresos}
                    stock={p.stock}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6">
        <Panel titulo="Facturación por mes" nota="Últimos 12 meses con ventas, sin importar el período elegido.">
          {d.meses.length === 0 ? (
            <Vacio />
          ) : (
            <>
              <div className="mb-3 flex gap-4 text-xs text-[#111111]/70">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#2F6DA8]" />Tienda</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#9A7420]" />Web</span>
              </div>
              <ul className="space-y-2">
                {d.meses.map((m) => (
                  <li
                    key={m.mes}
                    className="flex items-center gap-3 text-xs"
                    title={`Tienda ${formatPEN(m.tienda)} · Web ${formatPEN(m.web)}`}
                  >
                    <span className="w-12 shrink-0 text-[#111111]/70">{etiquetaMes(m.mes)}</span>
                    <div className="flex h-2.5 flex-1 min-w-0 gap-[2px]">
                      {m.tienda > 0 && <div className="h-full bg-[#2F6DA8]" style={{ width: `${(m.tienda / maxMes) * 100}%` }} />}
                      {m.web > 0 && <div className="h-full rounded-r bg-[#9A7420]" style={{ width: `${(m.web / maxMes) * 100}%` }} />}
                    </div>
                    <span className="w-20 shrink-0 text-right tabular-nums text-[#111111]">{formatPEN(m.tienda + m.web)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>

        <Panel titulo="Ingresos por categoría" nota="Según la categoría principal del producto.">
          {d.categorias.length === 0 ? (
            <Vacio />
          ) : (
            <ul className="space-y-2.5">
              {d.categorias.map((c) => (
                <li key={c.categoria} className="flex items-center gap-3 text-xs" title={`${c.uds} unidades`}>
                  <span className="w-32 shrink-0 truncate text-[#111111]/70">{c.categoria}</span>
                  <Barra valor={c.ingresos} max={maxCategoria} />
                  <span className="w-20 shrink-0 text-right tabular-nums text-[#111111]">{formatPEN(c.ingresos)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel titulo="Por reponer" nota={`Se agotarían en 30 días o menos, al ritmo de los últimos ${d.ventanaRitmo} días.`}>
          {d.riesgo.length === 0 ? (
            <Vacio />
          ) : (
            <ul className="divide-y divide-[#111111]/6 text-sm">
              {d.riesgo.map((p) => (
                <FilaProductoInsight
                  key={p.id}
                  nombre={p.name}
                  href={enlaceProducto(p.id)}
                  foto={productThumbnail(p)}
                  detalle={`${p.stock <= 0 ? "Agotado" : `${p.stock} en stock · ~${p.dias} días`} · ${p.uds} vendidas`}
                />
              ))}
            </ul>
          )}
        </Panel>

        <Panel titulo="Stock sin movimiento" nota={`Activos con stock y sin ventas en ${d.ventanaRitmo} días: ${d.dormidosTotal.n} productos, ${d.dormidosTotal.uds} unidades. Los de más stock:`}>
          {d.dormidos.length === 0 ? (
            <Vacio />
          ) : (
            <ul className="divide-y divide-[#111111]/6 text-sm">
              {d.dormidos.map((p) => (
                <FilaProductoInsight
                  key={p.id}
                  nombre={p.name}
                  href={enlaceProducto(p.id)}
                  foto={productThumbnail(p)}
                  detalle={`${p.stock} en stock`}
                />
              ))}
            </ul>
          )}
        </Panel>

        <Panel titulo="Métodos de pago" nota="Número de ventas.">
          <Conteos filas={d.metodos} />
        </Panel>

        <Panel titulo="Ventas por día de la semana" nota="Hora de Perú.">
          <Conteos filas={d.diasSemana} etiqueta={(c) => DIAS[Number(c)]} />
        </Panel>

        <Panel titulo="Pedidos web" nota="«Sin pagar» incluye reintentos: cambiar de pasarela crea otro pedido.">
          <dl className="grid grid-cols-3 gap-4">
            <div>
              <dt className="text-xs text-[#111111]/50">Pagados</dt>
              <dd className="text-xl font-medium tabular-nums text-[#111111]">{d.pedidos.pagados}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#111111]/50">Sin pagar</dt>
              <dd className="text-xl font-medium tabular-nums text-[#111111]">{d.pedidos.pendientes}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#111111]/50">Tasa de pago</dt>
              <dd className="text-xl font-medium tabular-nums text-[#111111]">
                {pct(d.pedidos.pagados, d.pedidos.pagados + d.pedidos.pendientes)}%
              </dd>
            </div>
          </dl>
        </Panel>

        <Panel titulo="Grabado" nota="Líneas de pedidos web pagados.">
          <p className="text-xl font-medium tabular-nums text-[#111111]">{pct(d.grabado.con, d.grabado.total)}%</p>
          <p className="text-xs text-[#111111]/50 mt-1">{d.grabado.con} de {d.grabado.total} llevan grabado.</p>
        </Panel>
      </div>
    </div>
  );
}
