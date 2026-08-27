import Link from "next/link";

export const metadata = {
  title: "Política de Privacidad",
  description:
    "Conoce cómo Adamantio recopila, utiliza y protege tu información personal.",
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

export default function PoliticaPrivacidadPage() {
  return (
    <div className="bg-[#F8F7F4] min-h-screen">
      <div className="border-b border-[#d5d5d5]">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-14">
          <p className="text-[10px] text-[#d4af37] uppercase tracking-[0.3em] mb-3">Adamantio</p>
          <h1
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
            className="text-3xl font-light text-[#111111] tracking-wide"
          >
            Política de Privacidad
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
          Esta Política de Privacidad describe cómo Adamantio (en adelante, el «Sitio», «nosotros» o
          «nuestro») recopila, utiliza y divulga su información personal al visitar o utilizar nuestros
          servicios, al realizar una compra en{" "}
          <a href="https://www.adamantio.pe" className="text-[#d4af37] hover:underline">
            adamantio.pe
          </a>{" "}
          o al comunicarse con nosotros de cualquier otra manera. Los términos «usted» y «su» hacen
          referencia a usted como usuario de los Servicios, ya sea en calidad de cliente, visitante del
          sitio web o como cualquier otro individuo cuya información hayamos recopilado.
        </P>

        <Section title="Cambios en la Política de Privacidad">
          <P>
            Esta Política de Privacidad se podrá actualizar puntualmente para reflejar cambios en nuestras
            prácticas o por cualesquiera otras razones operativas, legales o normativas. Publicaremos la
            Política de Privacidad revisada en el Sitio y actualizaremos la fecha de «Última actualización».
          </P>
        </Section>

        <Section title="Recopilación y Utilización de su Información Personal">
          <P>
            Para prestar los Servicios, recopilamos información personal sobre usted de una variedad de
            fuentes. La información que recopilamos y utilizamos varía en función de cómo interactúa con
            nosotros. Podremos usar la información que recopilamos para comunicarnos con usted, proporcionarle
            o mejorar los Servicios, cumplir con cualquier obligación legal aplicable, hacer cumplir los
            términos de servicio aplicables y proteger o defender los Servicios.
          </P>
        </Section>

        <Section title="Información Personal que Recopilamos">
          <P>
            Los tipos de información personal que obtenemos sobre usted dependen de cómo interactúa con
            nuestro Sitio y cómo utiliza nuestros Servicios. Las secciones siguientes describen las
            categorías y tipos específicos de información personal que recopilamos.
          </P>
        </Section>

        <Section title="Información que Recopilamos Directamente de Usted">
          <P>
            La información que nos envía directamente puede incluir: información de compras (artículos que
            ve, coloca en su carrito o guarda), reseñas y recomendaciones. Algunas características de los
            Servicios pueden requerir que nos proporcione directamente cierta información sobre usted.
            Puede optar por no proporcionar estos datos; sin embargo, ello puede impedirle usar o acceder
            a estas funciones.
          </P>
        </Section>

        <Section title="Información que Recopilamos sobre su Uso">
          <P>
            También podemos recopilar automáticamente cierta información sobre su interacción con los
            Servicios («Datos de uso»). Para ello podemos utilizar cookies, píxeles y tecnologías similares.
            Los Datos de uso pueden incluir información sobre cómo accede y utiliza nuestro Sitio, incluida
            información del dispositivo, del navegador, de su conexión de red, su dirección IP y otra
            información sobre su interacción con los Servicios.
          </P>
        </Section>

        <Section title="Datos de Niños">
          <P>
            Los Servicios no están destinados al uso por parte de niños, por lo que no recopilamos de manera
            intencionada ninguna información personal sobre niños. Si usted es padre o tutor de un niño que
            nos ha proporcionado su información personal, puede comunicarse con nosotros para solicitar su
            eliminación.
          </P>
        </Section>

        <Section title="Seguridad y Retención de su Información">
          <P>
            Ninguna medida de seguridad es perfecta o impenetrable. La información que nos envíe puede no
            estar segura mientras esté en tránsito; recomendamos no utilizar canales inseguros para comunicar
            información sensible. El tiempo de conservación de su información personal depende de factores
            como si necesitamos la información para mantener su cuenta, prestar los Servicios, cumplir
            obligaciones legales, resolver disputas o hacer cumplir políticas aplicables.
          </P>
        </Section>

        <Section title="Sus Derechos">
          <P>
            Dependiendo de dónde viva, es posible que tenga algunos o todos los derechos que se enumeran a
            continuación:
          </P>
          <Ul>
            <li>
              <strong>Gestión de las preferencias de comunicación:</strong> Puede darse de baja de correos
              promocionales en cualquier momento.
            </li>
            <li>
              <strong>Revocación del consentimiento:</strong> Siempre que dependamos de su consentimiento para
              procesar su información personal, es posible que tenga derecho a retirar dicho consentimiento.
            </li>
            <li>
              <strong>Restricción de procesamiento:</strong> Es posible que tenga derecho a solicitar que
              detengamos o restrinjamos el procesamiento de la información personal.
            </li>
            <li>
              <strong>Derecho de portabilidad:</strong> Es posible que tenga derecho a recibir una copia de
              la información personal que conservamos.
            </li>
            <li>
              <strong>Derecho de corrección:</strong> Es posible que tenga derecho a solicitar la corrección
              de la información personal errónea.
            </li>
            <li>
              <strong>Derecho de eliminación:</strong> Es posible que tenga derecho a solicitar la
              eliminación de la información personal que conservamos.
            </li>
            <li>
              <strong>Derecho de acceso:</strong> Es posible que tenga derecho a solicitar acceso a la
              información personal que tenemos sobre usted.
            </li>
          </Ul>
        </Section>

        <Section title="Reclamaciones">
          <P>
            Si tiene alguna reclamación sobre cómo procesamos su información personal, póngase en contacto
            con nosotros a través de los detalles de contacto que se proporcionan a continuación. Si no está
            satisfecho con nuestra respuesta, dependiendo de dónde viva, puede tener derecho a presentar su
            reclamación ante la autoridad local competente en materia de protección de datos.
          </P>
        </Section>

        <Section title="Contacto">
          <P>
            Si tiene alguna pregunta sobre nuestras prácticas de privacidad o desea ejercer cualquiera de
            sus derechos, puede enviarnos un correo electrónico a{" "}
            <a href="mailto:adamantio@gmail.com" className="text-[#d4af37] hover:underline">
              adamantio@gmail.com
            </a>{" "}
            o ponerse en contacto con nosotros a través de{" "}
            <a
              href="https://www.adamantio.pe"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#d4af37] hover:underline"
            >
              www.adamantio.pe
            </a>
            . Somos los responsables del tratamiento de su información personal.
          </P>
        </Section>
      </div>
    </div>
  );
}
