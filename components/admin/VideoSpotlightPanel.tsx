"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { CldUploadWidget } from "next-cloudinary";
import { ArrowDown, ArrowUp, Film, Plus, Search, Trash2, Video, X } from "lucide-react";
import { formatPEN } from "@/lib/utils";
import { MediaLibraryModal } from "@/components/admin/MediaLibraryModal";
import { videoPosterUrl, type SpotlightConfigItem } from "@/lib/video-spotlight";

type ProductOption = { id: string; name: string; price: number; image: string | null };

type EditorItem = SpotlightConfigItem & { uid: string };

interface Props {
  initialItems: SpotlightConfigItem[];
  products: ProductOption[];
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function VideoSpotlightPanel({ initialItems, products }: Props) {
  const [items, setItems] = useState<EditorItem[]>(
    initialItems.map((it) => ({ ...it, uid: uid() }))
  );
  const [saving, setSaving] = useState(false);
  const [pickerUid, setPickerUid] = useState<string | null>(null);
  const [pickerSearch, setPickerSearch] = useState("");
  const [videoModalUid, setVideoModalUid] = useState<string | null>(null);

  const productsById = new Map(products.map((p) => [p.id, p]));

  function patchItem(uidKey: string, patch: Partial<EditorItem>) {
    setItems((prev) => prev.map((it) => (it.uid === uidKey ? { ...it, ...patch } : it)));
  }

  function removeItem(uidKey: string) {
    setItems((prev) => prev.filter((it) => it.uid !== uidKey));
  }

  function move(uidKey: string, dir: -1 | 1) {
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.uid === uidKey);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  function addItem() {
    setItems((prev) => [...prev, { uid: uid(), productId: "", video: "", poster: "" }]);
  }

  function setVideo(uidKey: string, video: string) {
    patchItem(uidKey, { video, poster: videoPosterUrl(video) });
  }

  function selectProduct(uidKey: string, productId: string) {
    patchItem(uidKey, { productId });
    setPickerUid(null);
    setPickerSearch("");
  }

  async function save() {
    const payload = items
      .filter((it) => it.productId && it.video)
      .map((it) => ({ productId: it.productId, video: it.video, poster: it.poster }));
    setSaving(true);
    try {
      const res = await fetch("/api/admin/video-spotlight", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });
      if (!res.ok) throw new Error();
      toast.success("Videos destacados actualizados");
    } catch {
      toast.error("Error al guardar los videos");
    } finally {
      setSaving(false);
    }
  }

  const filteredProducts = pickerSearch.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(pickerSearch.trim().toLowerCase()))
    : products;

  const invalidCount = items.filter((it) => !it.productId || !it.video).length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-[#111111]">Videos destacados (home)</h2>
            <p className="text-sm text-gray-400 mt-1">
              Sección &ldquo;Descubre nuestras favoritas&rdquo;. El nombre y precio se toman en vivo del
              producto enlazado. Usa las flechas para reordenar.
            </p>
          </div>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:border-[#111111] transition-colors whitespace-nowrap"
          >
            <Plus className="h-4 w-4" /> Añadir video
          </button>
        </div>

        {items.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8 border border-dashed border-gray-200 rounded-lg">
            No hay videos. Añade el primero.
          </p>
        )}

        <div className="space-y-3">
          {items.map((it, idx) => {
            const product = it.productId ? productsById.get(it.productId) : undefined;
            return (
              <div key={it.uid} className="flex gap-4 p-4 border border-gray-100 rounded-lg">
                {/* Póster / video */}
                <div className="relative w-24 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                  {it.poster ? (
                    <Image src={it.poster} alt="" fill className="object-cover" sizes="96px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                      <Film className="h-7 w-7" />
                    </div>
                  )}
                </div>

                {/* Centro */}
                <div className="flex-1 min-w-0 space-y-3">
                  {/* Producto enlazado */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Producto enlazado</p>
                    {product ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#111111]">{product.name}</span>
                        <span className="text-sm text-[#c9a84c] font-semibold">{formatPEN(product.price)}</span>
                      </div>
                    ) : it.productId ? (
                      <span className="text-sm text-red-500">Producto no encontrado o inactivo</span>
                    ) : (
                      <span className="text-sm text-gray-400">Sin producto</span>
                    )}

                    <div className="mt-1.5">
                      {pickerUid === it.uid ? (
                        <div className="border border-gray-200 rounded-lg p-2 space-y-2">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <input
                              autoFocus
                              value={pickerSearch}
                              onChange={(e) => setPickerSearch(e.target.value)}
                              placeholder="Buscar producto..."
                              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#111111]"
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {filteredProducts.length === 0 ? (
                              <p className="text-xs text-gray-400 text-center py-3">Sin resultados.</p>
                            ) : (
                              filteredProducts.slice(0, 50).map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => selectProduct(it.uid, p.id)}
                                  className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm rounded-md hover:bg-gray-50"
                                >
                                  <span className="flex-1 truncate">{p.name}</span>
                                  <span className="text-xs text-gray-400">{formatPEN(p.price)}</span>
                                </button>
                              ))
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => { setPickerUid(null); setPickerSearch(""); }}
                            className="text-xs text-gray-400 hover:text-[#111111]"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setPickerUid(it.uid); setPickerSearch(""); }}
                          className="text-xs font-medium text-[#111111] underline underline-offset-2 hover:text-[#c9a84c]"
                        >
                          {product || it.productId ? "Cambiar producto" : "Enlazar producto"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Video */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setVideoModalUid(it.uid)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-md hover:border-[#111111] transition-colors"
                    >
                      <Video className="h-3.5 w-3.5" /> {it.video ? "Cambiar video" : "Elegir video"}
                    </button>
                    <CldUploadWidget
                      uploadPreset="adamantio-products"
                      options={{ resourceType: "video", sources: ["local", "url"] }}
                      onSuccess={(result) => {
                        const info = result.info as { secure_url: string };
                        if (info?.secure_url) setVideo(it.uid, info.secure_url);
                      }}
                    >
                      {({ open }) => (
                        <button
                          type="button"
                          onClick={() => open()}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-dashed border-gray-300 rounded-md text-gray-500 hover:border-[#111111] hover:text-[#111111] transition-colors"
                        >
                          + Subir video
                        </button>
                      )}
                    </CldUploadWidget>
                    {it.video && <span className="text-xs text-green-600">Video listo</span>}
                    {!it.video && <span className="text-xs text-amber-600">Falta video</span>}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(it.uid, -1)}
                    disabled={idx === 0}
                    className="p-1.5 text-gray-400 hover:text-[#111111] disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Subir"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(it.uid, 1)}
                    disabled={idx === items.length - 1}
                    className="p-1.5 text-gray-400 hover:text-[#111111] disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Bajar"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(it.uid)}
                    className="p-1.5 text-gray-400 hover:text-red-500"
                    aria-label="Quitar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
          {invalidCount > 0 && (
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <X className="h-3 w-3" />
              {invalidCount} {invalidCount === 1 ? "item incompleto se omitirá" : "items incompletos se omitirán"}
            </span>
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-5 py-2.5 bg-[#111111] text-white text-sm font-medium rounded-lg hover:bg-[#333] disabled:opacity-50 transition-colors"
          >
            {saving ? "Guardando..." : "Guardar videos"}
          </button>
        </div>
      </div>

      <MediaLibraryModal
        open={videoModalUid !== null}
        onClose={() => setVideoModalUid(null)}
        currentImages={[]}
        mediaType="video"
        onConfirm={(urls) => {
          if (videoModalUid && urls[0]) setVideo(videoModalUid, urls[0]);
        }}
      />
    </div>
  );
}
