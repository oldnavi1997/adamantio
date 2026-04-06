"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface MediaLibraryModalProps {
  open: boolean;
  onClose: () => void;
  currentImages: string[];
  onConfirm: (newUrls: string[]) => void;
}

interface CloudinaryImage {
  url: string;
  publicId: string;
  resourceType: string;
}

function getThumbnailUrl(url: string, resourceType: string): string {
  if (resourceType !== "video") return url;
  return url.replace("/video/upload/", "/video/upload/f_jpg,so_0/");
}

export function MediaLibraryModal({ open, onClose, currentImages, onConfirm }: MediaLibraryModalProps) {
  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const fetchImages = async (cursor?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ max_results: "50" });
      if (cursor) params.set("next_cursor", cursor);
      const res = await fetch(`/api/admin/cloudinary/images?${params}`);
      if (!res.ok) throw new Error("Error al cargar imágenes");
      const data = await res.json();
      setImages((prev) => (cursor ? [...prev, ...data.images] : data.images));
      setNextCursor(data.next_cursor);
      setHasMore(!!data.next_cursor);
    } catch (err) {
      setError("No se pudieron cargar las imágenes de Cloudinary.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setImages([]);
      setSelected(new Set());
      setNextCursor(null);
      setHasMore(false);
      setError(null);
      fetchImages();
    }
  }, [open]);

  const toggleImage = (url: string) => {
    if (currentImages.includes(url)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selected));
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-semibold text-[#111111] text-lg">Galería de imágenes</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-[#111111] transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          {images.length === 0 && !loading && !error && (
            <p className="text-gray-500 text-sm text-center py-8">No hay imágenes en Cloudinary.</p>
          )}

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {images.map((img) => {
              const isCurrentImage = currentImages.includes(img.url);
              const isSelected = selected.has(img.url);

              return (
                <button
                  key={img.publicId}
                  type="button"
                  onClick={() => toggleImage(img.url)}
                  disabled={isCurrentImage}
                  className={[
                    "relative aspect-square rounded-lg overflow-hidden transition-all",
                    isCurrentImage
                      ? "ring-2 ring-[#c9a84c]/60 cursor-not-allowed"
                      : isSelected
                      ? "ring-2 ring-[#111111] cursor-pointer"
                      : "ring-1 ring-gray-200 hover:ring-[#111111] cursor-pointer",
                  ].join(" ")}
                >
                  <Image src={getThumbnailUrl(img.url, img.resourceType)} alt={img.publicId} fill className="object-cover" sizes="160px" />
                  {img.resourceType === "video" && (
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded pointer-events-none">▶ Video</span>
                  )}

                  {/* Already in product — gold checkmark */}
                  {isCurrentImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                      <span className="bg-[#c9a84c] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        ✓
                      </span>
                    </div>
                  )}

                  {/* Selected — dark overlay + white checkmark */}
                  {isSelected && !isCurrentImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <span className="bg-white text-[#111111] rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        ✓
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {hasMore && !loading && (
            <div className="flex justify-center mt-4">
              <button
                type="button"
                onClick={() => fetchImages(nextCursor ?? undefined)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:border-[#111111] hover:text-[#111111] transition-colors"
              >
                Cargar más
              </button>
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:border-[#111111] hover:text-[#111111] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selected.size === 0}
            className="px-4 py-2 text-sm bg-[#111111] text-white rounded-lg hover:bg-[#222222] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Agregar {selected.size > 0 ? `(${selected.size})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
