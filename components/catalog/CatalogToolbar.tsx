"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, Grid2X2, List, Square } from "lucide-react";
import { SortSelect } from "./SortSelect";
import { SortDrawer } from "./SortDrawer";
import { Suspense } from "react";

interface Props {
  total: number;
}

export function CatalogToolbar({ total }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "dense";
  const mview = searchParams.get("mview") ?? "2";

  const setView = (v: string) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("view", v);
    p.delete("page");
    router.push(`?${p.toString()}`);
  };

  const setMview = (v: string) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("mview", v);
    p.delete("page");
    router.push(`?${p.toString()}`);
  };

  const iconClass = (v: string) =>
    `transition-colors ${view === v ? "text-[#111111]" : "text-[#111111]/25 hover:text-[#111111]/60"}`;

  const mIconClass = (v: string) =>
    `transition-colors ${mview === v ? "text-[#111111]" : "text-[#111111]/25 hover:text-[#111111]/60"}`;

  return (
    <>
      {/* Mobile toolbar */}
      <div className="flex sm:hidden items-center justify-between py-3 border-b border-[#dadadd] mb-4">
        <Suspense>
          <SortDrawer />
        </Suspense>
        <div className="flex items-center gap-3">
          <button onClick={() => setMview("1")} aria-label="Un producto" className={mIconClass("1")}>
            <Square className="h-5 w-5" />
          </button>
          <button onClick={() => setMview("2")} aria-label="Dos productos" className={mIconClass("2")}>
            <Grid2X2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Desktop toolbar */}
      <div className="hidden sm:flex items-center justify-between py-3 border-b border-[#dadadd] mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setView("dense")} aria-label="Vista densa" className={iconClass("dense")}>
            <LayoutGrid className="h-5 w-5" />
          </button>
          <button onClick={() => setView("normal")} aria-label="Vista normal" className={iconClass("normal")}>
            <Grid2X2 className="h-5 w-5" />
          </button>
          <button onClick={() => setView("list")} aria-label="Vista lista" className={iconClass("list")}>
            <List className="h-5 w-5" />
          </button>
        </div>
        <p className="text-[10px] text-[#111111]/35 uppercase tracking-[0.2em]">
          {total} {total === 1 ? "producto" : "productos"}
        </p>
        <Suspense>
          <SortSelect />
        </Suspense>
      </div>
    </>
  );
}
