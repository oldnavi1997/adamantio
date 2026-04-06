"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Category } from "@/app/generated/prisma/client";
import { ProductWithCategory } from "@/types";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CldUploadWidget } from "next-cloudinary";
import { MediaLibraryModal } from "@/components/admin/MediaLibraryModal";

function SortableImage({
  url,
  index,
  onRemove,
}: {
  url: string;
  index: number;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: url });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative group w-24 h-24 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
        isDragging ? "opacity-50 border-[#111111]" : "border-gray-200"
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 cursor-grab active:cursor-grabbing z-10"
      />
      <Image src={url} alt={`Imagen ${index + 1}`} fill className="object-cover" sizes="96px" />
      {index === 0 && (
        <span className="absolute top-1 left-1 bg-[#111111] text-white text-[9px] px-1.5 py-0.5 rounded z-20 pointer-events-none">
          Principal
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 text-xs"
      >
        ×
      </button>
    </div>
  );
}

const productSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  description: z.string().optional(),
  price: z.string().min(1, "Precio requerido"),
  stock: z.string(),
  category: z.string().optional(),
  productDetails: z.string().optional(),
  sizeInfo: z.string().optional(),
  isActive: z.boolean(),
  engravingEnabled: z.boolean(),
  freeShipping: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  categories: Category[];
  product?: ProductWithCategory;
}

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>(product?.imageUrls ?? (product?.imageUrl ? [product.imageUrl] : []));
  const [sizes, setSizes] = useState<string[]>(product?.sizes ?? []);
  const [sizeInput, setSizeInput] = useState("");
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [contentImages, setContentImages] = useState<string[]>(product?.contentImages ?? []);
  const [showContentLibrary, setShowContentLibrary] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          description: product.description || "",
          price: product.price.toString(),
          stock: product.stock.toString(),
          category: product.category || "",
          productDetails: product.productDetails || "",
          sizeInfo: product.sizeInfo || "",
          isActive: product.isActive,
          engravingEnabled: product.engravingEnabled,
          freeShipping: product.freeShipping,
        }
      : { isActive: true, engravingEnabled: false, freeShipping: false, stock: "0" },
  });

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setImages((imgs) => {
        const oldIndex = imgs.indexOf(active.id as string);
        const newIndex = imgs.indexOf(over.id as string);
        return arrayMove(imgs, oldIndex, newIndex);
      });
    }
  }

  function handleContentDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setContentImages((imgs) => {
        const oldIndex = imgs.indexOf(active.id as string);
        const newIndex = imgs.indexOf(over.id as string);
        return arrayMove(imgs, oldIndex, newIndex);
      });
    }
  }

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
      const body = {
        ...data,
        price: parseFloat(data.price),
        stock: parseInt(data.stock),
        imageUrls: images,
        imageUrl: images[0] ?? null,
        contentImages,
        sizes,
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#111111]"
              {...register("category")}
            >
              <option value="">Sin categoría</option>
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#111111] min-h-[80px]"
            {...register("productDetails")}
          />
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
        <h2 className="font-semibold text-[#111111]">Precio y stock</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Precio (PEN) *"
            type="number"
            step="0.01"
            error={errors.price?.message}
            {...register("price")}
          />
          <Input
            label="Stock"
            type="number"
            error={errors.stock?.message}
            {...register("stock")}
          />
        </div>
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
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <span
                key={s}
                className="flex items-center gap-1.5 bg-gray-100 text-[#111111] text-sm px-3 py-1 rounded-full"
              >
                {s}
                <button
                  type="button"
                  onClick={() => setSizes(sizes.filter((x) => x !== s))}
                  className="text-gray-400 hover:text-red-500 leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Imágenes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="font-semibold text-[#111111]">Imágenes</h2>
        <p className="text-sm text-gray-500">La primera imagen es la principal. Arrastrá para reordenar.</p>

        {images.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={images} strategy={horizontalListSortingStrategy}>
              <div className="flex flex-wrap gap-3">
                {images.map((url, i) => (
                  <SortableImage
                    key={url}
                    url={url}
                    index={i}
                    onRemove={() => setImages(images.filter((_, idx) => idx !== i))}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <CldUploadWidget
          uploadPreset="adamantio-products"
          options={{ multiple: true }}
          onSuccess={(result) => {
            const info = result.info as { secure_url: string };
            if (info?.secure_url) setImages((prev) => [...prev, info.secure_url]);
          }}
        >
          {({ open }) => (
            <button
              type="button"
              onClick={() => open()}
              className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-[#111111] hover:text-[#111111] transition-colors"
            >
              + Subir imagen
            </button>
          )}
        </CldUploadWidget>

        <button
          type="button"
          onClick={() => setShowMediaLibrary(true)}
          className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-[#111111] hover:text-[#111111] transition-colors"
        >
          + Seleccionar de galería
        </button>

        <MediaLibraryModal
          open={showMediaLibrary}
          onClose={() => setShowMediaLibrary(false)}
          currentImages={images}
          onConfirm={(newUrls) => setImages((prev) => [...prev, ...newUrls])}
        />
      </div>

      {/* Imágenes de contenido */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="font-semibold text-[#111111]">Imágenes de contenido</h2>
        <p className="text-sm text-gray-500">Imágenes adicionales para la descripción o contenido editorial del producto. Arrastrá para reordenar.</p>

        {contentImages.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleContentDragEnd}>
            <SortableContext items={contentImages} strategy={horizontalListSortingStrategy}>
              <div className="flex flex-wrap gap-3">
                {contentImages.map((url, i) => (
                  <SortableImage
                    key={url}
                    url={url}
                    index={-1}
                    onRemove={() => setContentImages(contentImages.filter((_, idx) => idx !== i))}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <CldUploadWidget
          uploadPreset="adamantio-products"
          options={{ multiple: true }}
          onSuccess={(result) => {
            const info = result.info as { secure_url: string };
            if (info?.secure_url) setContentImages((prev) => [...prev, info.secure_url]);
          }}
        >
          {({ open }) => (
            <button
              type="button"
              onClick={() => open()}
              className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-[#111111] hover:text-[#111111] transition-colors"
            >
              + Subir imagen
            </button>
          )}
        </CldUploadWidget>

        <button
          type="button"
          onClick={() => setShowContentLibrary(true)}
          className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-[#111111] hover:text-[#111111] transition-colors"
        >
          + Seleccionar de galería
        </button>

        <MediaLibraryModal
          open={showContentLibrary}
          onClose={() => setShowContentLibrary(false)}
          currentImages={contentImages}
          onConfirm={(newUrls) => setContentImages((prev) => [...prev, ...newUrls])}
        />
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
