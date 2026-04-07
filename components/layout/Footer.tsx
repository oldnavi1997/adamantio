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
              {/* Visa */}
              <span
                className="inline-flex items-center justify-center rounded overflow-hidden"
                title="Visa"
                aria-hidden="true"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="24" viewBox="0 -11 70 70" fill="none">
                  <rect x="0.5" y="0.5" width="69" height="47" rx="5.5" fill="white" stroke="#D9D9D9" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M21.2505 32.5165H17.0099L13.8299 20.3847C13.679 19.8267 13.3585 19.3333 12.8871 19.1008C11.7106 18.5165 10.4142 18.0514 9 17.8169V17.3498H15.8313C16.7742 17.3498 17.4813 18.0514 17.5991 18.8663L19.2491 27.6173L23.4877 17.3498H27.6104L21.2505 32.5165ZM29.9675 32.5165H25.9626L29.2604 17.3498H33.2653L29.9675 32.5165ZM38.4467 21.5514C38.5646 20.7346 39.2717 20.2675 40.0967 20.2675C41.3931 20.1502 42.8052 20.3848 43.9838 20.9671L44.6909 17.7016C43.5123 17.2345 42.216 17 41.0395 17C37.1524 17 34.3239 19.1008 34.3239 22.0165C34.3239 24.2346 36.3274 25.3992 37.7417 26.1008C39.2717 26.8004 39.861 27.2675 39.7431 27.9671C39.7431 29.0165 38.5646 29.4836 37.3881 29.4836C35.9739 29.4836 34.5596 29.1338 33.2653 28.5494L32.5582 31.8169C33.9724 32.3992 35.5025 32.6338 36.9167 32.6338C41.2752 32.749 43.9838 30.6502 43.9838 27.5C43.9838 23.5329 38.4467 23.3004 38.4467 21.5514ZM58 32.5165L54.82 17.3498H51.4044C50.6972 17.3498 49.9901 17.8169 49.7544 18.5165L43.8659 32.5165H47.9887L48.8116 30.3004H53.8772L54.3486 32.5165H58ZM51.9936 21.4342L53.1701 27.1502H49.8723L51.9936 21.4342Z" fill="#172B85" />
                </svg>
              </span>
              {/* Mastercard */}
              <span
                className="inline-flex items-center justify-center rounded overflow-hidden"
                title="Mastercard"
                aria-hidden="true"
              >
                <svg viewBox="0 0 48 32" width="36" height="24">
                  <rect width="48" height="32" rx="4" fill="white" stroke="#D9D9D9" strokeWidth="0.5" />
                  <circle cx="18" cy="16" r="9" fill="#eb001b" />
                  <circle cx="30" cy="16" r="9" fill="#f79e1b" />
                  <path fill="#ff5f00" d="M24 8.2a9.9 9.9 0 0 1 0 15.6A9.9 9.9 0 0 1 24 8.2z" />
                </svg>
              </span>
              {/* American Express */}
              <span
                className="inline-flex items-center justify-center rounded overflow-hidden"
                title="American Express"
                aria-hidden="true"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="24" viewBox="0 -9 58 58" fill="none">
                  <rect x="0.5" y="0.5" width="57" height="39" rx="3.5" fill="#006FCF" stroke="#F3F3F3" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M11.8632 28.8937V20.6592H21.1869L22.1872 21.8787L23.2206 20.6592H57.0632V28.3258C57.0632 28.3258 56.1782 28.8855 55.1546 28.8937H36.4152L35.2874 27.5957V28.8937H31.5916V26.6779C31.5916 26.6779 31.0867 26.9872 29.9953 26.9872H28.7373V28.8937H23.1415L22.1426 27.6481L21.1284 28.8937H11.8632ZM1 14.4529L3.09775 9.86914H6.7256L7.9161 12.4368V9.86914H12.4258L13.1346 11.7249L13.8216 9.86914H34.0657V10.8021C34.0657 10.8021 35.1299 9.86914 36.8789 9.86914L43.4474 9.89066L44.6173 12.4247V9.86914H48.3913L49.43 11.3247V9.86914H53.2386V18.1037H49.43L48.4346 16.6434V18.1037H42.8898L42.3321 16.8056H40.8415L40.293 18.1037H36.5327C35.0277 18.1037 34.0657 17.1897 34.0657 17.1897V18.1037H28.3961L27.2708 16.8056V18.1037H6.18816L5.63093 16.8056H4.14505L3.59176 18.1037H1V14.4529Z" fill="white" />
                </svg>
              </span>
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
              {/* Diners Club */}
              <span
                className="inline-flex items-center justify-center rounded overflow-hidden"
                title="Diners Club"
                aria-hidden="true"
              >
                <svg viewBox="0 0 48 32" width="36" height="24">
                  <rect width="48" height="32" rx="4" fill="white" stroke="#D9D9D9" strokeWidth="0.5" />
                  <circle cx="18" cy="16" r="8" fill="none" stroke="#004A97" strokeWidth="1.5" />
                  <circle cx="30" cy="16" r="8" fill="none" stroke="#004A97" strokeWidth="1.5" />
                </svg>
              </span>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
