import Link from "next/link";

export const metadata = {
  title: "Libro de Reclamaciones | Adamantio",
  description:
    "Libro de reclamaciones de Adamantio. Presenta tu reclamo o queja de conformidad con la normativa peruana.",
};

function Section({ title, children, highlight }: { title: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <section
      className={`space-y-4 ${highlight ? "p-6 rounded-lg border border-[#d4af37]/30 bg-[#d4af37]/5" : ""}`}
    >
      <h2
        style={{ fontFamily: "var(--font-sans, sans-serif)" }}
        className="text-xl font-light text-[#1e293b] tracking-wide"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[#334155]/70 text-[15px] leading-relaxed">{children}</p>;
}

function Ul({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-disc list-outside pl-5 space-y-2 text-[#334155]/70 text-[15px] leading-relaxed">
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
            className="text-3xl font-light text-[#1e293b] tracking-wide"
          >
            Libro de Reclamaciones
          </h1>
          <div className="mt-4 h-px bg-gradient-to-r from-[#d4af37]/40 to-transparent w-24" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16 space-y-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[#334155]/60 hover:text-[#1e293b] transition-colors"
        >
          ← Volver al inicio
        </Link>

        <P>
          De conformidad con la normativa peruana, Adamantio pone a disposición de los consumidores el Libro
          de Reclamaciones. A continuación se detallan los datos y secciones que debe consignar para presentar
          su reclamo o queja.
        </P>

        <Section title="1. Identificación del Consumidor Reclamante">
          <Ul>
            <li>Nombres y apellidos</li>
            <li>Tipo de documento (DNI, CE, RUC, Pasaporte) y número de documento</li>
            <li>Celular</li>
            <li>Departamento, provincia, distrito</li>
            <li>Dirección y referencia</li>
            <li>Correo electrónico</li>
            <li>
              Indicación de si es menor de edad (en cuyo caso se consignan los datos del apoderado)
            </li>
          </Ul>
          <P>
            <strong>Datos del apoderado (si aplica):</strong> Tipo y número de documento, celular, nombres y
            apellidos.
          </P>
        </Section>

        <Section title="2. Identificación del Bien Contratado">
          <Ul>
            <li>Tipo de consumo (producto o servicio)</li>
            <li>N.º de pedido</li>
            <li>Fecha del incidente</li>
            <li>Monto del producto o servicio contratado</li>
            <li>Descripción del producto o servicio</li>
          </Ul>
        </Section>

        <Section title="3. Detalle de la Reclamación y Pedido del Consumidor">
          <Ul>
            <li>Tipo de reclamo (reclamo o queja)</li>
            <li>Detalle de la reclamación o queja</li>
            <li>Pedido concreto del consumidor</li>
          </Ul>
        </Section>

        <Section title="4. Observaciones y Condición">
          <P>El consumidor declara encontrarse conforme con los términos de su reclamo o queja.</P>
        </Section>

        <Section title="Información Importante" highlight>
          <Ul>
            <li>
              En caso de que el consumidor no consigne como mínimo su nombre, DNI, domicilio o correo
              electrónico y el detalle del reclamo o queja, de conformidad con el artículo 5 del Reglamento
              del Libro de Reclamaciones, estos se considerarán como no presentados.
            </li>
            <li>
              La formulación del reclamo no excluye el recurso a otros medios de resolución de controversias
              ni es un requisito previo para presentar una denuncia ante el Indecopi.
            </li>
            <li>
              El proveedor deberá dar respuesta al reclamo en un plazo no mayor a{" "}
              <strong>quince (15) días calendario</strong>, pudiendo extender el plazo hasta quince días
              adicionales.
            </li>
            <li>
              Con la firma del documento, el cliente autoriza a ser contactado después de la tramitación de
              la reclamación para evaluar la calidad y satisfacción del proceso de atención.
            </li>
          </Ul>
        </Section>

        <Section title="Cómo Presentar su Reclamo">
          <P>
            Para registrar su reclamo o queja en nuestro Libro de Reclamaciones, puede enviar un correo a{" "}
            <a href="mailto:adamantio@gmail.com" className="text-[#d4af37] hover:underline">
              adamantio@gmail.com
            </a>{" "}
            o contactarnos al{" "}
            <a href="tel:+51997676742" className="text-[#d4af37] hover:underline">
              997 676 742
            </a>
            . También puede utilizar el formulario de contacto disponible en{" "}
            <a
              href="https://www.adamantio.pe"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#d4af37] hover:underline"
            >
              adamantio.pe
            </a>
            .
          </P>
        </Section>
      </div>
    </div>
  );
}
