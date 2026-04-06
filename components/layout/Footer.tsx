import Link from "next/link";
import Image from "next/image";

const LOGO_URL =
  "https://res.cloudinary.com/dzqns7kss/image/upload/v1772665459/adamantio-logo-1024x299_ol5fgy.png";

const LEGAL_LINKS = [
  { href: "/terminos-de-servicio", label: "Términos de servicio" },
  { href: "/politica-de-reembolsos", label: "Política de reembolsos" },
  { href: "/politica-de-privacidad", label: "Política de privacidad" },
  { href: "/libro-de-reclamaciones", label: "Libro de reclamaciones" },
] as const;

export function Footer() {
  return (
    <footer className="mt-auto" style={{ background: "#111827", color: "#9ca3af" }}>
      <div className="max-w-[1080px] mx-auto px-4 pt-12 pb-6">
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-8"
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
          <section aria-label="Información legal">
            <h3
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: "#e5e7eb" }}
            >
              Información
            </h3>
            <ul className="space-y-2">
              {LEGAL_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm transition-colors hover:text-white"
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
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: "#e5e7eb" }}
            >
              Contacto
            </h3>
            <div className="flex gap-3">
              {/* Facebook */}
              <a
                href="https://www.facebook.com/adamantio.pe"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors"
                style={{ background: "rgba(255,255,255,0.08)", color: "#e5e7eb" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>
              {/* Instagram */}
              <a
                href="https://www.instagram.com/adamantio.pe"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors"
                style={{ background: "rgba(255,255,255,0.08)", color: "#e5e7eb" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
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
              {/* Visa */}
              <span
                className="inline-flex items-center justify-center w-11 h-7 rounded"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" }}
                title="Visa"
                aria-hidden="true"
              >
                <svg viewBox="0 0 48 16" width="32" height="11" fill="currentColor">
                  <text x="0" y="13" fontSize="14" fontWeight="700" fontFamily="sans-serif" letterSpacing="1">VISA</text>
                </svg>
              </span>
              {/* Mastercard */}
              <span
                className="inline-flex items-center justify-center w-11 h-7 rounded"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                title="Mastercard"
                aria-hidden="true"
              >
                <svg viewBox="0 0 38 24" width="28" height="18">
                  <circle cx="13" cy="12" r="10" fill="#eb001b" />
                  <circle cx="25" cy="12" r="10" fill="#f79e1b" />
                  <path d="M19 5.5a10 10 0 0 1 0 13A10 10 0 0 1 19 5.5z" fill="#ff5f00" />
                </svg>
              </span>
              {/* Amex */}
              <span
                className="inline-flex items-center justify-center w-11 h-7 rounded"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" }}
                title="American Express"
                aria-hidden="true"
              >
                <svg viewBox="0 0 48 16" width="32" height="11" fill="currentColor">
                  <text x="0" y="13" fontSize="11" fontWeight="700" fontFamily="sans-serif" letterSpacing="0.5">AMEX</text>
                </svg>
              </span>
              {/* Mercado Pago */}
              <span
                className="inline-flex items-center justify-center h-7 px-1.5 rounded"
                style={{ background: "#fff", border: "1px solid rgba(255,255,255,0.08)" }}
                title="Mercado Pago"
                aria-hidden="true"
              >
                <Image
                  src="https://res.cloudinary.com/dzqns7kss/image/upload/v1772250237/adama/products/mh1oidmqger1oie6botl.svg"
                  alt="Mercado Pago"
                  width={56}
                  height={18}
                  className="h-[18px] w-auto"
                />
              </span>
              {/* Diners */}
              <span
                className="inline-flex items-center justify-center w-11 h-7 rounded"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" }}
                title="Diners Club"
                aria-hidden="true"
              >
                <svg viewBox="0 0 38 24" width="28" height="18" fill="none">
                  <circle cx="14" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="24" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </span>
            </div>
          </div>

          <p className="text-xs" style={{ color: "#6b7280" }}>Hecho con cuidado en Perú</p>
        </div>
      </div>
    </footer>
  );
}
