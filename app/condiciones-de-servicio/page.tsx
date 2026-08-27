import Link from "next/link";

export const metadata = {
  title: "Condiciones de servicio",
  description:
    "Lee las condiciones de uso y compra en Adamantio Joyería Argentina: términos, precios, propiedad intelectual y ley aplicable.",
};

function Section({ number, title, children }: { number?: string; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2
        style={{ fontFamily: "var(--font-sans, sans-serif)" }}
        className="text-xl font-light text-[#111111] tracking-wide"
      >
        {number ? `${number} – ${title}` : title}
      </h2>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[#111111]/70 text-[15px] leading-relaxed">{children}</p>;
}

export default function CondicionesServicioPage() {
  return (
    <div className="bg-[#F8F7F4] min-h-screen">
      {/* Hero */}
      <div className="border-b border-[#d5d5d5]">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-14">
          <p className="text-[10px] text-[#d4af37] uppercase tracking-[0.3em] mb-3">Adamantio</p>
          <h1
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
            className="text-3xl font-light text-[#111111] tracking-wide"
          >
            Condiciones de servicio
          </h1>
          <div className="mt-4 h-px bg-gradient-to-r from-[#d4af37]/40 to-transparent w-24" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16 space-y-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[#111111]/60 hover:text-[#111111] transition-colors"
        >
          ← Volver al inicio
        </Link>

        {/* Descripción general */}
        <Section title="Descripción general">
          <P>
            <strong>www.adamantio.com.ar</strong> (el «Sitio») es propiedad de{" "}
            <strong>ADAMANTIO S.R.L</strong>, con sede en Buenos Aires, Argentina, y está operado por ella (la «Empresa»,
            «nosotros», «nuestro/a/os/as» o «nos»). ADAMANTIO ofrece este sitio web, incluyendo toda la
            información, herramientas y Servicios disponibles en él, a usted, el usuario, con la condición de
            que acepte todos los términos, condiciones, políticas y avisos aquí establecidos.
          </P>
          <P>
            Al visitar nuestro sitio o comprar algo en nosotros, usted participa en nuestro «Servicio» y acepta
            los siguientes términos y condiciones («Términos de Servicio», «Términos»), incluyendo los términos
            y condiciones y políticas adicionales a los que se hace referencia en este documento o que están
            disponibles mediante hipervínculo. Estos Términos de Servicio se aplican a todos los usuarios del
            Sitio, incluyendo, entre otros, a los usuarios que son navegadores, proveedores, clientes,
            comerciantes o contribuidores de contenido.
          </P>
          <P>
            Lea atentamente estos Términos de Servicio antes de acceder o utilizar nuestro sitio web. Al
            acceder o utilizar cualquier parte del Sitio, usted acepta estos Términos de Servicio. Si no acepta
            todos los términos y condiciones de este acuerdo, no podrá acceder al sitio web ni utilizar ninguno
            de los Servicios. Si estos Términos de Servicio se consideran una oferta, la aceptación se limita
            expresamente a estos Términos de Servicio.
          </P>
          <P>
            Cualquier nueva función o herramienta que se añada a la tienda actual también estará sujeta a los
            Términos de Servicio. Puede revisar la versión más reciente de los Términos de Servicio en
            cualquier momento en esta página. Nos reservamos el derecho de actualizar, cambiar o sustituir
            cualquier parte de estos Términos de Servicio mediante la publicación de actualizaciones o cambios
            en nuestro sitio web. Es su responsabilidad consultar esta página periódicamente para comprobar si
            hay cambios. Su uso o acceso continuado al sitio web tras la publicación de cualquier cambio
            constituye la aceptación de dichos cambios.
          </P>
        </Section>

        <Section number="Sección 1" title="Términos de la tienda en línea">
          <P>
            Al aceptar estos Términos de Servicio, declaras ser mayor de edad en tu estado o provincia de
            residencia, o que eres mayor de edad en tu estado o provincia de residencia, y que nos has dado tu
            consentimiento para que cualquiera de tus dependientes menores de edad use este sitio.
          </P>
          <P>
            No puedes usar nuestros productos con fines ilegales o no autorizados, ni infringir ninguna ley de
            tu jurisdicción (incluidas, entre otras, las leyes de derechos de autor) al usar el Servicio.
          </P>
          <P>
            No debes transmitir gusanos, virus ni ningún código de naturaleza destructiva. El incumplimiento o
            la violación de cualquiera de estos Términos resultará en la cancelación inmediata de tus
            Servicios.
          </P>
        </Section>

        <Section number="Sección 2" title="Condiciones generales">
          <P>
            Nos reservamos el derecho de rechazar el Servicio a cualquier persona, por cualquier motivo y en
            cualquier momento.
          </P>
          <P>
            Usted comprende que su contenido (sin incluir la información de su tarjeta de crédito) puede
            transferirse sin cifrar e implicar (a) transmisiones a través de diversas redes; y (b) cambios para
            cumplir y adaptarse a los requisitos técnicos de conexión de redes o dispositivos. La información
            de su tarjeta de crédito siempre se cifra durante la transferencia a través de las redes.
          </P>
          <P>
            Usted se compromete a no reproducir, duplicar, copiar, vender, revender ni explotar ninguna parte
            del Servicio, su uso, el acceso al Servicio ni ningún contacto en el sitio web a través del cual
            se presta el Servicio, sin nuestra autorización expresa por escrito.
          </P>
          <P>
            Los encabezados utilizados en este acuerdo se incluyen únicamente para su comodidad y no limitan
            ni afectan de ningún modo a estos Términos.
          </P>
        </Section>

        <Section number="Sección 3" title="Modificaciones al servicio y precios">
          <P>Los precios de nuestros productos están sujetos a cambios sin previo aviso.</P>
          <P>
            Nos reservamos el derecho de modificar o interrumpir el Servicio (o cualquier parte o contenido
            del mismo) en cualquier momento sin previo aviso.
          </P>
          <P>
            No seremos responsables ante usted ni ante terceros por ninguna modificación, cambio de precio,
            suspensión o interrupción del Servicio.
          </P>
        </Section>

        <Section number="Sección 4" title="Productos o servicios">
          <P>
            Algunos productos o servicios pueden estar disponibles exclusivamente en línea a través del sitio
            web. Estos productos o servicios pueden tener cantidades limitadas y estar sujetos a devolución o
            cambio únicamente de acuerdo con nuestra{" "}
            <Link href="/politica-de-devoluciones-y-reembolsos" className="text-[#d4af37] hover:underline">
              Política de Devoluciones
            </Link>
            .
          </P>
          <P>
            Aunque ADAMANTIO se esfuerza por reflejar con precisión los números de inventario en el Sitio, no
            podemos garantizar la disponibilidad de los productos. Si un artículo deja de estar disponible al
            momento de procesar su pedido, se lo notificaremos de inmediato. También nos hemos esforzado al
            máximo para mostrar con la mayor precisión posible los colores e imágenes de nuestros productos
            que aparecen en la tienda. No podemos garantizar que la visualización de los colores en el monitor
            de su computadora sea precisa.
          </P>
          <P>
            Nos reservamos el derecho, pero no estamos obligados, a limitar las ventas de nuestros productos o
            Servicios a cualquier persona, región geográfica o jurisdicción. Podemos ejercer este derecho caso
            por caso. Nos reservamos el derecho a limitar las cantidades de cualquier producto o Servicio que
            ofrecemos. Todas las descripciones o precios de los productos están sujetos a cambios en cualquier
            momento sin previo aviso, a nuestra entera discreción. Nos reservamos el derecho a descontinuar
            cualquier producto en cualquier momento. Cualquier oferta de producto o Servicio realizada en este
            sitio es nula donde esté prohibida.
          </P>
          <P>
            Los precios que aparecen en el Sitio no incluyen aranceles, impuestos ni otros cargos aduaneros
            internacionales que puedan aplicarse al llegar el paquete a su destino. Para determinar los
            impuestos y aranceles aplicables, consulte con los funcionarios de la agencia aduanera local. Estos
            cargos varían según el país y no están cubiertos por ADAMANTIO.
          </P>
        </Section>

        <Section number="Sección 5" title="Exactitud de la facturación y la información de la cuenta">
          <P>
            Nos reservamos el derecho a rechazar cualquier pedido que realice con nosotros. Podemos, a nuestra
            entera discreción, limitar o cancelar las cantidades compradas por persona, por hogar o por pedido.
            Estas restricciones pueden incluir pedidos realizados por o bajo la misma cuenta de cliente, la
            misma tarjeta de crédito o pedidos que utilicen la misma dirección de facturación o envío. En caso
            de que modifiquemos o cancelemos un pedido, intentaremos notificarle contactando con usted a través
            del correo electrónico, la dirección de facturación o el número de teléfono que proporcionó al
            realizarlo. Nos reservamos el derecho a limitar o prohibir los pedidos que, a nuestro exclusivo
            criterio, parezcan ser realizados por distribuidores, revendedores o aquellos que se consideren con
            alto riesgo de fraude.
          </P>
          <P>
            Para realizar compras en el Sitio, usted acepta proporcionar información de compra y de cuenta
            actual, completa y precisa, incluyendo su nombre real, número de teléfono, dirección de correo
            electrónico y cualquier otra información solicitada. Además, debe proporcionar datos de pago
            válidos y precisos, confirmando que usted es la persona mencionada en la información de
            facturación. Al aceptar estos términos, usted consiente que utilicemos la información proporcionada
            para realizar las comprobaciones antifraude necesarias. Usted acepta actualizar rápidamente su
            cuenta y otra información, incluyendo su dirección de correo electrónico, números de tarjeta de
            crédito y fechas de vencimiento, para que podamos completar sus transacciones y contactarle cuando
            sea necesario.
          </P>
        </Section>

        <Section number="Sección 6" title="Herramientas opcionales">
          <P>
            Podemos proporcionarle acceso a herramientas de terceros que no supervisamos ni sobre las que no
            tenemos control ni participación.
          </P>
          <P>
            Usted reconoce y acepta que proporcionamos acceso a dichas herramientas «tal cual» y «según
            disponibilidad», sin garantías, representaciones ni condiciones de ningún tipo y sin ningún tipo de
            respaldo. No tendremos ninguna responsabilidad derivada o relacionada con su uso de herramientas
            opcionales de terceros. Cualquier uso que usted haga de las herramientas opcionales ofrecidas a
            través del Sitio es bajo su propio riesgo y discreción, y debe asegurarse de conocer y aprobar los
            términos bajo los cuales las herramientas son proporcionadas por el/los proveedor(es) externo(s)
            correspondiente(s).
          </P>
          <P>
            También podemos, en el futuro, ofrecer nuevos Servicios y/o funcionalidades a través del sitio web
            (incluyendo el lanzamiento de nuevas herramientas y recursos). Dichas nuevas funcionalidades y/o
            Servicios también estarán sujetos a estos Términos de Servicio.
          </P>
        </Section>

        <Section number="Sección 7" title="Enlaces de terceros">
          <P>
            Ciertos contenidos, productos y Servicios disponibles a través de nuestro Servicio pueden incluir
            materiales de terceros.
          </P>
          <P>
            Los enlaces de terceros en este sitio pueden dirigirle a sitios web de terceros que no están
            afiliados a nosotros. No nos responsabilizamos de examinar ni evaluar el contenido ni su exactitud,
            y no garantizamos ni asumimos ninguna responsabilidad por los materiales o sitios web de terceros,
            ni por ningún otro material, producto o Servicio de terceros.
          </P>
          <P>
            No nos responsabilizamos de ningún daño o perjuicio relacionado con la compra o el uso de bienes,
            Servicios, recursos, contenido o cualquier otra transacción realizada en relación con sitios web de
            terceros. Revise detenidamente las políticas y prácticas del tercero y asegúrese de comprenderlas
            antes de realizar cualquier transacción. Las quejas, reclamaciones, inquietudes o preguntas sobre
            productos de terceros deben dirigirse directamente al tercero.
          </P>
        </Section>

        <Section number="Sección 8" title="Comentarios, opiniones y otros envíos de los usuarios">
          <P>
            Si, a petición nuestra, envía ciertas propuestas específicas (por ejemplo, participaciones en
            concursos) o sin que se lo pidamos, envía ideas creativas, sugerencias, propuestas, planes u otros
            materiales, ya sea en línea, por correo electrónico, por correo postal o de otro modo
            (colectivamente, «comentarios»), acepta que podemos, en cualquier momento, sin restricción, editar,
            copiar, publicar, distribuir, traducir y utilizar de otro modo en cualquier medio cualquier
            comentario que nos envíe. No tenemos ni tendremos ninguna obligación (1) de mantener la
            confidencialidad de los comentarios; (2) de pagar una compensación por los comentarios; ni (3) de
            responder a los comentarios.
          </P>
          <P>
            Podemos, pero no tenemos la obligación de, supervisar, editar o eliminar contenido que
            determinemos, a nuestra entera discreción, que sea ilegal, ofensivo, amenazante, calumnioso,
            difamatorio, pornográfico, obsceno o de otro modo objetable, o que viole la propiedad intelectual
            de cualquier parte o estos Términos de Servicio.
          </P>
          <P>
            Acepta que sus comentarios no violarán ningún derecho de terceros, incluidos los derechos de autor,
            marca registrada, privacidad, personalidad u otro derecho personal o de propiedad. Además, acepta
            que sus comentarios no contendrán material difamatorio, ilegal, abusivo u obsceno, ni virus
            informáticos ni ningún otro tipo de malware que pueda afectar de alguna manera el funcionamiento
            del Servicio o de cualquier sitio web relacionado. No podrá utilizar una dirección de correo
            electrónico falsa, hacerse pasar por otra persona ni engañarnos a nosotros ni a terceros sobre el
            origen de sus comentarios. Usted es el único responsable de los comentarios que realice y de su
            exactitud. No nos responsabilizamos de los comentarios publicados por usted o por terceros.
          </P>
        </Section>

        <Section number="Sección 9" title="Información personal">
          <P>
            Su envío de información personal a través del Sitio se rige por nuestra Política de Privacidad.
          </P>
        </Section>

        <Section number="Sección 10" title="Errores, inexactitudes y omisiones">
          <P>
            Si bien nos esforzamos por mantener la precisión e integridad de la información del Sitio, no
            podemos garantizarla. No ofrecemos garantías ni declaraciones sobre la precisión o integridad del
            contenido ofrecido a través del Sitio ni de los sitios enlazados.
          </P>
          <P>
            Ocasionalmente, puede haber información en nuestro sitio web o en el Servicio que contenga errores
            tipográficos, inexactitudes u omisiones relacionadas con las descripciones de los productos,
            precios, promociones, ofertas, gastos de envío, tiempos de tránsito y disponibilidad. Nos
            reservamos el derecho a corregir cualquier error, inexactitud u omisión, así como a modificar o
            actualizar la información o cancelar pedidos si alguna información del Servicio o de cualquier
            sitio web relacionado es inexacta en cualquier momento sin previo aviso (incluso después de que
            haya enviado su pedido).
          </P>
        </Section>

        <Section number="Sección 11" title="Usos prohibidos">
          <P>
            Todo el contenido publicado en el Sitio, incluyendo textos, gráficos, archivos de datos,
            fotografías, dibujos, logotipos, imágenes, archivos de vídeo o código («Contenido del Sitio»),
            está protegido por derechos de autor, marcas registradas, diseños, patentes y otras leyes
            aplicables. El Contenido del Sitio es propiedad de ADAMANTIO y/o de sus respectivos propietarios. Se
            permite copiar electrónicamente e imprimir partes del Sitio únicamente para realizar pedidos.
            Cualquier otro uso, incluyendo la reproducción, modificación, distribución, exhibición o
            transmisión de cualquier Contenido del Sitio, sin nuestro consentimiento previo por escrito, queda
            estrictamente prohibido. Usted se compromete a no alterar ni eliminar ningún aviso de propiedad de
            los materiales descargados del Sitio.
          </P>
          <P>
            Además de otras prohibiciones establecidas en los Términos de Servicio, se le prohíbe usar el
            Sitio o su contenido: (a) para cualquier propósito ilegal; (b) para solicitar a otros que realicen
            o participen en actos ilegales; (c) para violar cualquier regulación, regla, ley u ordenanza local
            internacional, federal, provincial o estatal; (d) para infringir o violar nuestros derechos de
            propiedad intelectual o los derechos de propiedad intelectual de terceros; (e) para acosar, abusar,
            insultar, dañar, difamar, calumniar, menospreciar, intimidar o discriminar por motivos de género,
            orientación sexual, religión, etnia, raza, edad, origen nacional o discapacidad; (f) para enviar
            información falsa o engañosa; (g) para cargar o transmitir virus o cualquier otro tipo de código
            malicioso; (h) para recopilar o rastrear la información personal de otros; (i) para enviar spam,
            phishing u otras comunicaciones no deseadas; (j) con fines obscenos o inmorales; o (k) para
            interferir o eludir las funciones de seguridad del Servicio o de cualquier sitio web relacionado.
            Nos reservamos el derecho de suspender su uso del Servicio por infringir cualquiera de los usos
            prohibidos.
          </P>
        </Section>

        <Section number="Sección 12" title="Renuncia de garantías; limitación de responsabilidad">
          <P>
            No garantizamos ni aseguramos que su uso de nuestro Servicio sea ininterrumpido, puntual, seguro
            o libre de errores.
          </P>
          <P>
            No garantizamos que los resultados que se puedan obtener del uso del Servicio sean precisos o
            confiables.
          </P>
          <P>
            Usted acepta que, de vez en cuando, podemos eliminar el Servicio por períodos de tiempo indefinidos
            o cancelarlo en cualquier momento, sin previo aviso. Usted acepta expresamente que su uso o la
            imposibilidad de usar el Servicio es bajo su propio riesgo. El Servicio y todos los productos y
            Servicios que se le entregan a través del Servicio se proporcionan (salvo que lo indiquemos
            expresamente) «tal cual» y «según disponibilidad» para su uso, sin ninguna representación, garantía
            o condición de ningún tipo, ya sea expresa o implícita.
          </P>
          <P>
            En ningún caso ADAMANTIO, nuestros directores, funcionarios, empleados, afiliados, agentes,
            contratistas, pasantes, proveedores o licenciantes serán responsables de ninguna lesión, pérdida,
            reclamo o cualquier daño directo, indirecto, incidental, punitivo, especial o consecuente de ningún
            tipo, incluyendo, sin limitación, pérdida de beneficios, pérdida de ingresos, pérdida de ahorros,
            pérdida de datos, costos de reemplazo o cualquier daño similar, ya sea basado en contrato, agravio
            (incluyendo negligencia), responsabilidad estricta o de otro tipo, que surja de su uso de
            cualquiera de los Servicios o cualquier producto adquirido mediante el Servicio. Debido a que
            algunos estados o jurisdicciones no permiten la exclusión o limitación de responsabilidad por
            daños consecuentes o incidentales, en dichos estados o jurisdicciones, nuestra responsabilidad se
            limitará al máximo permitido por la ley.
          </P>
        </Section>

        <Section number="Sección 13" title="Indemnización">
          <P>
            Usted acepta indemnizar, defender y eximir de responsabilidad a ADAMANTIO y a nuestra empresa
            matriz, subsidiarias, afiliadas, socios, funcionarios, directores, agentes, contratistas,
            licenciatarios, proveedores de servicios, subcontratistas, proveedores, pasantes y empleados, de
            cualquier reclamo o demanda, incluidos los honorarios razonables de abogados, realizados por
            cualquier tercero debido a o que surja de su incumplimiento de estos Términos de Servicio o su
            violación de cualquier ley o los derechos de un tercero.
          </P>
        </Section>

        <Section number="Sección 14" title="Divisibilidad">
          <P>
            En el caso de que alguna disposición de estos Términos de Servicio se determine ilegal, nula o
            inaplicable, dicha disposición será, no obstante, ejecutable en la máxima medida permitida por la
            ley aplicable, y la parte inaplicable se considerará separada de estos Términos de Servicio; dicha
            determinación no afectará la validez y aplicabilidad de las demás disposiciones restantes.
          </P>
        </Section>

        <Section number="Sección 15" title="Terminación">
          <P>
            Las obligaciones y responsabilidades de las partes incurridas antes de la fecha de terminación
            sobrevivirán a la terminación de este acuerdo a todos los efectos.
          </P>
          <P>
            Estos Términos de Servicio estarán vigentes a menos que usted o nosotros los rescindamos. Puede
            rescindir estos Términos de Servicio en cualquier momento notificándonos que ya no desea utilizar
            nuestros Servicios o cuando deje de usar nuestro sitio.
          </P>
          <P>
            Si, a nuestro exclusivo criterio, usted incumple, o sospechamos que ha incumplido, cualquier
            término o disposición de estos Términos de Servicio, también podremos rescindir este acuerdo en
            cualquier momento sin previo aviso y usted seguirá siendo responsable de todos los montos adeudados
            hasta la fecha de terminación inclusive; y/o, en consecuencia, podremos denegarle el acceso a
            nuestros Servicios (o a cualquier parte de ellos).
          </P>
        </Section>

        <Section number="Sección 16" title="Acuerdo completo">
          <P>
            El hecho de que no ejerzamos o hagamos cumplir cualquier derecho o disposición de estos Términos
            de Servicio no constituirá una renuncia a dicho derecho o disposición.
          </P>
          <P>
            Estos Términos de Servicio y cualquier política o norma operativa publicada por nosotros en este
            sitio o en relación con el Servicio constituyen el acuerdo y entendimiento completo entre usted y
            nosotros y rigen su uso del Servicio, sustituyendo cualquier acuerdo, comunicación o propuesta
            anterior o actual, ya sea oral o escrita, entre usted y nosotros (incluidas, entre otras, las
            versiones anteriores de los Términos de Servicio).
          </P>
          <P>
            Cualquier ambigüedad en la interpretación de estos Términos de Servicio no se interpretará en
            contra del grupo redactor.
          </P>
        </Section>

        <Section number="Sección 17" title="Ley aplicable">
          <P>
            Estos Términos de Servicio y cualquier acuerdo separado mediante el cual le proporcionemos
            Servicios se regirán e interpretarán de conformidad con las leyes de la{" "}
            <strong>República Argentina</strong>.
          </P>
        </Section>

        <Section number="Sección 18" title="Cambios a los términos de servicio">
          <P>
            Nos reservamos el derecho, a nuestra entera discreción, de actualizar, modificar o reemplazar
            cualquier parte de estos Términos de Servicio mediante la publicación de actualizaciones y cambios
            en nuestro sitio web. Es su responsabilidad revisar nuestro sitio web periódicamente para
            comprobar si hay cambios. Su uso o acceso continuo a nuestro sitio web o al Servicio tras la
            publicación de cualquier cambio en estos Términos de Servicio constituye la aceptación de dichos
            cambios.
          </P>
        </Section>
      </div>
    </div>
  );
}
