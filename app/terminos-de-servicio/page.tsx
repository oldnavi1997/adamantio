import Link from "next/link";

export const metadata = {
  title: "Términos de Servicio | Adamantio",
  description:
    "Lee los términos de servicio de Adamantio: condiciones de uso, compras, precios y responsabilidades.",
};

function Section({ number, title, children }: { number?: string; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2
        style={{ fontFamily: "var(--font-sans, sans-serif)" }}
        className="text-xl font-light text-[#1e293b] tracking-wide"
      >
        {number ? `${number} – ${title}` : title}
      </h2>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[#334155]/70 text-[15px] leading-relaxed">{children}</p>;
}

export default function TerminosDeServicioPage() {
  return (
    <div className="bg-[#F8F7F4] min-h-screen">
      <div className="border-b border-[#d5d5d5]">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-14">
          <p className="text-[10px] text-[#d4af37] uppercase tracking-[0.3em] mb-3">Adamantio</p>
          <h1
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
            className="text-3xl font-light text-[#1e293b] tracking-wide"
          >
            Términos de Servicio
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

        <Section title="1. Condiciones Generales">
          <P>
            Al utilizar este sitio web, declaras que tienes al menos la mayoría de edad en tu lugar de
            residencia, o que eres mayor de edad y has dado tu consentimiento para permitir que tus dependientes
            menores utilicen este sitio. No debes usar nuestros productos para ningún propósito ilegal o no
            autorizado, ni violar ninguna ley en tu jurisdicción al utilizarlos.
          </P>
        </Section>

        <Section title="2. Exactitud, Exhaustividad y Actualidad de la Información">
          <P>
            No nos responsabilizamos si la información disponible en este sitio no es exacta, completa o
            actual. El material en este sitio se proporciona solo para información general y no debe ser la
            única base para tomar decisiones sin consultar fuentes de información más precisas, completas o
            más oportunas.
          </P>
        </Section>

        <Section title="3. Modificaciones al Servicio y Precios">
          <P>
            Los precios de nuestros productos están sujetos a cambios sin previo aviso. Nos reservamos el
            derecho de modificar o descontinuar el Servicio (o cualquier parte del contenido) en cualquier
            momento sin previo aviso.
          </P>
        </Section>

        <Section title="4. Productos o Servicios">
          <P>
            Algunos productos o servicios pueden estar disponibles exclusivamente en línea a través del sitio
            web. Estos productos o servicios pueden tener cantidades limitadas y están sujetos a devolución o
            cambio solo según nuestra{" "}
            <Link href="/politica-de-reembolsos" className="text-[#d4af37] hover:underline">
              Política de Reembolsos
            </Link>
            . Hemos hecho todo lo posible para mostrar con la mayor precisión posible los colores y las
            imágenes de nuestros productos. No podemos garantizar que la visualización de cualquier color en
            tu monitor sea precisa.
          </P>
        </Section>

        <Section title="5. Exactitud de la Facturación y la Información de la Cuenta">
          <P>
            Nos reservamos el derecho de rechazar cualquier pedido que realices con nosotros. Podemos, a
            nuestra discreción, limitar o cancelar las cantidades compradas por persona, por hogar o por
            pedido. En el caso de que realicemos un cambio o cancelemos un pedido, intentaremos notificarte
            contactándote por correo electrónico y/o la dirección de facturación o número de teléfono
            proporcionado al momento de hacer el pedido.
          </P>
        </Section>

        <Section title="6. Herramientas Opcionales">
          <P>
            Podemos proporcionarte acceso a herramientas de terceros sobre las cuales no monitoreamos ni
            tenemos control. Reconoces y aceptas que proporcionamos acceso a dichas herramientas «tal cual»
            y «según disponibilidad» sin garantías, representaciones o condiciones de ningún tipo y sin
            ningún respaldo.
          </P>
        </Section>

        <Section title="7. Enlaces de Terceros">
          <P>
            Ciertos contenidos, productos y servicios disponibles a través de nuestro Servicio pueden incluir
            materiales de terceros. Los enlaces de terceros en este sitio pueden dirigirte a sitios web de
            terceros que no están afiliados con nosotros. No somos responsables de examinar o evaluar el
            contenido o la exactitud y no garantizamos ni tendremos ninguna obligación o responsabilidad por
            materiales o sitios web de terceros.
          </P>
        </Section>

        <Section title="8. Comentarios de los Usuarios, Retroalimentación y Otras Presentaciones">
          <P>
            Si, a nuestra solicitud o sin ella, envías ideas creativas, sugerencias, propuestas, planes u
            otros materiales ya sea en línea, por correo electrónico o de otra manera (colectivamente,
            «comentarios»), aceptas que podemos, en cualquier momento, sin restricción, editar, copiar,
            publicar, distribuir, traducir y de otro modo usar en cualquier medio cualquier comentario que
            nos envíes.
          </P>
        </Section>

        <Section title="9. Información Personal">
          <P>
            Tu presentación de información personal a través de la tienda se rige por nuestra{" "}
            <Link href="/politica-de-privacidad" className="text-[#d4af37] hover:underline">
              Política de Privacidad
            </Link>
            .
          </P>
        </Section>

        <Section title="10. Errores, Inexactitudes y Omisiones">
          <P>
            Ocasionalmente puede haber información en nuestro sitio o en el Servicio que contiene errores
            tipográficos, inexactitudes u omisiones que pueden relacionarse con descripciones de productos,
            precios, promociones, ofertas, cargos de envío, tiempos de tránsito y disponibilidad. Nos
            reservamos el derecho de corregir cualquier error, inexactitud u omisión, y de cambiar o
            actualizar la información o cancelar pedidos si alguna información en el Servicio es inexacta en
            cualquier momento sin previo aviso.
          </P>
        </Section>

        <Section title="11. Usos Prohibidos">
          <P>
            Además de otras prohibiciones establecidas en los Términos de Servicio, se te prohíbe usar el
            sitio o su contenido: (a) para cualquier propósito ilegal; (b) para solicitar a otros que
            realicen o participen en actos ilegales; (c) para violar cualquier regulación, regla, ley u
            ordenanza; (d) para infringir derechos de propiedad intelectual; (e) para acosar, abusar,
            insultar o discriminar; (f) para presentar información falsa o engañosa; (g) para cargar virus o
            código malicioso; (h) para recopilar información personal de otros; (i) para enviar spam o
            phishing; (j) para fines obscenos o inmorales; o (k) para interferir con las características de
            seguridad del Servicio.
          </P>
        </Section>

        <Section title="12. Descargo de Responsabilidad de Garantías; Limitación de Responsabilidad">
          <P>
            No garantizamos que tu uso de nuestro servicio será ininterrumpido, oportuno, seguro o libre de
            errores. El servicio y todos los productos y servicios se proporcionan «tal cual» y «según
            disponibilidad» para tu uso, sin ninguna representación, garantía o condición de ningún tipo. En
            ningún caso Adamantio, nuestros directores, funcionarios, empleados, afiliados, agentes o
            proveedores serán responsables por cualquier daño directo, indirecto, incidental, punitivo o
            consecuente que surja del uso del servicio o de los productos adquiridos.
          </P>
        </Section>

        <Section title="13. Indemnización">
          <P>
            Aceptas indemnizar, defender y eximir de responsabilidad a Adamantio y nuestras matrices,
            subsidiarias, afiliados, socios, funcionarios, directores, agentes y empleados, de cualquier
            reclamación o demanda, incluidos los honorarios razonables de abogados, realizados por cualquier
            tercero debido a tu incumplimiento de estos Términos de Servicio o tu violación de cualquier ley
            o los derechos de un tercero.
          </P>
        </Section>

        <Section title="14. Divisibilidad">
          <P>
            En caso de que se determine que cualquier disposición de estos Términos de Servicio es ilegal,
            nula o inaplicable, dicha disposición será exigible en la medida máxima permitida por la ley
            aplicable, y dicha determinación no afectará la validez y aplicabilidad de las demás
            disposiciones restantes.
          </P>
        </Section>

        <Section title="15. Terminación">
          <P>
            Las obligaciones incurridas antes de la fecha de terminación sobrevivirán a la terminación de
            este acuerdo. Estos Términos de Servicio son efectivos hasta que tú o nosotros los terminemos.
            Si, a nuestro juicio, fallas en el cumplimiento de cualquier término, podemos terminar este
            acuerdo en cualquier momento sin previo aviso.
          </P>
        </Section>

        <Section title="16. Acuerdo Completo">
          <P>
            El hecho de que no ejerzamos algún derecho o disposición no constituirá una renuncia al mismo.
            Estos Términos de Servicio y cualquier política publicada por nosotros en este sitio constituyen
            el acuerdo completo entre tú y nosotros y rigen tu uso del Servicio.
          </P>
        </Section>

        <Section title="17. Ley Aplicable">
          <P>
            Estos Términos de Servicio y cualquier acuerdo en el que te proporcionemos servicios se regirán
            e interpretarán de acuerdo con las leyes de la <strong>República del Perú</strong>.
          </P>
        </Section>

        <Section title="18. Cambios a los Términos de Servicio">
          <P>
            Nos reservamos el derecho de actualizar, cambiar o reemplazar cualquier parte de estos Términos
            publicando actualizaciones en nuestro sitio web. Es tu responsabilidad revisar nuestro sitio
            periódicamente. Tu uso continuo del sitio después de la publicación de cualquier cambio
            constituye la aceptación de dichos cambios.
          </P>
        </Section>
      </div>
    </div>
  );
}
