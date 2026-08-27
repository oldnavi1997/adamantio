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
        style={{ top: "61px", backgroundColor: "rgba(15,23,42,0.35)", backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed left-0 right-0 z-50 transition-all duration-200 ease-out ${
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-1 pointer-events-none"
        }`}
        style={{
          top: "61px",
          backgroundColor: "#F8F7F4",
          borderBottom: "1px solid #d5d5d5",
          boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
        }}
      >
        {/* Input */}
        <div className="max-w-2xl mx-auto px-5 pt-4 pb-3">
          <div
            className="flex items-center gap-3 px-4 h-11 bg-white"
            style={{ border: "1px solid #d5d5d5" }}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 text-[#d4af37] shrink-0 animate-spin" />
            ) : (
              <Search className="h-4 w-4 text-[#94a3b8] shrink-0" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") goToAll(); }}
              placeholder="Buscar en Adamantio..."
              className="flex-1 bg-transparent text-[13px] text-[#111111] placeholder-[#94a3b8] focus:outline-none"
            />
            {query ? (
              <button
                onClick={() => clear()}
                className="text-[#94a3b8] hover:text-[#111111] transition-colors shrink-0"
                aria-label="Limpiar"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="text-[#94a3b8] hover:text-[#111111] transition-colors shrink-0"
                aria-label="Cerrar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div
            className="max-w-2xl mx-auto max-h-[60vh] overflow-y-auto"
            style={{ borderTop: "1px solid #ebebeb" }}
          >
            {results.map((hit, i) => {
              const { precio, antes } = precioConOferta(hit);
              return (
              <button
                key={hit.objectID}
                onClick={() => goToProduct(hit.slug)}
                className="flex items-center gap-4 w-full px-5 py-3 text-left transition-colors hover:bg-white"
                style={{ borderBottom: i < results.length - 1 ? "1px solid #f0ede8" : "none" }}
              >
                <div className="w-12 h-12 shrink-0 overflow-hidden bg-[#f0ede8]">
                  {hit.images[0] && (
                    <img src={hit.images[0]} alt={hit.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#111111] truncate leading-tight">
                    {hit.name}
                  </p>
                  <p className="text-[11px] text-[#94a3b8] mt-0.5 truncate">
                    {hit.brand || hit.category}
                  </p>
                </div>
                <span className="text-[13px] shrink-0 ml-2 text-right">
                  <span className="block font-semibold text-[#111111]">{formatPEN(precio)}</span>
                  {antes !== null && (
                    <span className="block text-[11px] font-normal text-[#111111]/35 line-through">
                      {formatPEN(antes)}
                    </span>
                  )}
                </span>
              </button>
              );
            })}

            <button
              onClick={goToAll}
              className="flex items-center justify-center gap-2 w-full py-3 text-[12px] font-medium text-[#d4af37] hover:text-[#b8962e] transition-colors"
              style={{ borderTop: "1px solid #ebebeb" }}
            >
              Ver todos los resultados para &quot;{query}&quot;
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* No results */}
        {query.trim() && results.length === 0 && !loading && (
          <div
            className="max-w-2xl mx-auto px-5 py-5 text-center"
            style={{ borderTop: "1px solid #ebebeb" }}
          >
            <p className="text-[13px] text-[#94a3b8]">
              Sin resultados para &quot;{query}&quot;
            </p>
          </div>
        )}

        {/* Empty hint */}
        {!query && (
          <div className="max-w-2xl mx-auto px-5 pb-4">
            <p className="text-[11px] text-[#94a3b8] tracking-wide">
              Buscá por nombre, marca o categoría
            </p>
          </div>
        )}
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
