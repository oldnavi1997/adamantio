import Link from "next/link";

export const metadata = {
  title: "Política de devoluciones y reembolsos",
  description:
    "Conoce las condiciones de devolución, cambio, reembolso y garantía de nuestras joyas en Adamantio Joyería Perú.",
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
            className="text-3xl font-light text-[#111111] tracking-wide"
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
          className="inline-flex items-center gap-2 text-sm text-[#111111]/60 hover:text-[#111111] transition-colors"
        >
          ← Volver al inicio
        </Link>

        <p className="text-[#111111]/70 text-[15px] leading-relaxed">
          En <strong>ADAMANTIO</strong>, nuestra principal prioridad es garantizar su completa satisfacción con
          cada compra. Si por cualquier motivo no está satisfecho con su joya, ofrecemos un proceso formal de
          devolución y reembolso para atender sus inquietudes.
        </p>

        {/* Elegibilidad */}
        <section className="space-y-4">
          <h2
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
            className="text-xl font-light text-[#111111] tracking-wide"
          >
            Elegibilidad para cambio y devolución
          </h2>
          <p className="text-[#111111]/70 text-[15px] leading-relaxed">
            Para poder solicitar una devolución o un cambio, la solicitud debe presentarse dentro de los{" "}
            <strong>15 días naturales posteriores a la recepción</strong> del pedido. Las joyas deben
            devolverse sin usar, con sus etiquetas y en su empaque original, sin signos visibles de desgaste.
          </p>
          <p className="text-[#111111]/70 text-[15px] leading-relaxed">
            Los siguientes artículos y circunstancias <strong>no son elegibles</strong> para devolución o cambio:
          </p>
          <ol className="text-[#111111]/70 text-[15px] leading-relaxed space-y-5 list-decimal list-outside pl-5">
            <li>
              <span>Aretes y cualquier joya de uso perforante.</span>
              <p className="mt-2 text-[#111111]/60">
                Por razones de higiene y salubridad no aceptamos su devolución una vez abierto el empaque,
                salvo que presenten un defecto de fabricación.
              </p>
            </li>
            <li>
              <span>Joyas personalizadas, grabadas o hechas a medida.</span>
              <p className="mt-2 text-[#111111]/60">
                Al tratarse de piezas producidas específicamente para usted, no admiten devolución ni cambio.
                Le recomendamos revisar con cuidado el texto del grabado, la talla y el modelo antes de
                confirmar la compra.
              </p>
            </li>
            <li>Productos adquiridos en promoción, oferta o liquidación.</li>
            <li>
              <span>Joyas con signos de uso, rayones o deformaciones ocasionados después de la entrega.</span>
              <p className="mt-2 text-[#111111]/60">
                Los pequeños rayones superficiales que aparecen con el uso cotidiano son propios del material
                y no se consideran un defecto de fabricación.
              </p>
            </li>
            <li>
              <span>Variaciones naturales del material y de las piedras.</span>
              <p className="mt-2 text-[#111111]/60">
                Las piedras naturales presentan diferencias de tono, tamaño e inclusiones entre una pieza y
                otra. Estas características son inherentes al material y no constituyen un defecto.
              </p>
            </li>
            <li>
              <span>Desgaste del baño de oro y oxidación de la plata.</span>
              <p className="mt-2 text-[#111111]/60">
                El baño de oro se desgasta con el uso, especialmente por contacto con perfumes, cremas,
                cloro, agua de mar o sudor. La plata 925 se oxida de forma natural al contacto con el aire y
                recupera su brillo con una limpieza adecuada. Ninguno de los dos casos se considera una falla
                de fábrica.
              </p>
            </li>
            <li>
              <span>Productos dañados o alterados por manipulación de terceros.</span>
              <p className="mt-2 text-[#111111]/60">
                Los ajustes de talla, soldaduras o reparaciones realizados fuera de ADAMANTIO anulan la
                posibilidad de devolución. Si necesita ajustar una pieza, contáctenos antes de llevarla a
                cualquier taller.
              </p>
            </li>
          </ol>
          <p className="text-[#111111]/70 text-[15px] leading-relaxed">
            Si se detecta algún problema con el producto al recibirlo, se podrá realizar el cambio siempre que
            el mismo modelo esté disponible. Si el artículo está agotado, se procesará una devolución. Gracias
            por su comprensión y cooperación.
          </p>
        </section>

        {/* Cómo iniciar */}
        <section className="space-y-4">
          <h2
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
            className="text-xl font-light text-[#111111] tracking-wide"
          >
            Cómo iniciar una devolución
          </h2>
          <p className="text-[#111111]/70 text-[15px] leading-relaxed">
            Puede iniciar fácilmente una devolución contactando a nuestro{" "}
            <a
              href="https://wa.me/51997676742"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#d4af37] hover:underline"
            >
              WhatsApp
            </a>{" "}
            para obtener ayuda. Nuestro horario de atención es de <strong>lunes a viernes, de 9:00 a. m. a 8:00 p. m.</strong>
          </p>
          <p className="text-[#111111]/70 text-[15px] leading-relaxed">
            Si encuentra algún problema con la joya al recibirla y desea solicitar una devolución o un cambio,
            proporcione el número de pedido junto con una descripción detallada del problema y fotografías que
            muestren el daño.
          </p>
        </section>

        {/* Gastos de envío */}
        <section className="space-y-4">
          <h2
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
            className="text-xl font-light text-[#111111] tracking-wide"
          >
            Gastos de envío de devolución
          </h2>
          <p className="text-[#111111]/70 text-[15px] leading-relaxed">
            Si la devolución se debe a un defecto de fábrica o a un error nuestro, cubriremos los gastos de
            envío. Sin embargo, si devuelve un artículo porque no está satisfecho, le rogamos que cubra los
            gastos de envío.
          </p>
          <p className="text-[#111111]/70 text-[15px] leading-relaxed">
            No proporcionamos etiquetas de envío prepagadas. Por favor, gestione el envío de vuelta a través de
            la misma agencia de envío inicial.
          </p>
          <p className="text-[#111111]/70 text-[15px] leading-relaxed">
            Dado el valor de las piezas, le recomendamos enviar la joya con seguimiento y debidamente
            protegida en su empaque original. Al recibir el artículo devuelto y verificar su estado, recibirá
            el reembolso correspondiente a su pedido.
          </p>
        </section>

        {/* Período de reembolso */}
        <section className="space-y-4">
          <h2
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
            className="text-xl font-light text-[#111111] tracking-wide"
          >
            Período de reembolso
          </h2>
          <p className="text-[#111111]/70 text-[15px] leading-relaxed">
            Una vez que recibamos e inspeccionemos la joya devuelta, procesaremos su reembolso en un plazo de{" "}
            <strong>7 a 10 días hábiles</strong>, por el mismo medio de pago utilizado en la compra. El tiempo
            en que el importe se vea reflejado puede variar según su banco o entidad emisora.
          </p>
          <p className="text-[#111111]/70 text-[15px] leading-relaxed">
            Puede consultar el detalle completo del proceso en nuestra{" "}
            <Link href="/politica-de-reembolsos" className="text-[#d4af37] hover:underline">
              política de reembolsos
            </Link>
            .
          </p>
        </section>

        {/* Garantía */}
        <section className="space-y-4">
          <h2
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
            className="text-xl font-light text-[#111111] tracking-wide"
          >
            Política de garantía
          </h2>
          <p className="text-[#111111]/70 text-[15px] leading-relaxed">
            Todas nuestras piezas cuentan con una garantía de <strong>90 días</strong> a partir de la fecha de
            recepción del pedido frente a <strong>fallas de fabricación</strong>: soldaduras que ceden, cierres
            o broches defectuosos y engastes que liberan la piedra sin mediar un golpe.
          </p>
          <p className="text-[#111111]/70 text-[15px] leading-relaxed">
            De comprobarse la falla, repararemos la pieza sin costo o, si no fuera posible, la cambiaremos por
            una nueva del mismo modelo. Si el modelo estuviera agotado, recibirá el reembolso del 100% del
            monto pagado o un crédito en tienda por el mismo valor, a su elección.
          </p>
          <p className="text-[#111111]/70 text-[15px] leading-relaxed">
            La garantía <strong>no cubre</strong> el desgaste natural del baño de oro, la oxidación de la
            plata, los rayones por el uso, las deformaciones por golpes o presión, ni los daños derivados de
            reparaciones hechas fuera de ADAMANTIO.
          </p>
        </section>

        {/* Cuidados */}
        <section className="space-y-6">
          <h2
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
            className="text-xl font-light text-[#111111] tracking-wide"
          >
            Cuidados de su joya
          </h2>

          <div className="space-y-3">
            <h3 className="text-[13px] font-medium text-[#111111] uppercase tracking-[0.15em]">Uso diario</h3>
            <ul className="text-[#111111]/70 text-[15px] leading-relaxed space-y-2 list-disc list-outside pl-5">
              <li>
                Su joya debe ser lo último que se ponga y lo primero que se retire: evite el contacto con
                perfumes, cremas, lacas y maquillaje.
              </li>
              <li>
                Retírela antes de bañarse, nadar, entrar al mar o a una piscina. El cloro y el agua salada
                deterioran el baño de oro y opacan la plata.
              </li>
              <li>
                Quítesela para hacer ejercicio, dormir o realizar labores de limpieza. Los golpes pueden
                deformar la pieza o aflojar el engaste de las piedras.
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-[13px] font-medium text-[#111111] uppercase tracking-[0.15em]">
              Limpieza y guardado
            </h3>
            <ul className="text-[#111111]/70 text-[15px] leading-relaxed space-y-2 list-disc list-outside pl-5">
              <li>
                Limpie la pieza con un paño suave y seco después de cada uso para retirar el sudor y los
                residuos de cosméticos.
              </li>
              <li>
                No utilice productos abrasivos, alcohol ni limpiadores químicos: dañan el acabado y el baño de
                oro de forma irreversible.
              </li>
              <li>
                Guárdela en su bolsa o estuche original, por separado del resto de sus joyas, para evitar que
                se rayen entre sí.
              </li>
              <li>
                Consérvela en un lugar seco y alejado de la luz solar directa. La humedad acelera la oxidación
                de la plata.
              </li>
            </ul>
          </div>
        </section>

        {/* Ayuda */}
        <section className="space-y-4 pb-4">
          <h2
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
            className="text-xl font-light text-[#111111] tracking-wide"
          >
            ¿Necesita ayuda?
          </h2>
          <p className="text-[#111111]/70 text-[15px] leading-relaxed">
            Si tiene alguna pregunta o necesita más ayuda, no dude en contactarnos a través de nuestro{" "}
            <a
              href="https://wa.me/51997676742"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#d4af37] hover:underline"
            >
              WhatsApp
            </a>
            . ¡Estamos aquí para ayudarle!
          </p>
        </section>
      </div>
    </div>
  );
}
