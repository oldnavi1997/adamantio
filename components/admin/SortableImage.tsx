"use client";

import Image from "next/image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { isVideoUrl, videoPosterUrl } from "@/lib/media";

export function SortableImage({
  url,
  isPrimary = false,
  position,
  onRemove,
}: {
  url: string;
  /** Marca esta pieza como la miniatura del producto (primera foto). */
  isPrimary?: boolean;
  /** Posición 1-indexada dentro de la galería. Sin valor, no se muestra. */
  position?: number;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: url });

  // Los videos no pueden pasar por next/image: se muestra el póster (primer frame).
  const isVideo = isVideoUrl(url);
  const thumbnail = isVideo ? videoPosterUrl(url) : url;

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
      <Image
        src={thumbnail}
        alt={isVideo ? "Video" : `Imagen ${position ?? ""}`}
        fill
        className="object-cover"
        sizes="96px"
      />
      {position !== undefined && (
        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded z-20 pointer-events-none">
          {position}
        </span>
      )}
      {isVideo && (
        <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded z-20 pointer-events-none">
          ▶ Video
        </span>
      )}
      {isPrimary && (
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
