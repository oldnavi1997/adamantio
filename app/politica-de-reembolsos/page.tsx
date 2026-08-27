import Link from "next/link";

export const metadata = {
  title: "Política de Reembolsos",
  description:
    "Conoce la política de reembolsos y devoluciones de Adamantio: plazos, condiciones y proceso de devolución.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
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

function Ol({ children }: { children: React.ReactNode }) {
  return (
    <ol className="list-decimal list-outside pl-5 space-y-2 text-[#111111]/70 text-[15px] leading-relaxed">
      {children}
    </ol>
  );
}

export default function PoliticaReembolsosPage() {
  return (
    <div className="bg-[#F8F7F4] min-h-screen">
      <div className="border-b border-[#d5d5d5]">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-14">
          <p className="text-[10px] text-[#d4af37] uppercase tracking-[0.3em] mb-3">Adamantio</p>
          <h1
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
            className="text-3xl font-light text-[#111111] tracking-wide"
          >
            Política de Reembolsos
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
          En Adamantio trabajamos con dedicación para garantizar la satisfacción de nuestros clientes y la
          excelencia en la calidad de nuestras joyas. Sin embargo, entendemos que pueden surgir inconvenientes,
          por lo que hemos establecido una política de reembolsos clara y transparente para su tranquilidad.
        </P>

        <Section title="1. Plazo para Devoluciones y Reembolsos">
          <P>
            Aceptamos devoluciones de joyas dentro de un plazo de <strong>15 días naturales</strong> a partir
            de la fecha de recepción del producto. Es importante que se comunique con nuestro equipo de
            atención al cliente antes de proceder con cualquier devolución para recibir las instrucciones
            necesarias.
          </P>
        </Section>

        <Section title="2. Condiciones para la Devolución">
          <P>Para que una devolución sea aceptada, las joyas deben cumplir con las siguientes condiciones:</P>
          <Ul>
            <li>
              Los productos personalizados, grabados o hechos a medida no son elegibles para devoluciones ni
              reembolsos, salvo en casos de defectos de fabricación.
            </li>
            <li>
              Incluir el empaque original, etiquetas, certificados de autenticidad y cualquier accesorio
              adicional que se haya entregado con el producto.
            </li>
            <li>Estar en su estado original, sin signos de uso, desgaste, daño o alteraciones.</li>
          </Ul>
        </Section>

        <Section title="3. Proceso de Devolución">
          <P>El proceso para gestionar una devolución es el siguiente:</P>
          <Ol>
            <li>
              <strong>Notificación previa:</strong> Comuníquese con nuestro equipo de atención al cliente a
              través de{" "}
              <a href="mailto:adamantio@gmail.com" className="text-[#d4af37] hover:underline">
                adamantio@gmail.com
              </a>{" "}
              o al{" "}
              <a href="tel:+51997676742" className="text-[#d4af37] hover:underline">
                997 676 742
              </a>
              , proporcionando detalles del pedido y el motivo de la devolución.
            </li>
            <li>
              <strong>Empaque seguro:</strong> Asegúrese de embalar el producto adecuadamente en su empaque
              original para evitar daños durante el transporte.
            </li>
            <li>
              <strong>Envío del producto:</strong> Envíe la joya a la dirección proporcionada por nuestro
              equipo de atención al cliente.
            </li>
            <li>
              <strong>Confirmación y verificación:</strong> Una vez recibido el producto, realizaremos una
              inspección para verificar que cumpla con las condiciones establecidas.
            </li>
          </Ol>
        </Section>

        <Section title="4. Costos de Envío de la Devolución">
          <Ul>
            <li>
              Los gastos de envío asociados con la devolución serán asumidos por el cliente, excepto en los
              casos en que el producto presente defectos de fabricación o haya sido enviado incorrectamente.
            </li>
            <li>
              Recomendamos utilizar un servicio de mensajería con número de seguimiento, ya que no nos
              hacemos responsables por paquetes extraviados en el proceso de devolución.
            </li>
          </Ul>
        </Section>

        <Section title="5. Reembolsos">
          <Ul>
            <li>
              Si la devolución es aceptada, procederemos con el reembolso utilizando el mismo método de pago
              que se utilizó para la compra.
            </li>
            <li>
              El reembolso será procesado en un plazo de <strong>7 a 10 días hábiles</strong> después de
              haber recibido y verificado la joya.
            </li>
            <li>
              Tenga en cuenta que el tiempo para que el reembolso se refleje en su cuenta puede variar según
              la entidad bancaria.
            </li>
          </Ul>
        </Section>

        <Section title="6. Excepciones y Restricciones">
          <Ul>
            <li>
              <strong>Artículos personalizados:</strong> Las joyas personalizadas, con grabados o hechas a
              medida, no son elegibles para devoluciones ni reembolsos, salvo que presenten defectos de
              fábrica comprobables.
            </li>
            <li>
              <strong>Artículos en oferta:</strong> Los productos adquiridos en promoción o liquidación no
              son elegibles para reembolsos, excepto en caso de daños o defectos.
            </li>
            <li>
              <strong>Daños no atribuibles a la fabricación:</strong> No ofrecemos devoluciones ni reembolsos
              por productos que hayan sido dañados por mal uso, golpes, productos químicos o desgaste normal.
            </li>
          </Ul>
        </Section>

        <Section title="7. Garantía y Reparaciones">
          <P>
            En caso de que el producto presente algún defecto después del plazo de devolución, ofrecemos
            servicio de reparación bajo los términos de nuestra garantía, que puede variar según el tipo de
            joya adquirida.
          </P>
        </Section>

        <Section title="8. Asistencia Personalizada">
          <P>
            Si tiene dudas o inquietudes sobre nuestra política de reembolsos o desea iniciar un proceso de
            devolución, nuestro equipo de atención al cliente estará encantado de ayudarle. Puede contactarnos
            a través de{" "}
            <a href="mailto:adamantio@gmail.com" className="text-[#d4af37] hover:underline">
              adamantio@gmail.com
            </a>{" "}
            o al{" "}
            <a href="tel:+51997676742" className="text-[#d4af37] hover:underline">
              997 676 742
            </a>
            .
          </P>
          <P>
            Nos esforzamos por ofrecer un servicio transparente y satisfactorio, y valoramos su confianza en
            Adamantio.
          </P>
        </Section>
      </div>
    </div>
  );
}
