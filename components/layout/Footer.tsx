import Link from "next/link";
import Image from "next/image";
import { MarcasDeTarjeta } from "@/components/ui/MarcasDeTarjeta";

const LOGO_URL =
  "https://res.cloudinary.com/dzqns7kss/image/upload/v1772665459/adamantio-logo-1024x299_ol5fgy.png";

const LEGAL_LINKS = [
  { href: "/terminos-de-servicio", label: "Términos de servicio" },
  { href: "/politica-de-reembolsos", label: "Política de reembolsos" },
  { href: "/politica-de-privacidad", label: "Política de privacidad" },
  { href: "/libro-de-reclamaciones", label: "Libro de reclamaciones" },
] as const;

const SOCIAL = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/adamantio.pe",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/adamantio.pe",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@adamantium.pe",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97a9.9 9.9 0 0 1-1.62-.93c-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
  },
];

export function Footer() {
  return (
    <footer className="mt-auto" style={{ background: "#111827", color: "#9ca3af" }}>
      <div className="max-w-[1080px] mx-auto px-4 pt-12 pb-6">
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* Brand */}
          <section aria-label="Marca">
            <Link href="/" className="inline-block mb-3">
              <Image
                src={LOGO_URL}
                alt="Adamantio"
                width={120}
                height={35}
                className="h-8 w-auto object-contain"
                style={{ filter: "brightness(0) invert(1)" }}
              />
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: "#9ca3af", maxWidth: 260 }}>
              Joyas con significado. Mensajes ocultos y conexión eterna en cada pieza.
            </p>
          </section>

          {/* Legal */}
          <section aria-label="Explora">
            <h3
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: "#e5e7eb", fontSize: "14px" }}
            >
              Explora
            </h3>
            <ul className="space-y-1.5">
              {LEGAL_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-xs transition-colors hover:text-white"
                    style={{ color: "#9ca3af" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* Contact & Social */}
          <section aria-label="Contacto">
            <h3
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: "#e5e7eb", fontSize: "14px" }}
            >
              Contacto
            </h3>
            <div className="flex gap-3">
              {SOCIAL.map(({ name, href, icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors"
                  style={{ background: "rgba(255,255,255,0.08)", color: "#e5e7eb" }}
                >
                  {icon}
                </a>
              ))}
            </div>
          </section>
        </div>

        {/* Footer bottom */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <p className="text-xs" style={{ color: "#6b7280" }}>
            © {new Date().getFullYear()} Adamantio. Todos los derechos reservados.
          </p>

          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs uppercase tracking-wider" style={{ color: "#6b7280" }}>
              Aceptamos
            </span>
            <div className="flex items-center gap-2">
              <MarcasDeTarjeta />
              {/* Mercado Pago */}
              <span
                className="inline-flex items-center justify-center h-6 px-1.5 rounded"
                style={{ background: "#fff", border: "1px solid #D9D9D9" }}
                title="Mercado Pago"
                aria-hidden="true"
              >
                <Image
                  src="https://res.cloudinary.com/dzqns7kss/image/upload/v1772250237/adama/products/mh1oidmqger1oie6botl.svg"
                  alt="Mercado Pago"
                  width={56}
                  height={18}
                  className="h-[16px] w-auto"
                />
              </span>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
