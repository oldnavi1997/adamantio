"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqCategory = {
  title: string;
  items: FaqItem[];
};

const faqData: FaqCategory[] = [
  {
    title: "Pedidos y envíos",
    items: [
      {
        question: "¿Cuáles son sus destinos de envío y los costos asociados?",
        answer:
          "Área de envío: Nacional (Argentina). Gastos de envío:\n• Andreani / Correo Argentino: desde $ 2.000 (varía según provincia y peso).\n\nEn algunos casos es posible que no se pueda realizar la entrega en ciertas regiones. Si su ubicación se ve afectada, le notificaremos de inmediato y emitiremos un reembolso.",
      },
      {
        question: "¿Puede proporcionarme un tiempo de entrega estimado para mi pedido?",
        answer:
          "Periodo de procesamiento del pedido: espere que su pedido se procese dentro de 1 a 2 días hábiles.\n\nPeriodo de envío: después del procesamiento, anticipamos la entrega dentro de 2 a 3 días.",
      },
      {
        question: "Si decido cambiar o cancelar mi pedido, ¿cuál es el proceso y los cargos asociados?",
        answer:
          "Puede cancelar su pedido antes de su envío contactando a nuestro WhatsApp. Sin embargo, le recomendamos revisar su pedido cuidadosamente antes de realizar el pago para evitar inconvenientes.\n\nUna vez enviado, no es posible cancelar, pero puedes solicitar una devolución al recibirlo, asumiendo el coste del envío de devolución.",
      },
      {
        question: "¿Es posible actualizar mi dirección de envío después de realizar un pedido?",
        answer:
          "Sí, si necesita cambiar su dirección de envío, notifíquenoslo lo antes posible. Sin embargo, los cambios se complican una vez completado el envío.",
      },
      {
        question: "¿Dónde puedo encontrar información de seguimiento de mi paquete?",
        answer:
          "Una vez enviado tu pedido, recibirás un mensaje con el número de seguimiento. Podrás rastrear tu paquete directamente desde la página web de la empresa de envío (Olva Courier, Shalom).",
      },
      {
        question: "¿Cuál es el procedimiento si mi pedido no logra ser entregado por el transportista?",
        answer:
          "Nos haremos responsables si el pedido no es entregado. Se le envía un nuevo pedido en tal caso.",
      },
    ],
  },
  {
    title: "Productos",
    items: [
      {
        question: "¿Ofrecen servicios de graduación para sus lentes?",
        answer:
          "Sí. Para tal caso necesita adjuntar una foto de su ficha de ojos. Con ello los realizamos a su medida.",
      },
      {
        question: "¿Dónde puedo consultar las medidas del producto?",
        answer:
          "Las medidas y detalles del producto están disponibles en la página de cada producto en el menú \"descripción\".",
      },
      {
        question: "¿Qué hacer si un artículo que quiero comprar está agotado?",
        answer:
          "Puede solicitar una notificación de disponibilidad contactándonos al WhatsApp indicando \"Notificarme cuando esté disponible\". Le notificaremos en cuanto el artículo vuelva a estar disponible.",
      },
      {
        question: "¿Qué tipos de lentes están disponibles para la selección de gafas?",
        answer:
          "Al elegir nuestras gafas, los clientes pueden elegir entre lentes de demostración (Montura) y lentes con Filtro de luz azul. En caso de desear lentes a medida, debe contactarnos por WhatsApp o Instagram. Tenga en cuenta que los lentes con Filtro de luz azul tienen un cargo adicional.\n\nNuestras lentes opcionales con Filtro de luz azul cuentan con protección UV 400 y antirreflejo, con una tasa de bloqueo estimada del 30 %. Tenga en cuenta que las gafas con estas lentes opcionales no se pueden devolver.",
      },
      {
        question: "¿Ofrecen gafas de sol polarizadas en su colección?",
        answer:
          "Sí, ofrecemos gafas de sol polarizadas que bloquean eficazmente los rayos UV y la luz reflejada, reduciendo el deslumbramiento para una visión clara durante las actividades al aire libre.",
      },
      {
        question: "¿A qué categoría de filtro solar pertenecen sus gafas de sol?",
        answer:
          "Todas nuestras lentes de gafas de sol ofrecen protección UV 400 / 100 % contra los rayos UVA, UVB y UVC.",
      },
      {
        question: "¿Cuáles son los procedimientos de mantenimiento y cuidado recomendados para las monturas?",
        answer:
          "Para garantizar la longevidad de sus gafas y mantener una visión clara y cómoda, siga estos consejos:\n\n• Limpieza: utilice un limpiador de lentes suave y un paño de microfibra. Evite productos químicos agresivos o materiales abrasivos.\n• Almacenamiento: guarde sus gafas en un estuche protector cuando no las use. Evite colocarlas con los lentes hacia abajo.\n• Evitar el calor: manténgalas lejos de fuentes de calor directas (agua caliente, secadores, tableros de automóviles).\n• Ajuste y mantenimiento: revise periódicamente tornillos, plaquetas nasales y terminales de patillas. Acuda a un óptico si necesita ajuste.\n• Evitar la humedad: mantenga sus gafas lejos de áreas con mucha humedad.",
      },
      {
        question: "¿Reparan monturas o lunas?",
        answer: "ADAMANTIO no realiza servicios de reparación de monturas.",
      },
    ],
  },
  {
    title: "Devoluciones y garantía",
    items: [
      {
        question: "¿Cuál es su política con respecto a las devoluciones?",
        answer:
          "En ADAMANTIO, nuestra principal prioridad es garantizar su completa satisfacción con cada compra. Si por cualquier motivo no está satisfecho, ofrecemos un proceso formal de devolución y reembolso para atender sus inquietudes. Visita nuestra página de Política de devoluciones y reembolsos para obtener más detalles.",
      },
      {
        question: "¿Cómo debo proceder para devolver o cambiar artículos dañados o incorrectos?",
        answer:
          "Puede iniciar fácilmente una devolución contactando a nuestro WhatsApp. Nuestro horario de atención es de lunes a viernes, de 9:00 a. m. a 8:00 p. m.\n\nSi encuentra algún problema con el producto al recibirlo, proporcione una descripción detallada del problema junto con una foto que muestre el daño.",
      },
      {
        question: "¿Es posible cambiar un artículo si cambio de opinión sobre mi compra?",
        answer:
          "Sí. Para devoluciones por cambio de opinión, organice el envío por la misma agencia de envío inicial y cubra los gastos de envío. Una vez recibido el artículo devuelto, le reembolsaremos el importe íntegro lo antes posible. Si desea cambiar el producto por otro, le rogamos que realice un nuevo pedido.",
      },
      {
        question: "¿Cuánto tiempo suele tardar en procesarse una devolución?",
        answer:
          "Una vez que recibamos e inspeccionemos los productos devueltos, procesaremos su reembolso en un plazo de 3 días hábiles. Tenga en cuenta que el tiempo de envío puede variar según la empresa de transporte.",
      },
      {
        question: "¿Qué cubre su póliza de garantía y cuánto dura?",
        answer:
          "Todos nuestros lentes cuentan con una garantía de 180 días para fallas de fábrica.\n\nSi sientes que ha habido un error en la medida de tus lunas, cuentas con 15 días desde la fecha de recepción para hacernos llegar tus lentes. Si comprobamos que hubo un error, las reemplazaremos de manera gratuita cubriendo los gastos de envío.\n\nMonturas Titanio y Acetato: garantía de 180 días desde la recepción. Monturas TR90 y Metal: garantía de 90 días. De darse el caso, recibirás un reembolso del 100 % del monto pagado como crédito en la tienda o el cambio por una montura nueva del mismo modelo, incluyendo el traspaso de tus lunas.",
      },
    ],
  },
];

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-[#d5d5d5]">
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between py-4 text-left gap-4 group"
          >
            <span className="text-[15px] text-[#1e293b] font-light leading-snug group-hover:text-[#d4af37] transition-colors">
              {item.question}
            </span>
            <ChevronDown
              size={16}
              className={`shrink-0 text-[#d4af37] transition-transform duration-200 ${
                openIndex === i ? "rotate-180" : ""
              }`}
            />
          </button>
          {openIndex === i && (
            <p className="pb-5 text-[#334155]/70 text-[15px] leading-relaxed">
              {item.answer}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function PreguntasFrecuentesPage() {
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
            Preguntas frecuentes
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

        {faqData.map((category, i) => (
          <section key={i} className="space-y-2">
            <h2
              style={{ fontFamily: "var(--font-sans, sans-serif)" }}
              className="text-xl font-light text-[#1e293b] tracking-wide mb-4"
            >
              {category.title}
            </h2>
            <div className="border-t border-[#d5d5d5]">
              <FaqAccordion items={category.items} />
            </div>
          </section>
        ))}

        <div className="pt-4 border-t border-[#d5d5d5]">
          <p className="text-[#334155]/70 text-[15px] leading-relaxed">
            ¿No encontraste lo que buscabas? Escríbenos a{" "}
            <a href="mailto:contacto@adamantio.com.ar" className="text-[#d4af37] hover:underline">
              contacto@adamantio.com.ar
            </a>{" "}
            y te responderemos a la brevedad.
          </p>
        </div>
      </div>
    </div>
  );
}
