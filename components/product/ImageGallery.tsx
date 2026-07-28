"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { isVideoUrl, videoPosterUrl } from "@/lib/media";

interface ImageGalleryProps {
  /** Media de la galería: fotos y videos mezclados, en el orden en que se muestran. */
  images: string[];
  name: string;
}

type Slide =
  | { type: "image"; src: string }
  | { type: "video"; src: string; poster: string };

/** Badge ▶ que se superpone a las miniaturas de video. */
function PlayBadge({ size = 20 }: { size?: number }) {
  return (
    <span
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      aria-hidden
    >
      <span
        className="flex items-center justify-center rounded-full bg-black/45 backdrop-blur-[1px]"
        style={{ width: size, height: size }}
      >
        <svg
          width={size * 0.45}
          height={size * 0.45}
          viewBox="0 0 10 12"
          fill="white"
          style={{ marginLeft: size * 0.05 }}
        >
          <path d="M0 0L10 6L0 12Z" />
        </svg>
      </span>
    </span>
  );
}

export function ImageGallery({ images, name }: ImageGalleryProps) {
  const slides = useMemo<Slide[]>(
    () =>
      images.map((src) =>
        isVideoUrl(src)
          ? { type: "video" as const, src, poster: videoPosterUrl(src) }
          : { type: "image" as const, src }
      ),
    [images]
  );

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [mobileIdx, setMobileIdx] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    dragFree: true,
    align: "start",
    containScroll: "trimSnaps",
  });

  // Un ref por slide y por layout: desktop y móvil renderizan <video> distintos.
  const desktopVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const mobileVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setMobileIdx(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect).on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [emblaApi]);

  // Reproduce solo el video del slide activo; el resto pausa y vuelve al inicio.
  const syncPlayback = useCallback(
    (refs: (HTMLVideoElement | null)[], activeIdx: number) => {
      refs.forEach((video, idx) => {
        if (!video) return;
        if (idx === activeIdx) {
          video.play().catch(() => {});
        } else {
          video.pause();
          video.currentTime = 0;
        }
      });
    },
    []
  );

  useEffect(() => {
    syncPlayback(desktopVideoRefs.current, selectedIdx);
  }, [selectedIdx, slides, syncPlayback]);

  useEffect(() => {
    syncPlayback(mobileVideoRefs.current, mobileIdx);
  }, [mobileIdx, slides, syncPlayback]);

  if (slides.length === 0) {
    return (
      <div className="aspect-square bg-[#f5f5f5] flex items-center justify-center">
        <svg width="64" height="64" viewBox="0 0 48 48" fill="none" className="text-[#111111]/15">
          <path d="M6 24C6 24 10 16 24 16C38 16 42 24 42 24C42 24 38 32 24 32C10 32 6 24 6 24Z" stroke="currentColor" strokeWidth="1" fill="none"/>
          <circle cx="24" cy="24" r="4" stroke="currentColor" strokeWidth="1" fill="none"/>
        </svg>
      </div>
    );
  }

  return (
    <div>
      {/* Desktop layout: thumbnails left + main media right */}
      <div className="hidden sm:flex gap-3">
        {slides.length > 1 && (
          <div className="flex flex-col gap-2 w-[68px] flex-shrink-0">
            {slides.map((slide, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIdx(idx)}
                onMouseEnter={() => setSelectedIdx(idx)}
                onFocus={() => setSelectedIdx(idx)}
                className={`relative w-full aspect-square border overflow-hidden cursor-pointer transition-colors duration-150 ${
                  idx === selectedIdx
                    ? "border-[#1c1c1c]"
                    : "border-[#dadadd] hover:border-[#1c1c1c]/40"
                }`}
              >
                <Image
                  src={slide.type === "video" ? slide.poster : slide.src}
                  alt={`${name} ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="68px"
                />
                {slide.type === "video" && <PlayBadge size={22} />}
              </button>
            ))}
          </div>
        )}
        <div className="flex-1 relative aspect-square bg-white overflow-hidden">
          {slides.map((slide, idx) =>
            slide.type === "video" ? (
              <video
                key={idx}
                ref={(el) => {
                  desktopVideoRefs.current[idx] = el;
                }}
                src={slide.src}
                poster={slide.poster}
                muted
                loop
                playsInline
                preload="metadata"
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-[120ms] ${
                  idx === selectedIdx ? "opacity-100" : "opacity-0"
                }`}
              />
            ) : (
              <Image
                key={idx}
                src={slide.src}
                alt={name}
                fill
                className={`object-contain transition-opacity duration-[120ms] ${
                  idx === selectedIdx ? "opacity-100" : "opacity-0"
                }`}
                sizes="(max-width: 1024px) 45vw, 500px"
                priority={idx === 0}
                loading={idx === 0 ? undefined : "eager"}
              />
            )
          )}
        </div>
      </div>

      {/* Mobile layout: free-scroll carousel with peek (Embla) */}
      <div ref={emblaRef} className="overflow-hidden sm:hidden">
        <div className="flex gap-0.5">
          {slides.map((slide, idx) => (
            <div
              key={idx}
              className="w-[80%] flex-shrink-0 relative aspect-square bg-[#f5f5f5]"
            >
              {slide.type === "video" ? (
                <video
                  ref={(el) => {
                    mobileVideoRefs.current[idx] = el;
                  }}
                  src={slide.src}
                  poster={slide.poster}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 w-full h-full object-contain"
                />
              ) : (
                <Image
                  src={slide.src}
                  alt={`${name} ${idx + 1}`}
                  fill
                  className="object-contain"
                  sizes="80vw"
                  priority={idx === 0}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
