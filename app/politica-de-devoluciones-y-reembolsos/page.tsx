import Link from "next/link";

export const metadata = {
  title: "Política de devoluciones y reembolsos | Adamantio",
  description:
    "Conoce las condiciones de devolución, cambio, reembolso y garantía de productos en Adamantio Joyería Argentina.",
};

export default function PoliticaDevolucionesPage() {
  return (
    <div className="bg-[#F8F7F4] min-h-screen">
      {/* Hero */}
      <div className="border-b border-[#d5d5d5]">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-14">
          <p className="text-[10px] text-[#d4af37] uppercase tracking-[0.3em] mb-3">Adamantio</p>
          <h1
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
            className="text-3xl font-light text-[#1e293b] tracking-wide"
          >
            Política de devoluciones y reembolsos
          </h1>
          <div className="mt-4 h-px bg-gradient-to-r from-[#d4af37]/40 to-transparent w-24" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16 space-y-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[#334155]/60 hover:text-[#1e293b] transition-colors"
        >
          ← Volver al inicio
        </Link>

        <p className="text-[#334155]/70 text-[15px] leading-relaxed">
          En <strong>ADAMANTIO</strong>, nuestra principal prioridad es garantizar su completa satisfacción con
          cada compra. Si por cualquier motivo no está satisfecho, ofrecemos un proceso formal de devolución y
          reembolso para atender sus inquietudes.
        </p>

        {/* Elegibilidad */}
        <section className="space-y-4">
          <h2
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
            className="text-xl font-light text-[#1e293b] tracking-wide"
          >
            Elegibilidad para cambio y devolución
          </h2>
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            Para poder solicitar una devolución o un cambio, la solicitud debe presentarse dentro de los{" "}
            <strong>3 días posteriores a la recepción</strong>. Los artículos deben devolverse con las
            etiquetas, en su embalaje original y sin usar, sin signos visibles de desgaste.
          </p>
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            Los siguientes artículos y circunstancias <strong>no son elegibles</strong> para devolución o cambio:
          </p>
          <ol className="text-[#334155]/70 text-[15px] leading-relaxed space-y-5 list-decimal list-outside pl-5">
            <li>
              Monturas con lunas graduadas, lunas Blue Defense, Fotocromáticas y demás lunas que requieran de
              biselado.
            </li>
            <li>
              Gafas de sol con pequeños rayones en los lentes (son características inherentes y no se
              consideran un defecto).
            </li>
            <li>
              <span>Gafas con rayones en las lentes de muestra.</span>
              <p className="mt-2 text-[#334155]/60">
                Por defecto, las lentes de muestra de plástico se incluyen con la compra de gafas, a menos que
                se especifique lo contrario en la página del producto. Estas lentes son de mica y carecen de
                tratamiento o protección UV, lo que las hace inadecuadas para el uso diario. Para un uso
                correcto, solicite la compra con su graduación o visite una óptica cercana para un examen de
                la vista y reemplace las lentes de muestra por lentes correctivas o protectoras sin receta
                según sea necesario.
              </p>
            </li>
            <li>
              <span>Estuches y regalos promocionales incluidos con la compra.</span>
              <p className="mt-2 text-[#334155]/60">
                Si se devuelven las gafas, también se deben devolver todos los artículos que las acompañan,
                incluyendo los regalos.
              </p>
            </li>
            <li>
              <span>
                Productos dañados o alterados por negligencia del cliente o del óptico, como gafas ajustadas o
                dañadas durante la prueba.
              </span>
              <p className="mt-2 text-[#334155]/60">
                Para evitar posibles problemas, revise atentamente las especificaciones del producto y consulte
                a su óptico antes de realizar cualquier ajuste. Tenga en cuenta que los métodos de ajuste de
                las gafas pueden variar según la óptica. ADAMANTIO no se responsabiliza de los problemas
                derivados de alteraciones o modificaciones. Se pueden aplicar excepciones en caso de defectos
                iniciales o discrepancias con los detalles anunciados.
              </p>
            </li>
          </ol>
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            En ADAMANTIO, nos aseguramos de que todos los productos se envían con ajustes de montura estándar
            para un equilibrio y comodidad óptimos. Debido a las diferencias faciales individuales, el ajuste
            inicial puede no ser perfecto. Esto no se considera un defecto y no se aceptan cambios ni
            reembolsos en estos casos. Para servicios de ajuste personalizados, visite una tienda ADAMANTIO o una
            óptica cercana. Tenga en cuenta que algunos establecimientos pueden cobrar una tarifa por estos
            servicios.
          </p>
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            Si se detecta algún problema con el producto al recibirlo, se podrán realizar cambios si el mismo
            producto está disponible. Si el artículo está agotado, se procesará una devolución. Gracias por su
            comprensión y cooperación.
          </p>
        </section>

        {/* Cómo iniciar */}
        <section className="space-y-4">
          <h2
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
            className="text-xl font-light text-[#1e293b] tracking-wide"
          >
            Cómo iniciar una devolución
          </h2>
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            Puede iniciar fácilmente una devolución contactando a nuestro{" "}
            <a
              href="https://wa.me/5491100000000"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#d4af37] hover:underline"
            >
              WhatsApp
            </a>{" "}
            para obtener ayuda. Nuestro horario de atención es de <strong>lunes a viernes, de 9:00 a. m. a 8:00 p. m.</strong>
          </p>
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            Si encuentra algún problema con el producto al recibirlo y desea solicitar una devolución o un
            cambio, proporcione una descripción detallada del problema junto con una foto que muestre el daño.
          </p>
        </section>

        {/* Gastos de envío */}
        <section className="space-y-4">
          <h2
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
            className="text-xl font-light text-[#1e293b] tracking-wide"
          >
            Gastos de envío de devolución
          </h2>
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            Si la devolución se debe a un defecto de fábrica o a un error nuestro, cubriremos los gastos de
            envío. Sin embargo, si devuelve un artículo porque no está satisfecho, le rogamos que cubra los
            gastos de envío.
          </p>
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            No proporcionamos etiquetas de envío prepagadas. Por favor, gestione el envío de vuelta a través de
            la misma agencia de envío inicial.
          </p>
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            Al recibir el artículo devuelto, recibirá un reembolso completo de su pedido.
          </p>
        </section>

        {/* Período de reembolso */}
        <section className="space-y-4">
          <h2
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
            className="text-xl font-light text-[#1e293b] tracking-wide"
          >
            Período de reembolso
          </h2>
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            Una vez que recibamos e inspeccionemos los productos devueltos, procesaremos su reembolso en un
            plazo de <strong>1 a 3 días hábiles</strong>.
          </p>
        </section>

        {/* Garantía */}
        <section className="space-y-4">
          <h2
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
            className="text-xl font-light text-[#1e293b] tracking-wide"
          >
            Política de garantía
          </h2>
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            Si sientes que ha habido un error en la medida de tus lunas, cuentas con <strong>15 días</strong> a
            partir de la fecha de recepción para hacernos llegar tus lentes. Si comprobamos que hubo un error,
            las reemplazaremos de manera gratuita y cubriremos los gastos de envío.
          </p>
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            En cuanto a las monturas de <strong>Titanio y Acetato</strong>, estas tienen una garantía de{" "}
            <strong>180 días</strong> a partir de la fecha de recepción de tu pedido. Para monturas de{" "}
            <strong>TR90 y Metal</strong>, la garantía es de <strong>90 días</strong>. Esta garantía cubre
            fallas de fábrica. De darse el caso, recibirás un reembolso del 100% del monto pagado en forma de
            crédito en la tienda o el cambio por una montura nueva del mismo modelo, incluyendo el traspaso de
            tus lunas.
          </p>
        </section>

        {/* Precauciones */}
        <section className="space-y-6">
          <h2
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
            className="text-xl font-light text-[#1e293b] tracking-wide"
          >
            Precauciones
          </h2>

          <div className="space-y-3">
            <h3 className="text-[13px] font-medium text-[#1e293b] uppercase tracking-[0.15em]">Gafas</h3>
            <ul className="text-[#334155]/70 text-[15px] leading-relaxed space-y-2 list-disc list-outside pl-5">
              <li>Los impactos pueden causar el desprendimiento de las lentes o la pérdida de tornillos.</li>
              <li>
                El uso prolongado de las gafas sobre la cabeza o el uso inadecuado puede causar deformación o
                aflojamiento del producto.
              </li>
              <li>
                Para evitar la oxidación o la decoloración por exposición al agua de mar, cosméticos o
                productos químicos, limpie el producto después de usarlo y guárdelo adecuadamente.
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-[13px] font-medium text-[#1e293b] uppercase tracking-[0.15em]">Lentes</h3>
            <ul className="text-[#334155]/70 text-[15px] leading-relaxed space-y-2 list-disc list-outside pl-5">
              <li>Las lentes son artículos consumibles y pueden dañarse por un manejo inadecuado.</li>
              <li>
                Los rayones menores en las lentes de espejo son características inherentes y no se consideran
                defectos; por lo tanto, no se realizan cambios ni reembolsos.
              </li>
              <li>
                La exposición prolongada a altas temperaturas puede causar deformación o daño al recubrimiento
                de las lentes.
              </li>
              <li>
                Para minimizar los rayones u otros daños en las lentes, guarde el producto en su estuche con
                un limpiador.
              </li>
              <li>
                Algunos usuarios pueden experimentar mareos al usar las lentes por primera vez debido a sus
                características únicas. Esto no es un defecto de fabricación.
              </li>
            </ul>
          </div>
        </section>

        {/* Ayuda */}
        <section className="space-y-4 pb-4">
          <h2
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
            className="text-xl font-light text-[#1e293b] tracking-wide"
          >
            ¿Necesita ayuda?
          </h2>
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            Si tiene alguna pregunta o necesita más ayuda, no dude en contactarnos a través de nuestro{" "}
            <a
              href="https://wa.me/5491100000000"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#d4af37] hover:underline"
            >
              WhatsApp
            </a>{" "}
            escribiéndonos por WhatsApp. ¡Estamos aquí para ayudarle!
          </p>
        </section>
      </div>
    </div>
  );
}
