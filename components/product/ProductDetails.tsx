"use client";

import { useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/Button";
import { ProductWithCategory } from "@/types";
import { useCartStore } from "@/stores/cart";
import AccordionItem from "@/components/product/AccordionItem";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { productThumbnail } from "@/lib/media";
import {
  detallesVisibles,
  parseLineas,
  esPlata,
  esAnilloAjustable,
  BENEFICIOS_PLATA,
  BENEFICIOS_ACERO,
  CUIDADO_ACERO,
  GUIA_AJUSTABLE,
  type Detalle,
} from "@/lib/product-details";

const MAX_ENGRAVING = 30;

interface Props {
  product: ProductWithCategory;
  engravingSamples?: string[];
}

export function ProductDetails({ product, engravingSamples = [] }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [engravingText, setEngravingText] = useState("");
  const [emblaRef] = useEmblaCarousel({ align: "start", dragFree: true, containScroll: "trimSnaps" });

  const hasSizes = product.sizes && product.sizes.length > 0;
  const canAdd = !hasSizes || !!selectedSize;

  const handleAddToCart = () => {
    if (!canAdd) return;
    const trimmed = engravingText.trim();
    addItem({
      id: product.id,
      cartKey: (selectedSize || trimmed) ? `${product.id}__${selectedSize ?? ""}__${trimmed}` : undefined,
      name: product.name,
      price: Number(product.price),
      image: productThumbnail(product) ?? undefined,
      imageUrl: productThumbnail(product) ?? undefined,
      stock: product.stock,
      quantity: 1,
      size: selectedSize ?? undefined,
      engravingText: trimmed || undefined,
      testMode: product.testMode,
      freeShipping: product.freeShipping,
    });
    openDrawer();
  };

  if (product.stock === 0) {
    return (
      <>
        <div className="border border-[#111111]/10 px-6 py-3.5 text-center rounded-full">
          <span className="text-[10px] font-medium text-[#111111]/40 uppercase tracking-[0.2em]">
            Sin stock disponible
          </span>
        </div>
        <WishlistButton product={product} variant="detail" />
        <Accordions product={product} />
      </>
    );
  }

  return (
    <>
      {/* Tallas */}
      {hasSizes && (
        <div className="space-y-2.5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#111111]/50">
            Talla{selectedSize ? <span className="text-[#111111] font-semibold">: {selectedSize}</span> : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size === selectedSize ? null : size)}
                className={`w-10 h-10 rounded-full border text-xs font-medium transition-colors ${
                  selectedSize === size
                    ? "bg-[#111111] text-white border-[#111111]"
                    : "border-[#111111]/20 text-[#111111]/60 hover:border-[#111111]/60 hover:text-[#111111]"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
          {!selectedSize && (
            <p className="text-[10px] text-[#111111]/35">Selecciona una talla para continuar</p>
          )}
        </div>
      )}

      {/* Botón agregar */}
      <Button
        onClick={handleAddToCart}
        disabled={!canAdd}
        className="w-full rounded-full"
        size="lg"
        variant="outline"
      >
        Agregar al carrito
      </Button>

      <WishlistButton product={product} variant="detail" />

      {/* Acordeones */}
      <div>
        <DetallesAccordion product={product} />

        <TallasAccordion product={product} />

        <AccordionItem title="Envío">
          <div className="text-sm text-[#111111]/60 leading-relaxed space-y-3">
            <p><span className="font-medium text-[#111111]/80">Método de envío:</span> Olva Courier y Shalom.</p>
            <p><span className="font-medium text-[#111111]/80">Área de envío:</span> Nacional.</p>
            <div>
              <p className="font-medium text-[#111111]/80 mb-1">Tarifa de envío:</p>
              <ul className="space-y-0.5 pl-3">
                <li>Shalom: 8 soles.</li>
                <li>Olva Courier: 10–18 soles, puede variar según la región destino.</li>
              </ul>
            </div>
            <p><span className="font-medium text-[#111111]/80">Plazo de procesamiento:</span> 1–2 días laborables.</p>
            <p><span className="font-medium text-[#111111]/80">Plazo de envío:</span> 2–3 días después del procesamiento.</p>
          </div>
        </AccordionItem>

        {/* Grabado personalizado */}
        {product.engravingEnabled && (
          <AccordionItem title="Grabado personalizado">
            <div className="space-y-3 pb-1">
              <p className="text-[11px] text-[#111111]/50">
                Escribe el texto que aparecerá grabado en tu joya. Puedes ver ejemplos a continuación.
              </p>

              {/* Carousel estilo galería móvil */}
              {engravingSamples.length > 0 && (
                <div ref={emblaRef} className="overflow-hidden -mx-4">
                  <div className="flex gap-1 px-4">
                    {engravingSamples.map((url, i) => (
                      <div
                        key={i}
                        className="w-[78%] flex-shrink-0 relative aspect-square bg-[#f0eeeb] rounded-lg overflow-hidden"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Ejemplo de grabado ${i + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="relative">
                <input
                  type="text"
                  value={engravingText}
                  onChange={(e) => setEngravingText(e.target.value.slice(0, MAX_ENGRAVING))}
                  placeholder='Ej: "Te amo para siempre"'
                  className="w-full pr-12 px-3 py-2.5 border border-[#111111]/15 rounded-lg text-sm text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:border-[#111111]/40 bg-white transition-colors"
                />
                <span
                  className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] tabular-nums ${
                    engravingText.length >= MAX_ENGRAVING ? "text-red-400" : "text-[#111111]/30"
                  }`}
                >
                  {engravingText.length}/{MAX_ENGRAVING}
                </span>
              </div>

              {engravingText.trim() && (
                <p className="text-[11px] text-[#111111]/50">
                  Tu grabado: <span className="italic font-medium text-[#111111]/70">&ldquo;{engravingText.trim()}&rdquo;</span>
                </p>
              )}
            </div>
          </AccordionItem>
        )}

        <div className="border-t border-[#dadadd]" />
      </div>
    </>
  );
}

// Acordeones sin interacción (para el caso sin stock)
/**
 * Filas de un bloque: viñeta, etiqueta y valor.
 *
 * No fija ni tamaño ni color: los hereda del contenedor del acordeón, que es
 * como se mantiene a la par del de Envío (`text-sm`, `/60`, etiquetas a `/80`).
 * Solo la sangría `pl-3` es propia, igual que en la lista de tarifas de Envío.
 *
 * La viñeta se pinta a mano porque el preflight de Tailwind quita el marcador de
 * lista, y aquí no hay plugin que lo devuelva: el contenedor usaba `prose
 * prose-sm`, pero `@tailwindcss/typography` no está instalado, así que esas
 * clases no generaban nada y el texto salía corrido.
 */
function ListaDetalles({ filas }: { filas: Detalle[] }) {
  return (
    <ul className="space-y-1 pl-3">
      {filas.map((d) => (
        <li key={d.clave} className="flex gap-2">
          <span aria-hidden="true" className="select-none text-[#111111]/25">
            •
          </span>
          <span>
            <span className="font-medium text-[#111111]/80">{d.clave}:</span> {d.valor}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Acordeón de detalles. Vive aparte porque el archivo lo pinta en dos sitios
 * —la rama con stock y la rama sin stock— y las dos copias ya habían divergido.
 */
function DetallesAccordion({ product }: { product: ProductWithCategory }) {
  const detalles = detallesVisibles(product.productDetails);
  if (detalles.length === 0) return null;

  // Los beneficios son texto idéntico dentro de cada familia, así que viven en
  // `lib/product-details.ts` y no en la ficha de cada producto, donde estaban
  // copiados en más de medio catálogo.
  //
  // El bloque del acero se limita a los anillos: su copia habla de «apertura
  // ajustable» y de «anillo de pareja», que no valen para las pulseras ni el
  // collar de acero del catálogo. Esos se quedan sin bloque antes que afirmar
  // algo que no les toca.
  const anilloDeAcero = !esPlata(product) && esAnilloAjustable(product);
  const beneficios = esPlata(product)
    ? BENEFICIOS_PLATA
    : anilloDeAcero
      ? BENEFICIOS_ACERO
      : [];

  return (
    <AccordionItem title="Detalles del producto">
      {/* Mismo contenedor que el acordeón de Envío: el tamaño y el color viven
          aquí y los heredan las listas, para que los cuatro paneles se lean igual. */}
      <div className="text-sm text-[#111111]/60 leading-relaxed space-y-4">
        <ListaDetalles filas={detalles} />
        {beneficios.length > 0 && (
          <div>
            {/* <p>, no <h3>: las reglas de encabezado de `globals.css` están
                fuera de `@layer`, así que ganan a cualquier utilidad de Tailwind
                y un h3 se quedaría en 1.5rem/600 pase lo que pase. Es el mismo
                recurso que usa el subtítulo "Tarifa de envío" del acordeón de
                Envío. */}
            <p role="heading" aria-level={3} className="mb-1.5 font-medium text-[#111111]">
              Características y beneficios
            </p>
            <ListaDetalles filas={beneficios} />
            {/* Nota al pie, no una viñeta más: es una advertencia de cuidado, no
                un argumento de venta. Mismo tamaño y opacidad que la ayuda del
                acordeón de grabado, que es la nota discreta que ya existía. */}
            {anilloDeAcero && (
              <p className="mt-3 text-[11px] leading-relaxed text-[#111111]/50">
                <span className="font-medium">Recomendación:</span> {CUIDADO_ACERO}
              </p>
            )}
          </div>
        )}
      </div>
    </AccordionItem>
  );
}

/**
 * Guía de tallas. Manda lo que tenga el producto; si no tiene nada y es un
 * anillo de apertura ajustable, se pinta `GUIA_AJUSTABLE`, que estaba copiada
 * en unas setenta fichas. Los anillos que se venden por talla declaran `sizes`
 * y necesitan su propia tabla, así que no reciben este texto.
 */
function TallasAccordion({ product }: { product: ProductWithCategory }) {
  const propias = parseLineas(product.sizeInfo);
  const lineas = propias.length > 0 ? propias : esAnilloAjustable(product) ? GUIA_AJUSTABLE : [];
  if (lineas.length === 0) return null;

  return (
    <AccordionItem title="Guía de tallas">
      <div className="text-sm text-[#111111]/60 leading-relaxed">
        <ul className="space-y-1 pl-3">
          {lineas.map((linea) => (
            <li key={linea} className="flex gap-2">
              <span aria-hidden="true" className="select-none text-[#111111]/25">
                •
              </span>
              <span>{linea}</span>
            </li>
          ))}
        </ul>
      </div>
    </AccordionItem>
  );
}

function Accordions({ product }: { product: ProductWithCategory }) {
  return (
    <div>
      <DetallesAccordion product={product} />
      <TallasAccordion product={product} />
      <AccordionItem title="Envío">
        <div className="text-sm text-[#111111]/60 leading-relaxed space-y-3">
          <p><span className="font-medium text-[#111111]/80">Método de envío:</span> Olva Courier y Shalom.</p>
          <p><span className="font-medium text-[#111111]/80">Área de envío:</span> Nacional.</p>
          <p><span className="font-medium text-[#111111]/80">Plazo de procesamiento:</span> 1–2 días laborables.</p>
          <p><span className="font-medium text-[#111111]/80">Plazo de envío:</span> 2–3 días después del procesamiento.</p>
        </div>
      </AccordionItem>
      <div className="border-t border-[#dadadd]" />
    </div>
  );
}
