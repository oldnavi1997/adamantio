"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { isVideoUrl, posterDeliveryUrl, videoDeliveryUrl, videoPosterUrl } from "@/lib/media";
import cloudinaryLoader from "@/lib/cloudinary-loader";

/**
 * Los layouts desktop y móvil se montan los dos y solo se ocultan por CSS, así
 * que sin saber cuál está visible el invisible también reproduce y descarga el
 * video. `sm:` de Tailwind es 640px.
 */
const DESKTOP_MQ = "(min-width: 640px)";

function subscribeDesktop(onChange: () => void) {
  const mq = window.matchMedia(DESKTOP_MQ);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
const getDesktopSnapshot = () => window.matchMedia(DESKTOP_MQ).matches;
/**
 * `null` = todavía no sabemos el layout (SSR e hidratación). Mientras tanto no
 * reproduce ninguno de los dos: si acá devolviéramos `false`, en desktop el
 * layout móvil alcanzaría a descargar el video antes de que se corrija.
 */
const getDesktopServerSnapshot = (): boolean | null => null;

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

/** Un GIF ya es el original: no se pasa por el loader ni se le pide capa nítida. */
const esGif = (url: string) => /\.gif$/i.test(url);

const ZOOM_MAX = 4;
/** Zoom de un doble toque/clic: suficiente para leer un grabado sin perder el encuadre. */
const ZOOM_DOBLE = 2.5;
/**
 * Ancho de la capa nítida del lightbox. Se pide al loader a mano en vez de
 * agregarlo a `deviceSizes`: por el `srcset` lo heredaría toda vista que use
 * anchos en `vw`, y acá sólo lo necesita el zoom.
 *
 * Cubre el zoom máximo: 4x sobre una caja de ~342 px en un teléfono a 3x son
 * ~4100 px. Es además el piso del master en `lib/cloudinary.ts`. En las fotos
 * que se subieron chicas `c_limit` devuelve su tamaño real: no hay ampliación,
 * sólo menos detalle.
 */
const ANCHO_ZOOM = 3840;

/**
 * La foto del lightbox, con zoom. Portada de Luminus.
 *
 * Todo pasa por Pointer Events, que unifican dedo y mouse: dos punteros
 * pellizcan, uno arrastra. El `touch-action: none` es imprescindible — sin él el
 * navegador se queda el gesto para hacer scroll o su propio zoom de página.
 *
 * El acercamiento conserva el punto bajo el dedo: mantenerlo fijo al pasar de
 * `s0` a `s1` da `d1 = d0 + (p - d0) * (1 - s1/s0)`.
 */
function FotoConZoom({
  src,
  alt,
  onTap,
}: {
  src: string;
  alt: string;
  /** Un toque limpio, sin arrastre ni zoom: el overlay lo usa para cerrarse. */
  onTap: () => void;
}) {
  // Escala y desplazamiento en un solo estado, para que los updaters sean puros.
  const [vista, setVista] = useState({ escala: 1, x: 0, y: 0 });
  const { escala } = vista;
  const [hiResLista, setHiResLista] = useState(() => esGif(src));
  const cajaRef = useRef<HTMLDivElement>(null);
  const punteros = useRef(new Map<number, { x: number; y: number }>());
  const pellizco = useRef<{ dist: number; escala: number; centro: { x: number; y: number } } | null>(null);
  const arrastre = useRef<{ x: number; y: number; desp: { x: number; y: number }; movido: boolean } | null>(null);
  const ultimoTap = useRef(0);
  /**
   * El cierre por toque simple espera a ver si viene un segundo toque. Sin esta
   * espera el primer toque de un doble toque cierra el lightbox y el segundo
   * cae sobre la galería de abajo.
   */
  const cierrePendiente = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Hay un dedo/botón apoyado: mientras dure, la transformación sigue al dedo sin transición. */
  const [gesto, setGesto] = useState(false);

  const ampliada = escala > 1.01;

  /** Impide que la foto se despegue de su caja: a escala `s` sobra `(s-1)/2` por lado. */
  const limitar = useCallback((v: { escala: number; x: number; y: number }) => {
    const caja = cajaRef.current;
    if (!caja) return v;
    const maxX = (caja.clientWidth * (v.escala - 1)) / 2;
    const maxY = (caja.clientHeight * (v.escala - 1)) / 2;
    return {
      escala: v.escala,
      x: Math.max(-maxX, Math.min(maxX, v.x)),
      y: Math.max(-maxY, Math.min(maxY, v.y)),
    };
  }, []);

  /** Lleva la escala a `s1` dejando quieto el punto `p` (relativo al centro de la caja). */
  const acercarA = useCallback(
    (s1: number, p: { x: number; y: number }) => {
      setVista((v) => {
        const s = Math.max(1, Math.min(ZOOM_MAX, s1));
        if (s === 1) return { escala: 1, x: 0, y: 0 };
        const factor = 1 - s / v.escala;
        return limitar({ escala: s, x: v.x + (p.x - v.x) * factor, y: v.y + (p.y - v.y) * factor });
      });
    },
    [limitar]
  );

  /** Coordenadas de un evento respecto del centro de la caja. */
  const respectoAlCentro = (e: { clientX: number; clientY: number }) => {
    const r = cajaRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: e.clientX - (r.left + r.width / 2), y: e.clientY - (r.top + r.height / 2) };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    // Con la captura, arrastrar más allá del borde sigue mandando eventos acá.
    // Capturar un puntero que el navegador ya no considera activo lanza.
    try {
      (e.target as Element).setPointerCapture?.(e.pointerId);
    } catch {
      /* sin captura, el gesto sigue funcionando mientras el dedo no se salga */
    }
    punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setGesto(true);
    if (cierrePendiente.current) {
      clearTimeout(cierrePendiente.current);
      cierrePendiente.current = null;
    }

    if (punteros.current.size === 2) {
      const [a, b] = [...punteros.current.values()];
      pellizco.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        escala,
        centro: respectoAlCentro({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 }),
      };
      arrastre.current = null;
    } else if (punteros.current.size === 1) {
      arrastre.current = { x: e.clientX, y: e.clientY, desp: { x: vista.x, y: vista.y }, movido: false };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!punteros.current.has(e.pointerId)) return;
    punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (punteros.current.size >= 2 && pellizco.current) {
      const [a, b] = [...punteros.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      acercarA((pellizco.current.escala * dist) / pellizco.current.dist, pellizco.current.centro);
      return;
    }

    const arr = arrastre.current;
    if (!arr || !ampliada) return;
    const dx = e.clientX - arr.x;
    const dy = e.clientY - arr.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) arr.movido = true;
    setVista((v) => limitar({ escala: v.escala, x: arr.desp.x + dx, y: arr.desp.y + dy }));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    punteros.current.delete(e.pointerId);
    if (punteros.current.size < 2) pellizco.current = null;

    const arr = arrastre.current;
    arrastre.current = null;
    if (punteros.current.size > 0) return;
    setGesto(false);

    // Doble toque: alterna entre ajustada y ampliada sobre el punto tocado.
    const ahora = Date.now();
    const esDoble = ahora - ultimoTap.current < 300;
    ultimoTap.current = ahora;
    if (esDoble && !arr?.movido) {
      acercarA(ampliada ? 1 : ZOOM_DOBLE, respectoAlCentro(e));
      return;
    }
    // Un toque sin más, con la foto ajustada, cierra. Ampliada no: ahí el
    // usuario está mirando, y para salir están la X y el doble toque.
    if (!arr?.movido && !ampliada) {
      cierrePendiente.current = setTimeout(onTap, 280);
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    acercarA(escala * Math.exp(-e.deltaY / 400), respectoAlCentro(e));
  };

  // Sin un empujón nadie prueba a pellizcar una foto que ya está entera en
  // pantalla. La pista se va sola y no vuelve.
  const [pista, setPista] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setPista(false), 3500);
    return () => {
      clearTimeout(t);
      if (cierrePendiente.current) clearTimeout(cierrePendiente.current);
    };
  }, []);

  return (
    <div
      ref={cajaRef}
      className="absolute inset-0 touch-none select-none"
      style={{ cursor: ampliada ? "grab" : "zoom-in" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${vista.x}px, ${vista.y}px) scale(${escala})`,
          transition: gesto ? "none" : "transform 0.15s ease-out",
        }}
      >
        <Image src={src} alt={alt} fill className="object-contain" sizes="90vw" priority unoptimized={esGif(src)} />
        {/* La capa nítida se pide al abrir, no al acercar: es la única forma de
            que el zoom sea instantáneo. Se revela al terminar de cargar, para no
            tapar la foto ajustada con un hueco en blanco. */}
        {!esGif(src) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cloudinaryLoader({ src, width: ANCHO_ZOOM })}
            alt=""
            aria-hidden
            fetchPriority="high"
            // `complete` cubre la imagen que ya estaba en caché y disparó `load`
            // antes de que React montara el handler.
            ref={(el) => {
              if (el?.complete && el.naturalWidth > 0) setHiResLista(true);
            }}
            onLoad={() => setHiResLista(true)}
            onError={() => setHiResLista(true)}
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-200 ${
              hiResLista ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
      </div>

      <div
        className={`pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3.5 py-1.5 text-[11px] tracking-wide text-[#111111] shadow-sm transition-opacity duration-500 ${
          ampliada && !hiResLista ? "opacity-100" : pista && !ampliada ? "opacity-100" : "opacity-0"
        }`}
      >
        {ampliada ? (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border border-[#111111]/25 border-t-[#111111]/70" />
            Afinando detalle…
          </span>
        ) : (
          <>
            <span className="sm:hidden">Pellizca para acercar</span>
            <span className="hidden sm:inline">Rueda o doble clic para acercar</span>
          </>
        )}
      </div>
    </div>
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

  const isDesktop = useSyncExternalStore<boolean | null>(
    subscribeDesktop,
    getDesktopSnapshot,
    getDesktopServerSnapshot
  );

  // Reproduce solo el video del slide activo; el resto pausa y vuelve al inicio.
  // `activeIdx = -1` apaga el layout entero (el que está oculto por CSS).
  const syncPlayback = useCallback(
    (refs: (HTMLVideoElement | null)[], activeIdx: number) => {
      refs.forEach((video, idx) => {
        if (!video) return;
        if (idx === activeIdx) {
          // El src se asigna recién acá: los slides que nunca se miran —y el
          // layout que no está visible— no descargan un solo byte.
          const slide = slides[idx];
          if (!video.src && slide?.type === "video") {
            video.src = videoDeliveryUrl(slide.src);
          }
          video.play().catch(() => {});
        } else {
          video.pause();
          // Con `preload="none"` un src recién asignado aún no tiene metadata;
          // tocar currentTime antes de tiempo lanza InvalidStateError.
          if (video.readyState > 0) video.currentTime = 0;
        }
      });
    },
    [slides]
  );

  /** Slide abierto en el lightbox, o `null` si está cerrado. */
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const lightboxOpen = lightboxIdx !== null;

  // Con el lightbox abierto la galería de abajo no reproduce: el video, si toca,
  // se ve en el lightbox.
  useEffect(() => {
    syncPlayback(desktopVideoRefs.current, isDesktop === true && !lightboxOpen ? selectedIdx : -1);
  }, [selectedIdx, slides, syncPlayback, isDesktop, lightboxOpen]);

  useEffect(() => {
    syncPlayback(mobileVideoRefs.current, isDesktop === false && !lightboxOpen ? mobileIdx : -1);
  }, [mobileIdx, slides, syncPlayback, isDesktop, lightboxOpen]);

  const cerrarLightbox = useCallback(() => setLightboxIdx(null), []);
  const showPrev = useCallback(
    () => setLightboxIdx((i) => (i === null ? i : (i - 1 + slides.length) % slides.length)),
    [slides.length]
  );
  const showNext = useCallback(
    () => setLightboxIdx((i) => (i === null ? i : (i + 1) % slides.length)),
    [slides.length]
  );

  // Teclado y bloqueo del scroll mientras el lightbox está abierto.
  useEffect(() => {
    if (!lightboxOpen) return;
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrarLightbox();
      else if (e.key === "ArrowLeft") showPrev();
      else if (e.key === "ArrowRight") showNext();
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handler);
    };
  }, [lightboxOpen, cerrarLightbox, showPrev, showNext]);

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
                poster={posterDeliveryUrl(slide.poster, 800)}
                muted
                loop
                playsInline
                preload="none"
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
          {/* Sobre un video no: ahí el clic es del reproductor. */}
          {slides[selectedIdx]?.type === "image" && (
            <button
              type="button"
              onClick={() => setLightboxIdx(selectedIdx)}
              aria-label="Ampliar imagen"
              className="absolute inset-0 cursor-zoom-in"
            />
          )}
        </div>
      </div>

      {/* Mobile layout: free-scroll carousel with peek (Embla) */}
      <div className="relative sm:hidden">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex gap-0.5">
            {slides.map((slide, idx) => (
              <div
                key={idx}
                // Embla anula el clic que termina un arrastre, así que tocar abre
                // y deslizar no.
                onClick={slide.type === "image" ? () => setLightboxIdx(idx) : undefined}
                className="w-[80%] flex-shrink-0 relative aspect-square bg-[#f5f5f5]"
              >
                {slide.type === "video" ? (
                  <>
                    <video
                      ref={(el) => {
                        mobileVideoRefs.current[idx] = el;
                      }}
                      poster={posterDeliveryUrl(slide.poster, 800)}
                      muted
                      loop
                      playsInline
                      preload="none"
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                    {/* Hasta que el slide queda activo el video es un póster quieto
                        y no se distingue de una foto. Abajo a la izquierda porque
                        es lo que asoma del slide siguiente en el peek, y arriba a la
                        derecha ya está la lupa de la foto activa. */}
                    <span
                      aria-hidden
                      className="absolute bottom-3 left-3 z-10 w-9 h-9 rounded-full bg-black/55 backdrop-blur-sm shadow-md flex items-center justify-center pointer-events-none"
                    >
                      <svg width="12" height="14" viewBox="0 0 10 12" fill="white" style={{ marginLeft: 2 }}>
                        <path d="M0 0L10 6L0 12Z" />
                      </svg>
                    </span>
                  </>
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
        {/* La lupa: sin ella nadie sabe que la foto se puede ampliar. */}
        {slides[mobileIdx]?.type === "image" && (
          <button
            type="button"
            onClick={() => setLightboxIdx(mobileIdx)}
            aria-label="Ampliar imagen"
            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-[#111111] active:scale-95 transition-transform"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        )}
      </div>

      {lightboxIdx !== null && slides[lightboxIdx] && (
        <div
          className="fixed inset-0 z-[60] bg-[#f8f7f4] animate-[fade-in_0.2s_ease-out] flex items-center justify-center"
          onClick={cerrarLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={`${name} — imagen ampliada`}
        >
          <div className="relative w-full h-full max-w-5xl max-h-[85vh] mx-auto px-6 sm:px-16">
            <div className="relative w-full h-full">
              {(() => {
                const slide = slides[lightboxIdx];
                return slide.type === "video" ? (
                  // El clic se detiene acá: los controles nativos del video
                  // viven dentro del overlay, y el overlay cierra al clic.
                  <div className="absolute inset-0" onClick={(e) => e.stopPropagation()}>
                    <video
                      key={slide.src}
                      src={videoDeliveryUrl(slide.src)}
                      poster={posterDeliveryUrl(slide.poster, 1080)}
                      autoPlay
                      muted
                      loop
                      playsInline
                      controls
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  // `key` por foto: cada una entra ajustada, sin la escala de la anterior.
                  <FotoConZoom
                    key={slide.src}
                    src={slide.src}
                    alt={`${name} ${lightboxIdx + 1}`}
                    onTap={cerrarLightbox}
                  />
                );
              })()}
            </div>
          </div>

          {/* Por encima de la foto, que al ampliarse desborda su caja */}
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {slides.length > 1 && (
              <button
                type="button"
                onClick={showPrev}
                aria-label="Imagen anterior"
                className="w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center text-[#111111] hover:bg-[#f3f4f6] transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <button
              type="button"
              onClick={cerrarLightbox}
              aria-label="Cerrar"
              className="w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center text-[#111111] hover:bg-[#f3f4f6] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            {slides.length > 1 && (
              <button
                type="button"
                onClick={showNext}
                aria-label="Imagen siguiente"
                className="w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center text-[#111111] hover:bg-[#f3f4f6] transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
