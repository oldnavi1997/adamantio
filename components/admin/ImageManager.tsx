"use client";

import { useState } from "react";
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

interface ImageManagerProps {
  images: string[];
  onChange: (urls: string[]) => void;
  /** Si true, marca la primera imagen como "Principal". Por defecto false. */
  showPrimaryBadge?: boolean;
}

export function ImageManager({ images, onChange, showPrimaryBadge = false }: ImageManagerProps) {
  const [showLibrary, setShowLibrary] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor));

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
                  index={showPrimaryBadge ? i : -1}
                  onRemove={() => onChange(images.filter((_, idx) => idx !== i))}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="flex flex-wrap gap-2">
        <CldUploadWidget
          uploadPreset="adamantio-products"
          options={{ multiple: true }}
          onSuccess={(result) => {
            const info = result.info as { secure_url: string };
            if (info?.secure_url && !images.includes(info.secure_url)) {
              onChange([...images, info.secure_url]);
            }
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
        onConfirm={(newUrls) => onChange([...images, ...newUrls])}
      />
    </div>
  );
}
