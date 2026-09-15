"use client";

import { useEffect, useRef } from "react";

interface Particula {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  o: number;
  naranja: boolean;
}

/** Embers subiendo lentamente en canvas — la "vida" de fondo del embudo. */
function CampoDeParticulas({ densidad = 32 }: { densidad?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ancho = 0;
    let alto = 0;
    let particulas: Particula[] = [];
    let raf = 0;
    let visible = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function redimensionar() {
      if (!canvas) return;
      ancho = canvas.clientWidth;
      alto = canvas.clientHeight;
      canvas.width = ancho * dpr;
      canvas.height = alto * dpr;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function crearParticulas(n: number) {
      particulas = Array.from({ length: n }, () => ({
        x: Math.random() * ancho,
        y: Math.random() * alto,
        r: Math.random() * 1.6 + 0.5,
        vy: -(Math.random() * 0.3 + 0.08),
        vx: (Math.random() - 0.5) * 0.15,
        o: Math.random() * 0.5 + 0.15,
        naranja: Math.random() < 0.28,
      }));
    }

    function tick() {
      raf = requestAnimationFrame(tick);
      if (!visible || !ctx) return;
      ctx.clearRect(0, 0, ancho, alto);
      for (const p of particulas) {
        p.y += p.vy;
        p.x += p.vx;
        if (p.y < -10) {
          p.y = alto + 10;
          p.x = Math.random() * ancho;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.naranja
          ? `rgba(29, 168, 152, ${p.o})`
          : `rgba(255, 255, 255, ${p.o * 0.55})`;
        ctx.fill();
      }
    }

    redimensionar();
    crearParticulas(densidad);
    tick();

    const alRedimensionar = () => {
      redimensionar();
      crearParticulas(densidad);
    };
    const alCambiarVisibilidad = () => {
      visible = document.visibilityState === "visible";
    };

    window.addEventListener("resize", alRedimensionar);
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", alRedimensionar);
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
    };
  }, [densidad]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

function GlowsAmbiente() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="ambient-blob"
        style={{
          width: 420,
          height: 420,
          top: -140,
          left: -120,
          background: "radial-gradient(circle, rgba(29, 168, 152,0.38), transparent 70%)",
          animationDuration: "22s",
        }}
      />
      <div
        className="ambient-blob"
        style={{
          width: 380,
          height: 380,
          bottom: -160,
          right: -100,
          background: "radial-gradient(circle, rgba(34,49,74,0.6), transparent 70%)",
          animationDuration: "27s",
          animationDelay: "-9s",
        }}
      />
      <div
        className="ambient-blob"
        style={{
          width: 280,
          height: 280,
          top: "38%",
          right: "-8%",
          background: "radial-gradient(circle, rgba(29, 168, 152,0.2), transparent 70%)",
          animationDuration: "30s",
          animationDelay: "-4s",
        }}
      />
    </div>
  );
}

interface BrandBackdropProps {
  children: React.ReactNode;
  as?: "main" | "div";
  outerClassName?: string;
  innerClassName?: string;
}

/** Envoltorio visual del embudo: fondo navy + grid + glows + partículas. */
export function BrandBackdrop({
  children,
  as = "main",
  outerClassName = "",
  innerClassName = "",
}: BrandBackdropProps) {
  const Tag = as;
  return (
    <Tag className={`brand-shell font-body-brand relative isolate overflow-hidden ${outerClassName}`}>
      <div className="brand-grid-overlay pointer-events-none absolute inset-0" aria-hidden="true" />
      <GlowsAmbiente />
      <CampoDeParticulas />
      <div className={`relative z-10 ${innerClassName}`}>{children}</div>
    </Tag>
  );
}
