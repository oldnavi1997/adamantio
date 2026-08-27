import Link from "next/link";
import { ReclamacionForm } from "@/components/legal/ReclamacionForm";

export const metadata = {
  title: "Libro de Reclamaciones",
  description:
    "Libro de reclamaciones virtual de Adamantio. Presenta tu reclamo o queja en línea de conformidad con la normativa peruana.",
};

function Section({ title, children, highlight }: { title: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <section
      className={`space-y-4 ${highlight ? "p-6 rounded-lg border border-[#d4af37]/30 bg-[#d4af37]/5" : ""}`}
    >
      <h2
        style={{ fontFamily: "var(--font-sans, sans-serif)" }}
        className="text-xl font-light text-[#111111] tracking-wide"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[#111111]/70 text-[15px] leading-relaxed">{children}</p>;
}

function Ul({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-disc list-outside pl-5 space-y-2 text-[#111111]/70 text-[15px] leading-relaxed">
      {children}
    </ul>
  );
}

export default function LibroReclamacionesPage() {
  return (
    <div className="bg-[#F8F7F4] min-h-screen">
      <div className="border-b border-[#d5d5d5]">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-14">
          <p className="text-[10px] text-[#d4af37] uppercase tracking-[0.3em] mb-3">Adamantio</p>
          <h1
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
            className="text-3xl font-light text-[#111111] tracking-wide"
          >
            Libro de Reclamaciones
          </h1>
          <div className="mt-4 h-px bg-gradient-to-r from-[#d4af37]/40 to-transparent w-24" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16 space-y-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[#111111]/60 hover:text-[#111111] transition-colors"
        >
          ← Volver al inicio
        </Link>

        <P>
          Conforme al artículo 150 del Código de Protección y Defensa del Consumidor (Ley N.º 29571)
          y su Reglamento (D.S. N.º 011-2011-PCM), Adamantio pone a disposición de los consumidores
          su Libro de Reclamaciones virtual. Completa el formulario y recibirás de inmediato, en el
          correo que registres, una copia de tu hoja de reclamación con su número correlativo.
        </P>

        <section aria-label="Formulario de reclamación">
          <ReclamacionForm />
        </section>

        <Section title="Información importante" highlight>
          <Ul>
            <li>
              <strong>Reclamo</strong> es la disconformidad relacionada con el producto o servicio
              recibido; <strong>queja</strong> es el malestar respecto a la atención al público y no
              está referida al producto o servicio.
            </li>
            <li>
              Si no consignas como mínimo tu nombre, documento de identidad, domicilio o correo
              electrónico y el detalle de lo reclamado, conforme al artículo 5 del Reglamento del
              Libro de Reclamaciones el reclamo se considerará como no presentado.
            </li>
            <li>
              La formulación del reclamo no impide acudir a otras vías de solución de controversias
              ni es requisito previo para interponer una denuncia ante el Indecopi.
            </li>
            <li>
              Daremos respuesta al reclamo en un plazo no mayor a{" "}
              <strong>quince (15) días hábiles</strong>, que puede ampliarse por quince (15) días
              hábiles adicionales cuando la naturaleza del reclamo lo justifique, comunicándotelo
              antes de que venza el plazo inicial.
            </li>
            <li>
              Conservamos las hojas de reclamación por un plazo mínimo de dos (2) años desde su
              presentación y las ponemos a disposición del Indecopi cuando las requiera.
            </li>
            <li>
              Los datos que registres se tratan únicamente para atender tu reclamo, conforme a la{" "}
              <Link href="/politica-de-privacidad" className="text-[#d4af37] hover:underline">
                política de privacidad
              </Link>
              .
            </li>
          </Ul>
        </Section>

        <Section title="Otros canales de atención">
          <P>
            Si prefieres, también puedes escribirnos a{" "}
            <a href="mailto:adamantio@gmail.com" className="text-[#d4af37] hover:underline">
              adamantio@gmail.com
            </a>{" "}
            o contactarnos al{" "}
            <a href="tel:+51997676742" className="text-[#d4af37] hover:underline">
              997 676 742
            </a>
            . Estos canales no reemplazan al Libro de Reclamaciones: para que tu reclamo quede
            registrado con número correlativo, utiliza el formulario de esta página.
          </P>
          <P>
            Para presentar una denuncia ante el Indecopi puedes acudir a{" "}
            <a
              href="https://www.indecopi.gob.pe"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#d4af37] hover:underline"
            >
              indecopi.gob.pe
            </a>{" "}
            o llamar al 224 7777 (Lima) / 0800 4 4040 (provincias).
          </P>
        </Section>
      </div>
    </div>
  );
}
