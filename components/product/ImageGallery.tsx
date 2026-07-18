"use client";

import { useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";

interface ImageGalleryProps {
  images: string[];
  name: string;
}

export function ImageGallery({ images, name }: ImageGalleryProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [emblaRef] = useEmblaCarousel({
    dragFree: true,
    align: "start",
    containScroll: "trimSnaps",
  });

  if (images.length === 0) {
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
      {/* Desktop layout: thumbnails left + main image right */}
      <div className="hidden sm:flex gap-3">
        {images.length > 1 && (
          <div className="flex flex-col gap-2 w-[68px] flex-shrink-0">
            {images.map((img, idx) => (
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
                  src={img}
                  alt={`${name} ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="68px"
                />
              </button>
            ))}
          </div>
        )}
        <div className="flex-1 relative aspect-square bg-white overflow-hidden">
          {images.map((img, idx) => (
            <Image
              key={idx}
              src={img}
              alt={name}
              fill
              className={`object-contain transition-opacity duration-[120ms] ${
                idx === selectedIdx ? "opacity-100" : "opacity-0"
              }`}
              sizes="(max-width: 1024px) 45vw, 500px"
              priority={idx === 0}
              loading={idx === 0 ? undefined : "eager"}
            />
          ))}
        </div>
      </div>

      {/* Mobile layout: free-scroll carousel with peek (Embla) */}
      <div ref={emblaRef} className="overflow-hidden sm:hidden">
        <div className="flex gap-0.5">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="w-[80%] flex-shrink-0 relative aspect-square bg-[#f5f5f5]"
            >
              <Image
                src={img}
                alt={`${name} ${idx + 1}`}
                fill
                className="object-contain"
                sizes="80vw"
                priority={idx === 0}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
