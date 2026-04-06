"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, LogOut, ExternalLink, Tag } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/categorias", label: "Categorías", icon: Tag },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
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
        <p className="text-[9px] text-[#d4af37]/60 uppercase tracking-[0.2em] mt-1.5">
          Panel admin
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 text-[11px] font-medium uppercase tracking-[0.15em] transition-all duration-200 relative",
                isActive
                  ? "text-white bg-white/5"
                  : "text-white/35 hover:text-white/70 hover:bg-white/3"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#d4af37]" />
              )}
              <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-[#d4af37]" : "")} />
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
          className="flex items-center gap-3 px-3.5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-white/25 hover:text-white/50 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Ver tienda
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 px-3.5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-white/25 hover:text-red-400/70 transition-colors w-full text-left"
        >
          <LogOut className="h-3.5 w-3.5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
