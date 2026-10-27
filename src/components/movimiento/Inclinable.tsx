"use client";

import { useEffect, useRef } from "react";

// Tarjeta que se inclina hacia el cursor, con un reflejo de luz que lo
// sigue. El movimiento se interpola con un resorte simple (no salta al
// píxel), y solo existe con mouse: en pantallas táctiles no hay hover.
// El transform se escribe directo en el nodo, sin estado de React, para no
// re-renderizar en cada movimiento del puntero.
export default function Inclinable({
  children,
  className = "",
  grados = 5,
}: {
  children: React.ReactNode;
  className?: string;
  grados?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reflejoRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const nodo = ref.current;
    const reflejo = reflejoRef.current;
    if (!nodo || !reflejo) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const objetivo = { x: 0, y: 0, alza: 0 };
    const actual = { x: 0, y: 0, alza: 0 };
    let cuadro = 0;

    const pintar = () => {
      actual.x += (objetivo.x - actual.x) * 0.14;
      actual.y += (objetivo.y - actual.y) * 0.14;
      actual.alza += (objetivo.alza - actual.alza) * 0.14;
      nodo.style.transform = `perspective(900px) translateY(${-6 * actual.alza}px) rotateX(${
        -actual.y * grados
      }deg) rotateY(${actual.x * grados}deg)`;
      reflejo.style.opacity = String(actual.alza * 0.9);
      reflejo.style.transform = `translate(${actual.x * 40}%, ${actual.y * 40}%)`;
      const quieto =
        Math.abs(objetivo.x - actual.x) < 0.001 &&
        Math.abs(objetivo.y - actual.y) < 0.001 &&
        Math.abs(objetivo.alza - actual.alza) < 0.001;
      cuadro = quieto ? 0 : requestAnimationFrame(pintar);
    };
    const despertar = () => {
      if (!cuadro) cuadro = requestAnimationFrame(pintar);
    };

    const alMover = (evento: PointerEvent) => {
      const caja = nodo.getBoundingClientRect();
      objetivo.x = ((evento.clientX - caja.left) / caja.width) * 2 - 1;
      objetivo.y = ((evento.clientY - caja.top) / caja.height) * 2 - 1;
      objetivo.alza = 1;
      despertar();
    };
    const alSalir = () => {
      objetivo.x = 0;
      objetivo.y = 0;
      objetivo.alza = 0;
      despertar();
    };

    nodo.addEventListener("pointermove", alMover);
    nodo.addEventListener("pointerleave", alSalir);
    return () => {
      nodo.removeEventListener("pointermove", alMover);
      nodo.removeEventListener("pointerleave", alSalir);
      cancelAnimationFrame(cuadro);
    };
  }, [grados]);

  return (
    <div ref={ref} className={`relative [transform-style:preserve-3d] ${className}`}>
      {children}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
      >
        <span
          ref={reflejoRef}
          className="absolute -inset-1/2 opacity-0 mix-blend-soft-light"
          style={{
            background:
              "radial-gradient(circle at center, rgba(255,255,255,0.75), rgba(255,255,255,0) 45%)",
          }}
        />
      </span>
    </div>
  );
}
