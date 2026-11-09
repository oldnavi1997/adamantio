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

      {/* Oculto a la vista, pero la página sigue teniendo su encabezado principal. */}
      <h1 className="sr-only">{titulo}</h1>
      {descripcion && (
        <p className="max-w-2xl text-sm leading-relaxed text-[#111111]/60 whitespace-pre-line">{descripcion}</p>
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
