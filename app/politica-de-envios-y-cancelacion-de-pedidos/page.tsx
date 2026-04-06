import Link from "next/link";

export const metadata = {
  title: "Política de envíos y cancelación de pedidos | Adamantio",
  description:
    "Conoce los tiempos de entrega, costos de envío y condiciones de cancelación de pedidos en Adamantio Joyería Argentina.",
};

export default function PoliticaEnviosPage() {
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
            Política de envíos y cancelación de pedidos
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

        {/* Envíos */}
        <section className="space-y-4">
          <h2
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
            className="text-xl font-light text-[#1e293b] tracking-wide"
          >
            Envíos a nivel nacional
          </h2>
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            Realizamos envíos a todo el territorio argentino a través de operadores logísticos de confianza como{" "}
            <strong>Andreani</strong> y <strong>Correo Argentino</strong>. Una vez confirmado y pagado tu pedido, recibirás
            un correo de confirmación con los detalles de tu compra.
          </p>
        </section>

        {/* Tiempos */}
        <section className="space-y-4">
          <h2
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
            className="text-xl font-light text-[#1e293b] tracking-wide"
          >
            Tiempos de entrega
          </h2>
          <ul className="text-[#334155]/70 text-[15px] leading-relaxed space-y-2 list-disc list-inside">
            <li>
              <strong>AMBA (Área Metropolitana de Buenos Aires):</strong> 2 a 4 días hábiles.
            </li>
            <li>
              <strong>Interior del país:</strong> 5 a 10 días hábiles.
            </li>
          </ul>
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            Los plazos se cuentan a partir de la confirmación del pago. En temporadas de alta demanda (Navidad,
            Cyber WOW, etc.) los tiempos pueden extenderse ligeramente; te informaremos si esto ocurre.
          </p>
        </section>

        {/* Costo */}
        <section className="space-y-4">
          <h2
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
            className="text-xl font-light text-[#1e293b] tracking-wide"
          >
            Costo de envío
          </h2>
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            El costo de envío se calcula al momento del checkout según tu ubicación. Los pedidos con un subtotal
            igual o mayor a <strong>$ 30.000</strong> califican para <strong>envío gratuito</strong> a cualquier
            punto del país.
          </p>
        </section>

        {/* Seguimiento */}
        <section className="space-y-4">
          <h2
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
            className="text-xl font-light text-[#1e293b] tracking-wide"
          >
            Seguimiento de tu pedido
          </h2>
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            Una vez que tu pedido sea despachado, recibirás un correo electrónico con el{" "}
            <strong>código de seguimiento</strong> y el enlace para rastrear tu paquete directamente en el sitio
            web del courier. Si no recibes este correo en 24 horas hábiles, escríbenos a{" "}
            <a
              href="mailto:contacto@adamantio.com.ar"
              className="text-[#d4af37] hover:underline"
            >
              contacto@adamantio.com.ar
            </a>
            .
          </p>
        </section>

        {/* Cancelación */}
        <section className="space-y-4">
          <h2
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
            className="text-xl font-light text-[#1e293b] tracking-wide"
          >
            Cancelación de pedidos
          </h2>
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            Puedes cancelar tu pedido sin costo alguno <strong>antes de que sea despachado</strong>. Para
            solicitar la cancelación, contáctanos a{" "}
            <a
              href="mailto:contacto@adamantio.com.ar"
              className="text-[#d4af37] hover:underline"
            >
              contacto@adamantio.com.ar
            </a>{" "}
            con el número de tu pedido.
          </p>
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            Una vez que el pedido haya sido despachado, no es posible cancelarlo. En ese caso, deberás esperar
            la entrega e iniciar el proceso de devolución según nuestra{" "}
            <Link href="/politica-de-devoluciones-y-reembolsos" className="text-[#d4af37] hover:underline">
              Política de devoluciones y reembolsos
            </Link>
            .
          </p>
        </section>

        {/* No entregados */}
        <section className="space-y-4">
          <h2
            style={{ fontFamily: "var(--font-sans, sans-serif)" }}
            className="text-xl font-light text-[#1e293b] tracking-wide"
          >
            Pedidos no entregados
          </h2>
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            Si el courier no puede completar la entrega (dirección incorrecta, destinatario ausente, etc.), el
            paquete será devuelto a nuestro almacén. En ese caso te contactaremos para coordinar una nueva
            entrega. Los gastos adicionales de reenvío corren por cuenta del cliente si la causa es atribuible
            a información incorrecta proporcionada al momento de la compra.
          </p>
        </section>
      </div>
    </div>
  );
}
