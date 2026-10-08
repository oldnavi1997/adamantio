"use client";

import { useLayoutEffect, useRef, useState } from "react";
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
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CldUploadWidget } from "next-cloudinary";
import { SortableImage } from "@/components/admin/SortableImage";
import { MediaLibraryModal } from "@/components/admin/MediaLibraryModal";
import { isVideoUrl } from "@/lib/media";

interface ImageManagerProps {
  images: string[];
  onChange: (urls: string[]) => void;
  /** Si true, marca la primera FOTO como "Principal". Por defecto false. */
  showPrimaryBadge?: boolean;
  /**
   * Tipo de media admitido. "mixed" permite fotos y videos en la misma lista
   * ordenable — es lo que usa la galería del producto.
   */
  mediaType?: "image" | "video" | "mixed";
}

export function ImageManager({
  images,
  onChange,
  showPrimaryBadge = false,
  mediaType = "image",
}: ImageManagerProps) {
  const [showLibrary, setShowLibrary] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor));
  const isVideo = mediaType === "video";
  const isMixed = mediaType === "mixed";
  const label = isVideo ? "video" : "imagen";
  // El badge "Principal" marca la miniatura real del producto (ver productThumbnail).
  const primaryUrl = showPrimaryBadge ? images.find((url) => !isVideoUrl(url)) : undefined;

  // Con `multiple`, el widget dispara un onSuccess por archivo y lo hace con el
  // callback del momento en que se abrió: todos leían el mismo `images` y cada
  // uno pisaba al anterior, así que de cinco fotos solo quedaba la última. La
  // ref acumula entre eventos sin esperar a que el padre vuelva a renderizar.
  const imagesRef = useRef(images);
  useLayoutEffect(() => {
    imagesRef.current = images;
  }, [images]);

  function agregarSubida(result: { info?: unknown }) {
    const url = (result.info as { secure_url?: string } | undefined)?.secure_url;
    if (!url || imagesRef.current.includes(url)) return;
    const siguientes = [...imagesRef.current, url];
    imagesRef.current = siguientes;
    onChange(siguientes);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.indexOf(active.id as string);
      const newIndex = images.indexOf(over.id as string);
      onChange(arrayMove(images, oldIndex, newIndex));
    }
  }

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images} strategy={horizontalListSortingStrategy}>
            <div className="flex flex-wrap gap-3">
              {images.map((url, i) => (
                <SortableImage
                  key={url}
                  url={url}
                  isPrimary={url === primaryUrl}
                  position={i + 1}
                  onRemove={() => onChange(images.filter((_, idx) => idx !== i))}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="flex flex-wrap gap-2">
        {!isVideo && (
          // Las fotos tienen su propio preset: `adamantio-fotos` fija el master
          // (5000 px, q88) al subir, y esa transformación no puede tocar los
          // videos, que siguen por `adamantio-products`. Ver `lib/cloudinary.ts`.
          <CldUploadWidget
            uploadPreset="adamantio-fotos"
            options={{ multiple: true, resourceType: "image" }}
            onSuccess={agregarSubida}
          >
            {({ open }) => (
              <button
                type="button"
                onClick={() => open()}
                className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-[#111111] hover:text-[#111111] transition-colors"
              >
                + Subir {label}
              </button>
            )}
          </CldUploadWidget>
        )}

        {(isVideo || isMixed) && (
          <CldUploadWidget
            uploadPreset="adamantio-products"
            options={{ multiple: true, resourceType: "video", sources: ["local", "url"] }}
            onSuccess={agregarSubida}
          >
            {({ open }) => (
              <button
                type="button"
                onClick={() => open()}
                className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-[#111111] hover:text-[#111111] transition-colors"
              >
                + Subir video
              </button>
            )}
          </CldUploadWidget>
        )}

        <button
          type="button"
          onClick={() => setShowLibrary(true)}
          className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-[#111111] hover:text-[#111111] transition-colors"
        >
          + Seleccionar de galería
        </button>
      </div>

      <MediaLibraryModal
        open={showLibrary}
        onClose={() => setShowLibrary(false)}
        currentImages={images}
        mediaType={isMixed ? undefined : mediaType}
        onConfirm={(newUrls) => onChange([...images, ...newUrls])}
      />
    </div>
  );
}
