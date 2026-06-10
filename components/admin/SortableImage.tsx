"use client";

import Image from "next/image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function SortableImage({
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
