import { formatPEN } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface CartSummaryProps {
  subtotal: number;
  itemCount: number;
}

export function CartSummary({ subtotal, itemCount }: CartSummaryProps) {
  return (
    <div className="bg-white border border-[#111111]/6 p-6 space-y-5 sticky top-24">
      <h2
        className="text-lg font-light text-[#111111]"
        style={{ fontFamily: "var(--font-sans, sans-serif)" }}
      >
        Resumen
      </h2>

      <div className="h-px bg-[#111111]/6" />

      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-[#111111]/60">
          <span>{itemCount} {itemCount === 1 ? "producto" : "productos"}</span>
          <span>{formatPEN(subtotal)}</span>
        </div>
        <div className="flex justify-between text-[#111111]/60">
          <span>Envío</span>
          <span className="text-emerald-600 text-[11px] uppercase tracking-wide">A coordinar</span>
        </div>
      </div>

      <div className="h-px bg-[#111111]/6" />

      <div className="flex justify-between items-baseline">
        <span className="text-[10px] font-medium text-[#111111]/50 uppercase tracking-[0.15em]">
          Total estimado
        </span>
        <span className="text-xl font-semibold text-[#111111]">{formatPEN(subtotal)}</span>
      </div>

      <Link href="/checkout" className="block">
        <Button className="w-full" size="lg" variant="secondary">
          Continuar al pago
        </Button>
      </Link>

      <Link
        href="/joyas"
        className="block text-center text-[10px] text-[#111111]/40 hover:text-[#111111]/70 uppercase tracking-[0.2em] transition-colors"
      >
        Seguir comprando
      </Link>
    </div>
  );
}
