"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Category } from "@/app/generated/prisma/client";
import { ProductConTallas } from "@/types";
import { ImageManager } from "@/components/admin/ImageManager";
import { productThumbnail } from "@/lib/media";

const productSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  sku: z.string().optional(),
  description: z.string().optional(),
  price: z.string().min(1, "Precio requerido"),
  precioOferta: z.string().optional(),
  stockHombre: z.string(),
  stockMujer: z.string(),
  stockAlmacenH: z.string(),
  stockAlmacenM: z.string(),
  category: z.string().optional(),
  productDetails: z.string().optional(),
  sizeInfo: z.string().optional(),
  isActive: z.boolean(),
  engravingEnabled: z.boolean(),
  freeShipping: z.boolean(),
  testMode: z.boolean(),
  esPar: z.boolean(),
  // POS fields
  precioVentaHombre: z.string().optional(),
  precioVentaMujer: z.string().optional(),
}).superRefine((data, ctx) => {
  const oferta = data.precioOferta?.trim();
  if (!oferta) return;                       // vacío = sin oferta, es lo normal
  const valor = parseFloat(oferta);
  const precio = parseFloat(data.price);
  if (!Number.isFinite(valor) || valor <= 0) {
    ctx.addIssue({ code: "custom", path: ["precioOferta"], message: "Importe inválido" });
  } else if (Number.isFinite(precio) && valor >= precio) {
    ctx.addIssue({
      code: "custom",
      path: ["precioOferta"],
      message: "La oferta tiene que ser menor que el precio",
    });
  }
});

type ProductFormData = z.infer<typeof productSchema>;

interface PosStock {
  stockHombre: number;
  stockMujer: number;
  stockAlmacenHombre: number;
  stockAlmacenMujer: number;
}

interface ProductFormProps {
  categories: Category[];
  product?: ProductConTallas;
  posStock?: PosStock | null;
}

export function ProductForm({ categories, product, posStock }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>(product?.imageUrls ?? (product?.imageUrl ? [product.imageUrl] : []));
  const [sizes, setSizes] = useState<string[]>(product?.sizes ?? []);
  // Cantidades por talla, indexadas por etiqueta. Conviven con `sizes`: esa
  // lista sigue mandando sobre qué tallas existen y en qué orden.
  const [stockTallas, setStockTallas] = useState<Record<string, { tienda: number; almacen: number }>>(() => {
    const inicial: Record<string, { tienda: number; almacen: number }> = {};
    for (const t of product?.tallas ?? []) {
      inicial[t.talla] = { tienda: t.stockTienda, almacen: t.stockAlmacen };
    }
    return inicial;
  });
  const [porTalla, setPorTalla] = useState<boolean>(product?.stockPorTalla ?? false);
  const [sizeInput, setSizeInput] = useState("");
  const [contentImages, setContentImages] = useState<string[]>(product?.contentImages ?? []);
  const [engravingImages, setEngravingImages] = useState<string[]>(product?.engravingImages ?? []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          sku: product.sku || "",
          description: product.description || "",
          // Guardado: price = lo que se cobra, comparePrice = el tachado. En el
          // editor se ve al derecho, así que aquí se invierte de vuelta.
          price: (product.comparePrice ?? product.price).toString(),
          precioOferta: product.comparePrice ? product.price.toString() : "",
          stockHombre: product.esPar
            ? String(posStock?.stockHombre ?? 0)
            : String((posStock?.stockHombre ?? 0) + (posStock?.stockMujer ?? 0)),
          stockMujer: String(posStock?.stockMujer ?? 0),
          stockAlmacenH: product.esPar
            ? String(posStock?.stockAlmacenHombre ?? 0)
            : String((posStock?.stockAlmacenHombre ?? 0) + (posStock?.stockAlmacenMujer ?? 0)),
          stockAlmacenM: String(posStock?.stockAlmacenMujer ?? 0),
          category: product.category || "",
          productDetails: product.productDetails || "",
          sizeInfo: product.sizeInfo || "",
          isActive: product.isActive,
          engravingEnabled: product.engravingEnabled,
          freeShipping: product.freeShipping,
          testMode: product.testMode,
          esPar: product.esPar,
          precioVentaHombre: String(product.precioVentaHombre ?? ""),
          precioVentaMujer: String(product.precioVentaMujer ?? ""),
        }
      : { isActive: true, engravingEnabled: false, freeShipping: false, testMode: false, esPar: false, stockHombre: "0", stockMujer: "0", stockAlmacenH: "0", stockAlmacenM: "0", sku: "" },
  });

  const esPar = watch("esPar");
  const totalTallas = sizes.reduce(
    (n, t) => n + (stockTallas[t]?.tienda ?? 0) + (stockTallas[t]?.almacen ?? 0),
    0
  );
  const engravingEnabled = watch("engravingEnabled");
  const prevEsParRef = useRef(esPar);

  useEffect(() => {
    if (prevEsParRef.current === esPar) return;
    prevEsParRef.current = esPar;

    const sH  = parseInt(watch("stockHombre"))  || 0;
    const sM  = parseInt(watch("stockMujer"))   || 0;
    const sAH = parseInt(watch("stockAlmacenH")) || 0;
    const sAM = parseInt(watch("stockAlmacenM")) || 0;

    if (!esPar) {
      setValue("stockHombre",  String(sH + sM));
      setValue("stockMujer",   "0");
      setValue("stockAlmacenH", String(sAH + sAM));
      setValue("stockAlmacenM", "0");
    } else {
      setValue("stockMujer",   "0");
      setValue("stockAlmacenM", "0");
    }
  }, [esPar]); // eslint-disable-line react-hooks/exhaustive-deps

  function addSize() {
    const trimmed = sizeInput.trim();
    if (trimmed && !sizes.includes(trimmed)) {
      setSizes((prev) => [...prev, trimmed]);
    }
    setSizeInput("");
  }

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true);
    try {
      const sH = parseInt(data.stockHombre) || 0;
      const sM = data.esPar ? (parseInt(data.stockMujer) || 0) : 0;
      const sAH = parseInt(data.stockAlmacenH) || 0;
      const sAM = data.esPar ? (parseInt(data.stockAlmacenM) || 0) : 0;
      // `precioOferta` es solo del formulario: se queda fuera del cuerpo y se
      // traduce a price/comparePrice, que es como lo guarda la BD.
      const { precioOferta, ...resto } = data;
      const oferta = precioOferta?.trim() ? parseFloat(precioOferta) : null;
      const precio = parseFloat(data.price);
      const enOferta = oferta !== null && oferta > 0 && oferta < precio;
      const body = {
        ...resto,
        sku: data.sku?.trim() || null,
        price: enOferta ? oferta : precio,
        comparePrice: enOferta ? precio : null,
        stock: sH + sM + sAH + sAM,
        stockHombre: sH,
        stockMujer: sM,
        stockAlmacenH: sAH,
        stockAlmacenM: sAM,
        imageUrls: images,
        imageUrl: productThumbnail({ imageUrls: images }),
        contentImages,
        engravingImages,
        sizes,
        stockPorTalla: porTalla,
        tallas: sizes.map((t, i) => ({
          talla: t,
          stockTienda: stockTallas[t]?.tienda ?? 0,
          stockAlmacen: stockTallas[t]?.almacen ?? 0,
          orden: i,
        })),
        precioVentaHombre: parseFloat(data.precioVentaHombre || "0") || 0,
        precioVentaMujer: parseFloat(data.precioVentaMujer || "0") || 0,
        // El precio de pareja del POS no se escribe a mano: es el mismo número
        // que cobra la web, y tenerlo dos veces en el formulario solo servía
        // para que una promoción bajara uno y dejara el otro atrás.
        precioVentaPareja: enOferta ? oferta : precio,
      };

      const url = product ? `/api/products/${product.id}` : "/api/products";
      const method = product ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Error al guardar");
        return;
      }

      toast.success(product ? "Producto actualizado" : "Producto creado");
      router.push("/admin/productos");
      router.refresh();
    } catch {
      toast.error("Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Información básica */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="font-semibold text-[#111111]">Información básica</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre *"
            error={errors.name?.message}
            {...register("name")}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
            <div className="flex gap-2">
              <Input
                placeholder="Ej: ANI-001"
                error={errors.sku?.message}
                {...register("sku")}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => {
                  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                  const sku = Array.from({ length: 10 }, () =>
                    chars[Math.floor(Math.random() * chars.length)]
                  ).join("");
                  setValue("sku", sku, { shouldValidate: true });
                }}
                className="px-3 py-2 text-xs font-medium bg-[#f8f7f4] border border-gray-300 text-[#111111]/70 hover:text-[#111111] hover:bg-[#efefec] transition-colors whitespace-nowrap"
              >
                Generar
              </button>
            </div>
            {errors.sku && <p className="mt-1 text-xs text-red-500">{errors.sku.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
              {...register("category")}
            >
              <option value="">Sin categoría</option>
              {/* Si la categoría actual del producto ya no existe en la lista
                  (p.ej. una categoría renombrada/eliminada), la mostramos igual
                  para que el navegador no la descarte en silencio al guardar. */}
              {product?.category &&
                !categories.some((c) => c.name === product.category) && (
                  <option value={product.category}>
                    {product.category} (categoría inexistente)
                  </option>
                )}
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#111111] min-h-[100px]"
            {...register("description")}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Detalles del producto</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#111111] min-h-[110px] font-mono"
            placeholder={[
              "Tipo: Anillos de pareja",
              "Material: Plata de ley 925",
              "Estilo: Diseño para parejas",
              "Tamaño: Apertura ajustable",
              "Uso: Ideal para uso diario",
            ].join("\n")}
            {...register("productDetails")}
          />
          <p className="text-xs text-gray-500 mt-1.5">
            Una línea por atributo, en la forma <code>Clave: valor</code>. <strong>No pegues aquí
            texto con formato</strong>: arrastra estilos que rompen la ficha. Tipo, Material, Estilo,
            Tamaño y Uso salen primero y en ese orden; el resto va detrás tal como lo escribas.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            No repitas los beneficios de la plata (resistente al agua, antideslustre, hipoalergénico,
            durable): la ficha los añade sola a todo lo que no sea acero.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Guía de tallas</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#111111] min-h-[60px]"
            {...register("sizeInfo")}
          />
        </div>
      </div>

      {/* Precio y stock */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[#111111]">Precio y stock</h2>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" {...register("esPar")} className="accent-[#111111]" />
            <span className="text-sm text-gray-600">Venta por par (H/M)</span>
          </label>
        </div>
        <Input
          label="Precio (PEN) *"
          type="number"
          step="0.01"
          error={errors.price?.message}
          {...register("price")}
        />
        <div>
          <Input
            label="Precio de oferta (PEN)"
            type="number"
            step="0.01"
            min="0"
            placeholder="Vacío = sin oferta"
            error={errors.precioOferta?.message}
            {...register("precioOferta")}
          />
          <p className="text-xs text-gray-500 mt-1.5">
            Si lo rellenas, es lo que se cobra: el precio de arriba se muestra tachado con su
            porcentaje de descuento. Vacíalo para terminar la oferta. El precio de pareja del
            punto de venta se guarda solo, con este mismo valor.
          </p>
        </div>
        {esPar && (
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 space-y-2">
            <p className="text-sm font-medium text-gray-700">Precio de cada anillo por separado</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="♂ Hombre (PEN)" type="number" step="0.01" min="0" {...register("precioVentaHombre")} />
              <Input label="♀ Dama (PEN)" type="number" step="0.01" min="0" {...register("precioVentaMujer")} />
            </div>
            <p className="text-xs text-gray-500">
              Con los dos cargados, la ficha deja elegir entre el anillo de hombre, el de dama o
              la pareja. Si alguno queda en cero, el producto se sigue vendiendo solo como par.
            </p>
          </div>
        )}
        {esPar ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Tienda física</p>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Hombre" type="number" min="0" {...register("stockHombre")} />
                <Input label="Mujer" type="number" min="0" {...register("stockMujer")} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Almacén</p>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Hombre" type="number" min="0" {...register("stockAlmacenH")} />
                <Input label="Mujer" type="number" min="0" {...register("stockAlmacenM")} />
              </div>
            </div>
          </div>
        ) : porTalla ? (
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <p className="text-sm text-gray-700">
              Stock total: <span className="font-semibold">{totalTallas}</span> unidades
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Se calcula sumando las tallas. Edítalo en la tarjeta «Tallas disponibles».
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Input label="Tienda" type="number" min="0" {...register("stockHombre")} />
            <Input label="Almacén" type="number" min="0" {...register("stockAlmacenH")} />
          </div>
        )}
      </div>

      {/* Tallas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="font-semibold text-[#111111]">Tallas disponibles</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={sizeInput}
            onChange={(e) => setSizeInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSize(); } }}
            placeholder="Ej: S, M, L, XS, 6, 7..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
          />
          <Button type="button" variant="outline" size="sm" onClick={addSize}>
            Agregar
          </Button>
        </div>
        {sizes.length > 0 && (
          <div className="space-y-2">
            {sizes.map((s) => (
              <div key={s} className="flex items-center gap-3">
                <span className="w-16 shrink-0 bg-gray-100 text-[#111111] text-sm px-3 py-1 rounded-full text-center">
                  {s}
                </span>
                <label className="text-xs text-gray-500">Tienda</label>
                <input
                  type="number"
                  min="0"
                  value={stockTallas[s]?.tienda ?? 0}
                  onChange={(e) =>
                    setStockTallas((prev) => ({
                      ...prev,
                      [s]: { tienda: parseInt(e.target.value) || 0, almacen: prev[s]?.almacen ?? 0 },
                    }))
                  }
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <label className="text-xs text-gray-500">Almacén</label>
                <input
                  type="number"
                  min="0"
                  value={stockTallas[s]?.almacen ?? 0}
                  onChange={(e) =>
                    setStockTallas((prev) => ({
                      ...prev,
                      [s]: { tienda: prev[s]?.tienda ?? 0, almacen: parseInt(e.target.value) || 0 },
                    }))
                  }
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <button
                  type="button"
                  onClick={() => setSizes(sizes.filter((x) => x !== s))}
                  className="text-gray-400 hover:text-red-500 leading-none px-1"
                  aria-label={`Quitar talla ${s}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {sizes.length > 0 && !esPar && (
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={porTalla}
                onChange={(e) => setPorTalla(e.target.checked)}
                className="accent-[#111111]"
              />
              <span className="text-sm font-medium text-gray-700">Llevar inventario por talla</span>
            </label>
            <p className="text-xs text-gray-500">
              Cuenta primero y escribe las cantidades de arriba. Al activarlo, el stock del
              producto pasa a ser la suma de sus tallas ({totalTallas} unidades ahora mismo) y la
              tienda deja de ofrecer las tallas agotadas.
            </p>
            {porTalla && totalTallas === 0 && (
              <p className="text-xs text-red-600">
                Con todas las tallas en cero el producto queda agotado y desaparece del catálogo.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Galería */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="font-semibold text-[#111111]">Galería</h2>
        <p className="text-sm text-gray-500">
          Fotos y videos en el orden en que se ven en la ficha. Arrastrá para reordenar: el video puede ir
          en cualquier posición. Los videos se reproducen en bucle y sin sonido. La miniatura del catálogo,
          el carrito y las redes es la primera <strong>foto</strong> (marcada como Principal).
        </p>

        <ImageManager images={images} onChange={setImages} showPrimaryBadge mediaType="mixed" />
      </div>

      {/* Imágenes de contenido */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="font-semibold text-[#111111]">Imágenes de contenido</h2>
        <p className="text-sm text-gray-500">Fotos o videos adicionales para la descripción o contenido editorial del producto. Arrastrá para reordenar.</p>

        <ImageManager images={contentImages} onChange={setContentImages} mediaType="mixed" />
      </div>

      {/* Imágenes de grabado */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="font-semibold text-[#111111]">Imágenes de grabado</h2>
        <p className="text-sm text-gray-500">
          Ejemplos de grabado específicos para este producto. Si lo dejas vacío, se usa la galería global de la sección Grabado. Arrastrá para reordenar.
        </p>
        {!engravingEnabled && (
          <p className="text-sm text-amber-600">
            El grabado está desactivado para este producto: estas imágenes no se mostrarán hasta que habilites &ldquo;Grabado personalizado&rdquo; abajo.
          </p>
        )}
        <ImageManager images={engravingImages} onChange={setEngravingImages} />
      </div>

      {/* Visibilidad */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-[#111111] mb-4">Opciones</h2>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register("isActive")} className="accent-[#111111]" />
            <span className="text-sm">Activo (visible en tienda)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register("engravingEnabled")} className="accent-[#111111]" />
            <span className="text-sm">Habilitar grabado personalizado</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register("freeShipping")} className="accent-[#111111]" />
            <span className="text-sm">Envío gratis</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register("testMode")} className="accent-amber-500" />
            <span className="text-sm text-amber-600 font-medium">Modo prueba (sin envío ni comisión)</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {product ? "Actualizar producto" : "Crear producto"}
        </Button>
      </div>
    </form>
  );
}
