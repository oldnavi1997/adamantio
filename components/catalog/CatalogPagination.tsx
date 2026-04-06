interface Props {
  page: number;
  pages: number;
  params: Record<string, string | undefined>;
}

function buildHref(params: Record<string, string | undefined>, p: number) {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && k !== "page") next.set(k, v);
  }
  next.set("page", String(p));
  return `?${next.toString()}`;
}

function getPageNumbers(page: number, pages: number): (number | "...")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);

  const items: (number | "...")[] = [1];

  const left = Math.max(2, page - 1);
  const right = Math.min(pages - 1, page + 1);

  if (left > 2) items.push("...");
  for (let i = left; i <= right; i++) items.push(i);
  if (right < pages - 1) items.push("...");

  items.push(pages);
  return items;
}

export function CatalogPagination({ page, pages, params }: Props) {
  if (pages <= 1) return null;

  const items = getPageNumbers(page, pages);

  return (
    <nav className="flex items-center justify-center border-b border-[#dadadd] w-full mt-12">
      <div className="flex -mb-px">

        {/* Prev */}
        {page > 1 ? (
          <a
            href={buildHref(params, page - 1)}
            className="px-4 py-4 text-[#111111]/35 hover:text-[#111111] text-sm transition-colors"
            aria-label="Anterior"
          >
            &lt;
          </a>
        ) : (
          <span className="px-4 py-4 text-[#111111]/15 text-sm cursor-default select-none">
            &lt;
          </span>
        )}

        {items.map((item, i) =>
          item === "..." ? (
            <span key={`ellipsis-${i}`} className="px-4 py-4 text-[#111111]/35 text-sm select-none">
              ...
            </span>
          ) : item === page ? (
            <span
              key={item}
              className="px-5 py-4 border-l border-r border-[#dadadd] border-b-2 border-b-[#111111] text-[#111111] font-medium text-sm select-none"
            >
              {item}
            </span>
          ) : (
            <a
              key={item}
              href={buildHref(params, item)}
              className="px-4 py-4 text-[#111111]/50 hover:text-[#111111] text-sm transition-colors"
            >
              {item}
            </a>
          )
        )}

        {/* Next */}
        {page < pages ? (
          <a
            href={buildHref(params, page + 1)}
            className="px-4 py-4 text-[#111111]/35 hover:text-[#111111] text-sm transition-colors"
            aria-label="Siguiente"
          >
            &gt;
          </a>
        ) : (
          <span className="px-4 py-4 text-[#111111]/15 text-sm cursor-default select-none">
            &gt;
          </span>
        )}

      </div>
    </nav>
  );
}
