"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const colors = [
  { name: "Gris",      icon: "https://res.cloudinary.com/dzqns7kss/image/upload/v1773436154/3e0b81c3a4959bed93bb361e4740b370_fkby8p.png",  videoTime: 0,  isNew: false, soon: false },
  { name: "Verde",     icon: "https://res.cloudinary.com/dzqns7kss/image/upload/v1773436155/2902d392307a9655aa4fb2495a1a08e5_ntujkm.png",  videoTime: 5,  isNew: false, soon: false },
  { name: "Amatista",  icon: "https://res.cloudinary.com/dzqns7kss/image/upload/v1773436152/3f02d839c7403fd8f05c946ed73ae4f6_oipklg.png",  videoTime: 10, isNew: false, soon: false },
  { name: "Ámbar",     icon: "https://res.cloudinary.com/dzqns7kss/image/upload/v1773436156/03db061a2b83ddf42c8c932dea46ffdc_sgcjbr.png",  videoTime: 15, isNew: false, soon: true  },
  { name: "Zafiro",    icon: "https://res.cloudinary.com/dzqns7kss/image/upload/v1773436152/d40753570a582bb5a028caf79fab71cb_gle3gv.png",  videoTime: 20, isNew: false, soon: false },
  { name: "Esmeralda", icon: "https://res.cloudinary.com/dzqns7kss/image/upload/v1773436915/emerald_hllhj3.webp",                          videoTime: 25, isNew: false, soon: true  },
  { name: "Café",      icon: "https://res.cloudinary.com/dzqns7kss/image/upload/v1773436151/3db386aa7867d2e71385119e3dc74a00_ojrpny.png",  videoTime: 30, isNew: false, soon: false },
  { name: "Rubí",      icon: "https://res.cloudinary.com/dzqns7kss/image/upload/v1773436158/6ac8376d1d21390f09b8afeff8d9acb1_jnlxl9.png",  videoTime: 35, isNew: true,  soon: false },
];

const features = [
  { icon: "https://res.cloudinary.com/dzqns7kss/image/upload/v1773434482/Gemini_Generated_Image_slrlh3slrlh3slrl_znshgw.png", label: "Visión sin esfuerzo" },
  { icon: "https://res.cloudinary.com/dzqns7kss/image/upload/v1773434490/Gemini_Generated_Image_jzpy6yjzpy6yjzpy_w5lpw0.png", label: "Desempeño fotocromático duradero" },
  { icon: "https://res.cloudinary.com/dzqns7kss/image/upload/v1773434486/Gemini_Generated_Image_i8wcefi8wcefi8wc_s77syw.png", label: "Totalmente claros en interiores" },
  { icon: "https://res.cloudinary.com/dzqns7kss/image/upload/v1773434492/Gemini_Generated_Image_q0x8n3q0x8n3q0x8_avrymz.png", label: "Sorprendentemente rápidos" },
  { icon: "https://res.cloudinary.com/dzqns7kss/image/upload/v1773434488/Gemini_Generated_Image_yuuub0yuuub0yuuu_jobmco.png", label: "Se activan en segundos¹" },
  { icon: "https://res.cloudinary.com/dzqns7kss/image/upload/v1773434615/Gemini_Generated_Image_534rsc534rsc534r_qbasri.png", label: "Bloquean el 100% de los rayos UVA & UVB. Filtran la luz azul-violeta en interiores y en exteriores²" },
];

export default function TransitionsGenS() {
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const colorsVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const video = colorsVideoRef.current;
    if (!video) return;
    const onTimeUpdate = () => {
      setActiveIndex(Math.min(Math.floor(video.currentTime / 5), 7));
    };
    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, []);

  const seekToColor = (videoTime: number) => {
    if (colorsVideoRef.current) {
      colorsVideoRef.current.currentTime = videoTime;
      colorsVideoRef.current.play();
    }
  };

  return (
    <div
      style={{
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        minHeight: "100vh",
        background: "#fff",
        overflowX: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700;900&display=swap');

        .fade-in {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .fade-in.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .delay-1 { transition-delay: 0.1s; }
        .delay-2 { transition-delay: 0.2s; }
        .delay-3 { transition-delay: 0.3s; }
        .delay-4 { transition-delay: 0.4s; }
        .delay-5 { transition-delay: 0.5s; }

        .tg-hero-section {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .tg-hero-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
        }

        .tg-hero-bg video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .tg-nuevo-watermark {
          position: absolute;
          top: -20px;
          left: -20px;
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          font-size: clamp(80px, 15vw, 180px);
          color: rgba(255,255,255,0.12);
          letter-spacing: -5px;
          user-select: none;
          line-height: 1;
          z-index: 1;
        }

        .tg-hero-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 60px 40px 60px 60px;
          max-width: 600px;
          width: 100%;
        }

        .tg-transitions-logo {
          margin-bottom: 8px;
        }

        .tg-gens-badge {
          display: flex;
          flex-direction: column;
          margin-bottom: 20px;
        }

        .tg-nueva-genialidad {
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 10px;
          letter-spacing: 3px;
          color: rgba(255,255,255,0.85);
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .tg-gens-logo {
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          font-size: clamp(48px, 8vw, 80px);
          color: white;
          letter-spacing: -3px;
          line-height: 0.9;
          text-transform: lowercase;
        }

        .tg-gens-logo .tg-asterisk {
          color: rgba(255,255,255,0.7);
          font-size: 0.6em;
        }

        .tg-hero-tagline {
          font-family: 'Montserrat', sans-serif;
          font-weight: 300;
          font-size: clamp(36px, 5vw, 48px);
          color: #f3f4f4;
          line-height: 1.125;
          letter-spacing: 0;
          margin-bottom: 24px;
        }

        .tg-hero-tagline b {
          display: block;
          font-weight: 700;
        }

        .tg-color-dots {
          display: flex;
          gap: 10px;
          margin-bottom: 32px;
        }

        .tg-hero-footer {
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: clamp(10px, 1.5vw, 14px);
          letter-spacing: 2px;
          color: white;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tg-hero-footer .tg-dot-sep {
          color: rgba(255,255,255,0.6);
          font-size: 18px;
        }

        .tg-info-section {
          background: white;
          padding: 70px 60px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .tg-info-header {
          border-bottom: 3px solid #1A1A1A;
          padding-bottom: 20px;
          margin-bottom: 32px;
        }

        .tg-gens-header-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .tg-lentes-title {
          font-family: 'Montserrat', sans-serif;
          font-size: clamp(28px, 4vw, 46px);
          font-weight: 800;
          color: #1A1A1A;
          letter-spacing: -1px;
          margin-bottom: 8px;
          line-height: 1;
        }

        .tg-lentes-subtitle {
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 3px;
          color: #555;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tg-lentes-subtitle .tg-sep {
          color: #E87D6A;
          font-size: 16px;
        }

        .tg-description {
          font-family: 'Montserrat', sans-serif;
          font-size: 15px;
          line-height: 1.7;
          color: #444;
          max-width: 680px;
          margin-bottom: 48px;
        }

        .tg-description em {
          font-style: italic;
          font-weight: 600;
        }

        .tg-features-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          margin-bottom: 60px;
        }

        .tg-feature-item {
          display: flex;
          align-items: center;
          gap: 0;
          padding: 20px 16px 20px 0;
          border-bottom: 1px solid #EBEBEB;
        }

        .tg-feature-icon {
          width: 68px;
          min-width: 68px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tg-feature-divider {
          width: 3px;
          min-width: 3px;
          height: 44px;
          border-radius: 2px;
          margin: 0 16px;
          flex-shrink: 0;
        }

        .tg-feature-divider.orange { background: #E87D6A; }
        .tg-feature-divider.blue   { background: #4A90D9; }

        .tg-feature-label {
          font-family: 'Montserrat', sans-serif;
          font-size: 12.5px;
          font-weight: 600;
          color: #1A1A1A;
          line-height: 1.45;
        }

        .tg-colors-fullwidth {
          position: relative;
          width: 100%;
          overflow: hidden;
          display: block;
        }

        .tg-colors-fullwidth-video {
          display: block;
          width: 100%;
          height: auto;
        }

        @media (max-width: 768px) {
          .tg-colors-fullwidth {
            height: 70vh;
          }
          .tg-colors-fullwidth-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
          }
        }

        .tg-colors-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(0,0,0,0.25) 0%,
            rgba(0,0,0,0) 30%,
            rgba(0,0,0,0) 60%,
            rgba(0,0,0,0.5) 100%
          );
          pointer-events: none;
        }

        .tg-colors-fullwidth-title {
          position: absolute;
          top: 8%;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1;
          font-family: 'Montserrat', sans-serif;
          font-weight: 300;
          font-size: clamp(16px, 2.5vw, 24px);
          color: white;
          text-align: center;
          letter-spacing: 2px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .tg-colors-fullwidth-title strong {
          font-weight: 800;
        }

        .tg-colors-bottom {
          position: absolute;
          bottom: 8%;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }

        .tg-colors-dots-row {
          display: flex;
          gap: 12px;
          align-items: center;
          background: white;
          border-radius: 8px;
          padding: 10px 20px;
        }

        .tg-active-color-name {
          font-family: 'Agrandir', 'Montserrat', sans-serif;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: white;
          text-align: center;
          white-space: nowrap;
          text-shadow: 0 1px 6px rgba(0,0,0,0.35);
        }

        .tg-color-dot-wrap {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .tg-color-dot {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid rgba(0,0,0,0.12);
          transition: transform 0.3s ease, opacity 0.3s ease, filter 0.3s ease;
          flex-shrink: 0;
        }

        .tg-color-dot:hover {
          transform: scale(1.25);
        }

        .tg-dot-inactive .tg-color-dot {
          opacity: 0.35;
          filter: brightness(1.8) blur(0.6px);
        }

        .tg-dot-new {
          position: absolute;
          top: -5px;
          right: -5px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #E87D6A;
          border: 1.5px solid rgba(0,0,0,0.4);
        }

        .tg-footnotes {
          margin-top: 48px;
          padding-top: 20px;
          border-top: 1px solid #E8E8E8;
        }

        .tg-footnote {
          font-family: 'Montserrat', sans-serif;
          font-size: 10px;
          color: #999;
          line-height: 1.6;
          margin-bottom: 4px;
        }

        .tg-page-wrapper {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
        }

@media (max-width: 900px) {
          .tg-page-wrapper {
            grid-template-columns: 1fr;
          }
          .tg-hero-section {
            min-height: 60vh;
          }
          .tg-colors-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .tg-features-grid {
            grid-template-columns: 1fr;
          }
          .tg-feature-divider.blue { background: #E87D6A; }
          .tg-info-section {
            padding: 40px 24px;
          }
          .tg-hero-content {
            padding: 40px 24px;
          }
        }
      `}</style>

      <div className="tg-page-wrapper">
        {/* LEFT: Hero */}
        <div className="tg-hero-section">
          <div className="tg-hero-bg">
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster="https://res.cloudinary.com/dzqns7kss/video/upload/so_0,f_jpg,q_80,w_1280/v1773435949/gen-s-genstyle_bvpgyx.jpg"
            >
              <source src="https://res.cloudinary.com/dzqns7kss/video/upload/f_mp4,q_auto,vc_h264/v1773435949/gen-s-genstyle_bvpgyx.mp4" type="video/mp4" />
              <source src="https://res.cloudinary.com/dzqns7kss/video/upload/f_webm,q_auto/v1773435949/gen-s-genstyle_bvpgyx.webm" type="video/webm" />
            </video>
          </div>
          <div className="tg-nuevo-watermark">NUEVO</div>

          <div className={`tg-hero-content fade-in ${visible ? "visible" : ""}`}>
            <div className={`tg-transitions-logo fade-in delay-1 ${visible ? "visible" : ""}`}>
              <Image
                src="https://res.cloudinary.com/dzqns7kss/image/upload/v1773432848/imgi_1_transitionsgenslogo_eq17ca.png"
                alt="Transitions® GEN S logo"
                width={220}
                height={60}
                className="object-contain"
                priority
              />
            </div>

            <div className={`tg-hero-tagline fade-in delay-3 ${visible ? "visible" : ""}`}>
              LENTES<b>ULTRA</b><b>DINÁMICOS</b>
            </div>

            <div className={`tg-color-dots fade-in delay-4 ${visible ? "visible" : ""}`}>
              {[
                "https://res.cloudinary.com/dzqns7kss/image/upload/v1773436158/6ac8376d1d21390f09b8afeff8d9acb1_jnlxl9.png",
                "https://res.cloudinary.com/dzqns7kss/image/upload/v1773436156/03db061a2b83ddf42c8c932dea46ffdc_sgcjbr.png",
                "https://res.cloudinary.com/dzqns7kss/image/upload/v1773436155/2902d392307a9655aa4fb2495a1a08e5_ntujkm.png",
                "https://res.cloudinary.com/dzqns7kss/image/upload/v1773436154/3e0b81c3a4959bed93bb361e4740b370_fkby8p.png",
                "https://res.cloudinary.com/dzqns7kss/image/upload/v1773436152/d40753570a582bb5a028caf79fab71cb_gle3gv.png",
                "https://res.cloudinary.com/dzqns7kss/image/upload/v1773436152/3f02d839c7403fd8f05c946ed73ae4f6_oipklg.png",
                "https://res.cloudinary.com/dzqns7kss/image/upload/v1773436151/3db386aa7867d2e71385119e3dc74a00_ojrpny.png",
              ].map((src, i) => (
                <Image key={i} src={src} alt="" width={36} height={36} className="object-contain" style={{ filter: "drop-shadow(0 0 6px rgba(255,255,255,0.6))" }} />
              ))}
            </div>

            <div className={`tg-hero-footer fade-in delay-5 ${visible ? "visible" : ""}`}>
              <span>SUPERPODER EN TUS GAFAS</span>
              <span className="tg-dot-sep">✳</span>
              <span>SUPERFLUIDEZ EN TU VIDA</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Info */}
        <div className="tg-info-section">
          {/* Header */}
          <div className={`tg-info-header fade-in delay-1 ${visible ? "visible" : ""}`}>
            <div className="tg-gens-header-logo">
              <Image
                src="https://res.cloudinary.com/dzqns7kss/image/upload/v1773435520/imgi_1_genslogo_vsxgk4.png"
                alt="Transitions® GEN S"
                width={180}
                height={56}
                className="object-contain"
              />
            </div>
            <div className="tg-lentes-title"><span style={{fontWeight: 400}}>LENTES</span> ULTRA DINÁMICOS</div>
            <div className="tg-lentes-subtitle">
              <span>SUPERPODER EN TUS GAFAS</span>
              <span className="tg-sep">✳</span>
              <span>SUPERFLUIDEZ EN TU VIDA</span>
            </div>
          </div>

          {/* Description */}
          <p className={`tg-description fade-in delay-2 ${visible ? "visible" : ""}`}>
            <em>Transitions® GEN S™</em> son nuestros lentes perfectos para todos los días.
            Responden ultra-rápido a la luz, ofrecen una espectacular paleta de colores y te
            dan visión HD al ritmo de tu vida.
          </p>

          {/* Features */}
          <div className={`tg-features-grid fade-in delay-3 ${visible ? "visible" : ""}`}>
            {features.map((f, i) => (
              <div className="tg-feature-item" key={i}>
                <div className="tg-feature-icon">
                  <Image src={f.icon} alt={f.label} width={56} height={56} className="object-contain" />
                </div>
                <div className={`tg-feature-divider ${i % 2 === 0 ? "orange" : "blue"}`} />
                <div className="tg-feature-label">{f.label}</div>
              </div>
            ))}
          </div>

          {/* Footnotes */}
          <div className={`tg-footnotes fade-in delay-5 ${visible ? "visible" : ""}`}>
            <p className="tg-footnote">
              ¹ Para lentes de policarbonato y CR39 en todos los colores que logran una transmisión del 18% a 23°C.
            </p>
            <p className="tg-footnote">
              ² Para lentes de policarbonato y CR39 en todos los colores. La luz azul-violeta se encuentra entre 400 y 455 nm (ISO TR 20772:2018).
            </p>
          </div>
        </div>
      </div>

      {/* Colors — full bleed */}
      <div className={`tg-colors-fullwidth fade-in delay-4 ${visible ? "visible" : ""}`}>
        <video
          ref={colorsVideoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="https://res.cloudinary.com/dzqns7kss/video/upload/so_0,f_jpg,q_80,w_720/v1773437207/8-colors-720_on4mcc.jpg"
          className="tg-colors-fullwidth-video"
        >
          <source src="https://res.cloudinary.com/dzqns7kss/video/upload/f_mp4,q_auto,vc_h264/v1773437207/8-colors-720_on4mcc.mp4" type="video/mp4" />
          <source src="https://res.cloudinary.com/dzqns7kss/video/upload/f_webm,q_auto/v1773437207/8-colors-720_on4mcc.webm" type="video/webm" />
        </video>
        <div className="tg-colors-overlay" />

        <div className="tg-colors-fullwidth-title">
          <strong>8 EXCLUSIVOS</strong> colores
        </div>

        <div className="tg-colors-bottom">
          <div className="tg-colors-dots-row">
            {colors.map((c, i) => (
              <div key={c.name} className={`tg-color-dot-wrap ${i !== activeIndex ? "tg-dot-inactive" : ""}`}>
                <div
                  className="tg-color-dot"
                  title={c.name}
                  onClick={() => seekToColor(c.videoTime)}
                >
                  <Image src={c.icon} alt={c.name} width={28} height={28} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                {c.isNew && <span className="tg-dot-new" />}
              </div>
            ))}
          </div>
          <div className="tg-active-color-name">{colors[activeIndex].name}</div>
        </div>
      </div>
    </div>
  );
}
