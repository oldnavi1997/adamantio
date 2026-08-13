"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { posterDeliveryUrl, thumbDeliveryUrl, videoDeliveryUrl } from "@/lib/media";

export type SpotlightItem = {
  id: string;
  name: string;
  price: string;
  href: string;
  video: string;
  poster: string;
};

const CARD_RATIO = 0.72;
const GAP = 12;
const BREAKPOINT = 641;
const SWIPE_THRESHOLD = 40;

export function VideoSpotlight({ items: ITEMS }: { items: SpotlightItem[] }) {
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);
  const [containerWidth, setContainerWidth] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  // El carrusel vive bajo el hero: sin esto, todo visitante que nunca baja
  // igual se descargaba el video. Solo cargamos cuando la sección se ve.
  const [inView, setInView] = useState(false);
  const touchStartX = useRef(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const outerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    setContainerWidth(el.offsetWidth);
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    videoRefs.current.forEach((vid, i) => {
      if (!vid) return;
      if (i === active && inView) {
        // El src se asigna recién aquí: quien nunca baja hasta la sección no
        // descarga un solo byte de video. Una vez asignado se conserva, así
        // volver a una tarjeta anterior es instantáneo.
        if (!vid.src) vid.src = videoDeliveryUrl(ITEMS[i].video);
        // Con `preload="none"` el src recién asignado aún no tiene metadata;
        // tocar currentTime antes de tiempo lanza InvalidStateError.
        if (vid.readyState > 0) vid.currentTime = 0;
        vid.play().catch(() => {});
      } else {
        vid.pause();
        if (vid.readyState > 0) vid.currentTime = 0;
      }
    });
  }, [active, inView, ITEMS]);

  function go(dir: "prev" | "next") {
    setActive((prev) => {
      if (dir === "next") return (prev + 1) % ITEMS.length;
      return (prev - 1 + ITEMS.length) % ITEMS.length;
    });
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    setDragging(true);
    setDragOffset(0);
  }

  function handleTouchMove(e: React.TouchEvent) {
    const delta = e.touches[0].clientX - touchStartX.current;
    if ((active === 0 && delta > 0) || (active === ITEMS.length - 1 && delta < 0)) {
      setDragOffset(delta * 0.25);
    } else {
      setDragOffset(delta);
    }
  }

  function handleTouchEnd() {
    setDragging(false);
    if (dragOffset < -SWIPE_THRESHOLD && active < ITEMS.length - 1) go("next");
    else if (dragOffset > SWIPE_THRESHOLD && active > 0) go("prev");
    setDragOffset(0);
  }

  if (ITEMS.length === 0) return null;

  const isMobile = containerWidth > 0 && containerWidth < BREAKPOINT;
  const cardWidth = Math.round(containerWidth * CARD_RATIO);
  const peekWidth = Math.round((containerWidth - cardWidth) / 2);
  const slideOffset = isMobile ? peekWidth - active * (cardWidth + GAP) + dragOffset : 0;

  return (
    <section className="vs-section" aria-label="Descubre nuestras favoritas">
      <style>{`
        .vs-section { padding: 4rem 0 3rem; background: #0a0a0a; color: #fff; text-align: center; }
        .vs-heading { font-size: clamp(1.5rem, 4vw, 2.25rem); font-weight: 400; letter-spacing: 0.04em; margin-bottom: 0.5rem; padding: 0 1.5rem; color: #fff; }
        .vs-heading em { font-style: italic; color: #c8a96e; }
        .vs-subheading { font-size: 0.95rem; color: #999; margin-bottom: 2rem; letter-spacing: 0.03em; padding: 0 1.5rem; }
        .vs-carousel-outer { overflow: hidden; width: 100%; }
        .vs-track { display: flex; gap: ${GAP}px; transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94); padding: 8px 0 12px; align-items: stretch; }
        .vs-card { border-radius: 14px; overflow: hidden; cursor: pointer; position: relative; background: #111; border: 2px solid transparent; transition: border-color 0.25s, transform 0.3s, opacity 0.3s; flex-shrink: 0; }
        .vs-card.vs-card--inactive { opacity: 0.5; transform: scale(0.95); }
        .vs-card.vs-card--active { border-color: #c8a96e; opacity: 1; transform: scale(1); }
        .vs-video-wrap { position: relative; aspect-ratio: 9/16; background: #000; }
        .vs-video { width: 100%; height: 100%; object-fit: cover; display: block; }
        .vs-mute-btn { position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.25); border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #fff; z-index: 2; transition: background 0.2s; }
        .vs-mute-btn:hover { background: rgba(0,0,0,0.8); }
        .vs-info { display: flex; align-items: center; gap: 0.65rem; padding: 0.7rem 0.75rem; text-decoration: none; background: #161616; transition: background 0.2s; }
        .vs-info:hover { background: #1e1e1e; }
        .vs-thumb { width: 44px; height: 44px; border-radius: 6px; object-fit: cover; flex-shrink: 0; border: 1.5px solid #2a2a2a; background: #222; }
        .vs-text { flex: 1; min-width: 0; text-align: left; }
        .vs-name { font-size: 0.78rem; font-weight: 500; letter-spacing: 0.02em; color: #eee; margin-bottom: 0.15rem; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .vs-price { font-size: 0.82rem; color: #c8a96e; font-weight: 600; }
        .vs-arrow { color: #666; flex-shrink: 0; transition: color 0.2s, transform 0.2s; }
        .vs-info:hover .vs-arrow { color: #c8a96e; transform: translateX(2px); }
        .vs-nav { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 1.25rem; padding: 0 1.5rem; }
        .vs-nav-btn { background: transparent; border: 1px solid #444; border-radius: 50%; width: 40px; height: 40px; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: border-color 0.2s, background 0.2s; }
        .vs-nav-btn:hover { border-color: #c8a96e; background: rgba(200,169,110,0.1); }
        .vs-dots { display: flex; gap: 6px; }
        .vs-dot { width: 6px; height: 6px; border-radius: 50%; background: #444; cursor: pointer; transition: background 0.2s, transform 0.2s; border: none; padding: 0; }
        .vs-dot--active { background: #c8a96e; transform: scale(1.4); }
        @media (min-width: ${BREAKPOINT}px) {
          .vs-section { padding: 4rem 1.5rem 3rem; }
          .vs-carousel-outer { overflow: visible; max-width: 1000px; margin: 0 auto; }
          .vs-track { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; transform: none !important; }
          .vs-card { width: 100%; }
        }
      `}</style>

      <h2 className="vs-heading">Descubre nuestras <em>favoritas</em></h2>
      <p className="vs-subheading">Toca cualquier pieza para ver el video</p>

      <div className="vs-carousel-outer" ref={outerRef}>
        <div
          className="vs-track"
          style={{ transform: `translateX(${slideOffset}px)`, transition: dragging ? "none" : undefined }}
          onTouchStart={isMobile ? handleTouchStart : undefined}
          onTouchMove={isMobile ? handleTouchMove : undefined}
          onTouchEnd={isMobile ? handleTouchEnd : undefined}
        >
          {ITEMS.map((item, i) => (
            <div
              key={item.id}
              className={`vs-card ${i === active ? "vs-card--active" : "vs-card--inactive"}`}
              style={isMobile ? { width: `${cardWidth}px` } : undefined}
            >
              <div className="vs-video-wrap" onClick={() => setActive(i)}>
                <video
                  ref={(el) => { videoRefs.current[i] = el; }}
                  poster={posterDeliveryUrl(item.poster)}
                  className="vs-video"
                  muted={muted}
                  loop
                  playsInline
                  preload="none"
                />
                {i === active && (
                  <button
                    className="vs-mute-btn"
                    onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
                    aria-label={muted ? "Activar sonido" : "Silenciar"}
                  >
                    {muted ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <line x1="23" y1="9" x2="17" y2="15" />
                        <line x1="17" y1="9" x2="23" y2="15" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      </svg>
                    )}
                  </button>
                )}
              </div>

              <Link href={item.href} className="vs-info">
                <img src={thumbDeliveryUrl(item.poster)} alt={item.name} className="vs-thumb" loading="lazy" width={44} height={44} />
                <div className="vs-text">
                  <p className="vs-name">{item.name}</p>
                  <p className="vs-price">S/ {item.price}</p>
                </div>
                <svg className="vs-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </div>

      <nav className="vs-nav" aria-label="Navegación de videos">
        <button className="vs-nav-btn" onClick={() => go("prev")} aria-label="Anterior">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="vs-dots">
          {ITEMS.map((_, i) => (
            <button key={i} className={`vs-dot${i === active ? " vs-dot--active" : ""}`} onClick={() => setActive(i)} aria-label={`Ir al video ${i + 1}`} />
          ))}
        </div>
        <button className="vs-nav-btn" onClick={() => go("next")} aria-label="Siguiente">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </nav>
    </section>
  );
}
