"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Menu, X, ChevronDown, Heart } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import { useState, useEffect, useRef } from "react";
import { useCartStore } from "@/stores/cart";
import { useWishlistStore } from "@/stores/wishlist";
import { slugify } from "@/lib/utils";

type NavLeaf = { id: string; name: string };

type NavChild = NavLeaf & { children: NavLeaf[] };

export type NavCategory = {
  id: string;
  name: string;
  children: NavChild[];
};

interface NavbarProps {
  categories: NavCategory[];
}

const LOGO_URL =
  "https://res.cloudinary.com/dzqns7kss/image/upload/v1772665459/adamantio-logo-1024x299_ol5fgy.png";

export function Navbar({ categories }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openCatId, setOpenCatId] = useState<string | null>(null);
  const [openMobileCatId, setOpenMobileCatId] = useState<string | null>(null);
  const itemCount = useCartStore((s) => s.itemCount());
  const openDrawer = useCartStore((s) => s.openDrawer);
  const wishCount = useWishlistStore((s) => s.count());
  const openWishlist = useWishlistStore((s) => s.openDrawer);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const navRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCatEnter = (id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenCatId(id);
  };

  const handleCatLeave = () => {
    closeTimer.current = setTimeout(() => setOpenCatId(null), 120);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenCatId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const closeMenu = () => {
    setMenuOpen(false);
    setOpenMobileCatId(null);
  };

  const openMenu = () => {
    setMenuOpen(true);
    setSearchOpen(false);
  };

  return (
    <>
      <nav
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.08)]"
            : "bg-white"
        }`}
        style={{ borderBottom: "1px solid #e5e7eb" }}
      >
        <div className="max-w-[1080px] mx-auto px-4">
          <div className="h-[60px] flex items-center">

            {/* Mobile layout: menu | logo | cart */}
            <div className="flex w-full items-center md:hidden">
              <div className="flex-1 flex justify-start">
                <button
                  className="text-[#374151] hover:text-[#111827] transition-colors"
                  onClick={openMenu}
                  aria-label="Abrir menú"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 flex justify-center">
                <Link href="/">
                  <Image
                    src={LOGO_URL}
                    alt="Adamantio"
                    width={120}
                    height={35}
                    className="h-8 w-auto object-contain"
                    priority
                  />
                </Link>
              </div>
              <div className="flex-1 flex justify-end items-center gap-3">
                <SearchBar
                  className="text-[#374151] hover:text-[#111827] transition-colors"
                  open={searchOpen}
                  onOpen={() => setSearchOpen(true)}
                  onClose={() => setSearchOpen(false)}
                  triggerOnly
                />
                <button
                  onClick={() => { openWishlist(); setSearchOpen(false); }}
                  className="relative text-[#374151]"
                  aria-label="Abrir lista de deseos"
                >
                  <Heart className="h-5 w-5" />
                  {mounted && wishCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#111827] text-white text-[9px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center">
                      {wishCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { openDrawer(); setSearchOpen(false); }}
                  className="relative text-[#374151]"
                  aria-label="Abrir carrito"
                >
                  <ShoppingBag className="h-5 w-5" />
                  {mounted && itemCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#111827] text-white text-[9px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Desktop layout: logo | nav centrado | iconos */}
            <div className="hidden md:grid w-full items-center" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
              {/* Logo — izquierda */}
              <Link href="/" className="justify-self-start">
                <Image
                  src={LOGO_URL}
                  alt="Adamantio"
                  width={140}
                  height={41}
                  className="h-9 w-auto object-contain"
                  priority
                />
              </Link>

              {/* Nav — centro */}
              <div ref={navRef} className="flex items-center gap-6">
                {categories.map((cat) =>
                  cat.children.length > 0 ? (
                    <div
                      key={cat.id}
                      className="relative"
                      onMouseLeave={handleCatLeave}
                    >
                      <button
                        onMouseEnter={() => handleCatEnter(cat.id)}
                        onClick={() => setOpenCatId((v) => v === cat.id ? null : cat.id)}
                        className="flex items-center gap-1 text-sm text-[#374151] hover:text-[#111827] transition-colors duration-200"
                      >
                        {cat.name}
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform duration-200 ${openCatId === cat.id ? "rotate-180" : ""}`}
                        />
                      </button>

                      {openCatId === cat.id && (
                        <div
                          className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-52 bg-white shadow-[0_8px_20px_rgba(0,0,0,0.08)] z-50 rounded-lg"
                          style={{ border: "1px solid #e5e7eb" }}
                          onMouseEnter={() => handleCatEnter(cat.id)}
                        >
                          <Link
                            href={`/joyas?category=${slugify(cat.name)}`}
                            onClick={() => setOpenCatId(null)}
                            className="flex items-center px-4 py-2.5 text-xs font-medium text-[#374151] hover:text-[#111827] hover:bg-[#f3f4f6] transition-colors border-b border-[#e5e7eb] rounded-t-lg"
                          >
                            Ver todo — {cat.name}
                          </Link>
                          <div className="py-1">
                            {cat.children.map((child) =>
                              child.children.length > 0 ? (
                                <div key={child.id} className="px-4 py-2">
                                  <p className="text-[10px] text-[#9ca3af] uppercase tracking-wider mb-0.5">
                                    {child.name}
                                  </p>
                                  {child.children.map((gc) => (
                                    <Link
                                      key={gc.id}
                                      href={`/joyas?category=${slugify(gc.name)}`}
                                      onClick={() => setOpenCatId(null)}
                                      className="block pl-2 py-1 text-sm text-[#374151] hover:text-[#111827] transition-colors"
                                    >
                                      {gc.name}
                                    </Link>
                                  ))}
                                </div>
                              ) : (
                                <Link
                                  key={child.id}
                                  href={`/joyas?category=${slugify(child.name)}`}
                                  onClick={() => setOpenCatId(null)}
                                  className="flex items-center px-4 py-2 text-sm text-[#374151] hover:text-[#111827] hover:bg-[#f3f4f6] transition-colors"
                                >
                                  {child.name}
                                </Link>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      key={cat.id}
                      href={`/joyas?category=${slugify(cat.name)}`}
                      className="text-sm text-[#374151] hover:text-[#111827] transition-colors duration-200"
                    >
                      {cat.name}
                    </Link>
                  )
                )}

                <Link
                  href="/joyas"
                  className="text-sm text-[#9ca3af] hover:text-[#111827] transition-colors duration-200"
                >
                  Ver todo
                </Link>

              </div>

              {/* Iconos — derecha */}
              <div className="justify-self-end flex items-center gap-4">
                <SearchBar
                  open={searchOpen}
                  onOpen={() => setSearchOpen(true)}
                  onClose={() => setSearchOpen(false)}
                />
                <button
                  onClick={() => { openWishlist(); setSearchOpen(false); }}
                  className="relative text-[#374151] hover:text-[#111827] transition-colors"
                  title="Lista de deseos"
                  aria-label="Abrir lista de deseos"
                >
                  <Heart className="h-5 w-5" />
                  {mounted && wishCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#111827] text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none">
                      {wishCount > 9 ? "9+" : wishCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { openDrawer(); setSearchOpen(false); }}
                  className="relative text-[#374151] hover:text-[#111827] transition-colors"
                  title="Carrito"
                  aria-label="Abrir carrito"
                >
                  <ShoppingBag className="h-5 w-5" />
                  {mounted && itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#111827] text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none">
                      {itemCount > 9 ? "9+" : itemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      </nav>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 md:hidden bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Mobile drawer panel */}
      <div
        className={`fixed top-0 left-0 h-full z-50 md:hidden flex flex-col transition-transform duration-300 ease-in-out ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          width: "72vw",
          maxWidth: "300px",
          backgroundColor: "#ffffff",
          borderRight: "1px solid #e5e7eb",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        {/* Línea dorada superior, igual que en los drawers de carrito y favoritos */}
        <div className="h-[2px] bg-gradient-to-r from-[#d4af37]/0 via-[#d4af37] to-[#d4af37]/0" />

        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-4 h-[60px]"
          style={{ borderBottom: "1px solid #e5e7eb" }}
        >
          <Link href="/" onClick={closeMenu}>
            <Image
              src={LOGO_URL}
              alt="Adamantio"
              width={110}
              height={32}
              className="h-7 w-auto object-contain"
            />
          </Link>
          <button
            onClick={closeMenu}
            className="w-8 h-8 flex items-center justify-center text-[#111111]/40 hover:text-[#111111] hover:bg-[#f3f4f6] rounded-full transition-all duration-200"
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drawer nav links */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1 overflow-y-auto">
          <Link
            href="/joyas"
            onClick={closeMenu}
            className="py-2.5 text-sm text-[#111111]/70 hover:text-[#111111] transition-colors border-b border-[#f3f4f6]"
          >
            Ver todo
          </Link>

          {categories.map((cat) =>
            cat.children.length > 0 ? (
              <div key={cat.id}>
                <button
                  onClick={() => setOpenMobileCatId((v) => v === cat.id ? null : cat.id)}
                  className="flex items-center justify-between w-full py-2.5 text-sm text-[#111111]/70 hover:text-[#111111] transition-colors duration-200 border-b border-[#f3f4f6]"
                >
                  {cat.name}
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${openMobileCatId === cat.id ? "rotate-180" : ""}`}
                  />
                </button>

                {openMobileCatId === cat.id && (
                  <div className="pl-3 pb-1 flex flex-col gap-0.5">
                    <Link
                      href={`/joyas?category=${slugify(cat.name)}`}
                      onClick={closeMenu}
                      className="py-2 text-xs text-[#111111]/50 hover:text-[#111111] transition-colors"
                    >
                      Ver todo — {cat.name}
                    </Link>
                    {cat.children.map((child) =>
                      child.children.length > 0 ? (
                        <div key={child.id} className="mt-1">
                          <p className="text-[10px] uppercase tracking-wider text-[#111111]/40 mb-1">
                            {child.name}
                          </p>
                          {child.children.map((gc) => (
                            <Link
                              key={gc.id}
                              href={`/joyas?category=${slugify(gc.name)}`}
                              onClick={closeMenu}
                              className="block pl-3 py-1.5 text-sm text-[#111111]/60 hover:text-[#111111] transition-colors"
                            >
                              {gc.name}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <Link
                          key={child.id}
                          href={`/joyas?category=${slugify(child.name)}`}
                          onClick={closeMenu}
                          className="block py-1.5 text-sm text-[#111111]/60 hover:text-[#111111] transition-colors"
                        >
                          {child.name}
                        </Link>
                      )
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={cat.id}
                href={`/joyas?category=${slugify(cat.name)}`}
                onClick={closeMenu}
                className="py-2.5 text-sm text-[#111111]/70 hover:text-[#111111] transition-colors duration-200 border-b border-[#f3f4f6]"
              >
                {cat.name}
              </Link>
            )
          )}
        </nav>

      </div>
    </>
  );
}
