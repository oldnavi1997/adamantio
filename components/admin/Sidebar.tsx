"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, LogOut, ExternalLink, Tag, PenLine, Film, BookText } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/categorias", label: "Categorías", icon: Tag },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/admin/reclamaciones", label: "Reclamos", icon: BookText },
  { href: "/admin/grabado", label: "Grabado", icon: PenLine },
  { href: "/admin/videos", label: "Videos", icon: Film },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-[#0a0a0a] text-white flex flex-col min-h-screen border-r border-white/5 flex-shrink-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/5">
        <span
          className="text-[13px] tracking-[0.3em] text-white/80 uppercase font-light"
          style={{ fontFamily: "var(--font-sans, sans-serif)" }}
        >
          Adamantio
        </span>
        <p className="text-[11px] text-[#d4af37]/60 uppercase tracking-[0.2em] mt-1.5">
          Panel admin
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5" aria-label="Navegación principal">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] transition-[background-color,color] duration-200 relative",
                isActive
                  ? "text-white bg-white/5"
                  : "text-white/35 hover:text-white/70 hover:bg-white/[0.03]"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#d4af37]" aria-hidden="true" />
              )}
              <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-[#d4af37]" : "")} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer links */}
      <div className="px-3 py-5 border-t border-white/5 space-y-0.5">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium uppercase tracking-[0.12em] text-white/25 hover:text-white/50 transition-[color] duration-200"
          aria-label="Ver tienda (abre en nueva pestaña)"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          Ver tienda
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium uppercase tracking-[0.12em] text-white/25 hover:text-red-400/70 transition-[color] duration-200 w-full text-left touch-manipulation"
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
