"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Search, X, ArrowRight, Loader2 } from "lucide-react";
import { getSearchClient, INDEX_NAME } from "@/lib/algolia";
import { formatPEN, precioConOferta } from "@/lib/utils";

type Hit = {
  objectID: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  comparePrice?: number | null;
  images: string[];
  category: string;
};

/* ─── shared search logic ───────────────────────────────────────────── */
function useSearch(onNavigate: () => void) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await getSearchClient().searchSingleIndex<Hit>({
        indexName: INDEX_NAME,
        searchParams: { query: q, hitsPerPage: 6 },
      });
      setResults(res.hits);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  const goToProduct = (slug: string) => {
    onNavigate();
    setQuery(""); setResults([]);
    router.push(`/joyas/${slug}`);
  };

  const goToAll = () => {
    if (!query.trim()) return;
    const q = query.trim();
    onNavigate();
    setQuery(""); setResults([]);
    router.push(`/joyas?search=${encodeURIComponent(q)}`);
  };

  const clear = () => { setQuery(""); setResults([]); };

  return { query, setQuery, results, loading, goToProduct, goToAll, clear };
}

/* ─── drawer panel (shared mobile + desktop) ────────────────────────── */
function SearchDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { query, setQuery, results, loading, goToProduct, goToAll, clear } = useSearch(onClose);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      clear();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop — below header */}
      <div
        className={`fixed left-0 right-0 bottom-0 z-40 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ top: "61px", backgroundColor: "rgba(17,17,17,0.25)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed left-0 right-0 z-50 bg-white border-b border-[#e5e7eb] shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-all duration-200 ease-out ${
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-1 pointer-events-none"
        }`}
        style={{ top: "61px" }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          {/* Input: 16px en móvil para que iOS no haga zoom al enfocar */}
          <div className="flex items-center gap-3 px-4 h-12 sm:h-14 rounded-xl bg-[#f3f4f6] border border-[#e5e7eb] focus-within:border-[#111111]/30 transition-colors">
            {loading ? (
              <Loader2 className="h-[18px] w-[18px] text-[#111111]/50 shrink-0 animate-spin" />
            ) : (
              <Search className="h-[18px] w-[18px] text-[#111111]/50 shrink-0" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") goToAll(); }}
              placeholder="Buscar joyas..."
              aria-label="Buscar productos"
              className="flex-1 min-w-0 bg-transparent text-base sm:text-sm text-[#111111] placeholder:text-[#111111]/50 outline-none!"
            />
            <button
              type="button"
              onClick={() => (query ? clear() : onClose())}
              className="text-[#111111]/50 hover:text-[#111111] transition-colors shrink-0"
              aria-label={query ? "Limpiar" : "Cerrar búsqueda"}
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wider text-[#111111]/60">Productos sugeridos</p>
              {/* Solo la lista hace scroll: «Ver todos» queda siempre a la vista. */}
              <ul className="mt-1 max-h-[50vh] overflow-y-auto [scrollbar-width:none]">
                {results.map((hit) => {
                  const { precio, antes } = precioConOferta(hit);
                  return (
                    <li key={hit.objectID} className="border-b border-[#f3f4f6] last:border-b-0">
                      <button
                        type="button"
                        onClick={() => goToProduct(hit.slug)}
                        className="group flex items-center gap-4 w-full py-3 text-left"
                      >
                        <div className="w-14 h-14 sm:w-[72px] sm:h-[72px] shrink-0 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
                          {hit.images[0] && (
                            <img src={hit.images[0]} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#111111] truncate group-hover:text-[#111111]/60 transition-colors">
                            {hit.name}
                          </p>
                          {hit.category && (
                            <p className="text-xs text-[#111111]/60 mt-1 truncate">{hit.category}</p>
                          )}
                          <p className="text-sm text-[#111111] mt-1">
                            {formatPEN(precio)}
                            {antes !== null && (
                              <span className="ml-2 text-xs text-[#111111]/40 line-through">{formatPEN(antes)}</span>
                            )}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <button
                type="button"
                onClick={goToAll}
                className="flex items-center justify-center gap-1.5 w-full pt-4 pb-1 text-xs text-[#111111]/60 hover:text-[#111111] border-t border-[#e5e7eb] transition-colors"
              >
                Ver todos los resultados
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* No results */}
          {query.trim() && results.length === 0 && !loading && (
            <p className="mt-4 py-2 text-center text-sm text-[#111111]/60">
              Sin resultados para &quot;{query}&quot;
            </p>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}

/* ─── public export ─────────────────────────────────────────────────── */
interface SearchBarProps {
  /** Additional classes for the icon button */
  className?: string;
  /** Controlled open state (optional — uncontrolled if omitted) */
  open?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  /** When true, only renders the trigger button — no SearchDrawer (avoids duplicate drawers) */
  triggerOnly?: boolean;
}

export function SearchBar({ className, open: controlledOpen, onOpen, onClose, triggerOnly }: SearchBarProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const handleOpen = () => (onOpen ? onOpen() : setInternalOpen(true));
  const handleClose = () => (onClose ? onClose() : setInternalOpen(false));

  return (
    <>
      <button
        onClick={handleOpen}
        className={className ?? "text-[#111111]/60 hover:text-[#111111] transition-colors"}
        aria-label="Buscar"
        aria-expanded={isOpen}
      >
        <Search className="h-4.5 w-4.5" />
      </button>

      {!triggerOnly && <SearchDrawer open={isOpen} onClose={handleClose} />}
    </>
  );
}
