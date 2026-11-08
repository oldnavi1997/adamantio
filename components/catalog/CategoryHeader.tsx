import Link from "next/link";
import Image from "next/image";

type Miga = { name: string; href: string };
type Sub = { id: string; name: string; href: string; image: string | null };

/**
 * Cabecera de una página de categoría: migas, banner, título, descripción y
 * acceso a las subcategorías. Server Component: no manda JS al navegador.
 */
export function CategoryHeader({
  migas,
  titulo,
  descripcion,
  banner,
  subcategorias,
}: {
  migas: Miga[];
  titulo: string;
  descripcion: string | null;
  banner: string | null;
  subcategorias: Sub[];
}) {
  const conImagen = subcategorias.length > 0 && subcategorias.every((s) => s.image);

  return (
    <header className="mb-8">
      <nav aria-label="Migas de pan" className="mb-6">
        <ol className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#111111]/35">
          {migas.map((m, i) => (
            <li key={m.href} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden>/</span>}
              {i === migas.length - 1 ? (
                <span aria-current="page" className="text-[#111111]/60">{m.name}</span>
              ) : (
                <Link href={m.href} className="hover:text-[#111111]/60 transition-colors">{m.name}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {banner && (
        <div className="relative -mx-5 sm:mx-0 aspect-[16/7] sm:aspect-[16/5] bg-[#f8f7f4] overflow-hidden mb-8">
          <Image src={banner} alt={titulo} fill priority sizes="(max-width: 1280px) 100vw, 1280px" className="object-cover" />
        </div>
      )}

      <h1 className="text-2xl sm:text-3xl font-light text-[#111111]">{titulo}</h1>
      {descripcion && (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#111111]/60 whitespace-pre-line">{descripcion}</p>
      )}

      {subcategorias.length > 0 &&
        (conImagen ? (
          <ul className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {subcategorias.map((s) => (
              <li key={s.id}>
                <Link href={s.href} className="group block">
                  <div className="relative aspect-square bg-[#f8f7f4] overflow-hidden">
                    <Image
                      src={s.image!}
                      alt={s.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-wider text-[#111111]/70 group-hover:text-[#111111]">
                    {s.name}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="mt-6 flex flex-wrap gap-2">
            {subcategorias.map((s) => (
              <li key={s.id}>
                <Link
                  href={s.href}
                  className="inline-block px-4 py-2 text-xs uppercase tracking-wider border border-[#111111]/15 text-[#111111]/70 hover:border-[#111111] hover:text-[#111111] transition-colors"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        ))}
    </header>
  );
}

/**
 * Filtros del listado. Un `<form method="get">` corriente: funciona sin JS y
 * el servidor es quien filtra. Conserva el orden y la vista elegidos.
 */
export function CategoryFilters({
  params,
  accion,
}: {
  params: Record<string, string | undefined>;
  accion: string;
}) {
  const activos = !!(params.minPrice || params.maxPrice || params.disponibles);
  const campo =
    "w-24 px-2.5 py-2 border border-[#111111]/15 bg-white text-[#111111] focus:outline-none focus:border-[#d4af37]";
  return (
    <form method="get" action={accion} className="flex flex-wrap items-end gap-3 py-4 border-b border-[#dadadd] mb-2 text-xs">
      {(["sort", "view", "mview"] as const).map((k) =>
        params[k] ? <input key={k} type="hidden" name={k} value={params[k]} /> : null
      )}
      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wider text-[#111111]/40">Precio desde</span>
        <input type="number" name="minPrice" min={0} step="1" inputMode="numeric" defaultValue={params.minPrice} placeholder="S/ 0" className={campo} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wider text-[#111111]/40">Hasta</span>
        <input type="number" name="maxPrice" min={0} step="1" inputMode="numeric" defaultValue={params.maxPrice} placeholder="S/ 999" className={campo} />
      </label>
      <label className="flex items-center gap-2 py-2 cursor-pointer text-[#111111]/70">
        <input type="checkbox" name="disponibles" value="1" defaultChecked={params.disponibles === "1"} className="accent-[#d4af37]" />
        Solo disponibles
      </label>
      <button type="submit" className="px-4 py-2 bg-[#111111] text-white uppercase tracking-wider text-[10px] hover:bg-[#333] transition-colors">
        Filtrar
      </button>
      {activos && (
        <a href={accion} className="py-2 text-[#111111]/40 hover:text-[#111111] underline-offset-2 hover:underline">
          Limpiar
        </a>
      )}
    </form>
  );
}
