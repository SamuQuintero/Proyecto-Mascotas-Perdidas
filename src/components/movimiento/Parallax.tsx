"use client";

import { useEffect, useRef } from "react";

// Escena con profundidad: cada hijo marcado con data-profundidad="n" se
// desplaza n píxeles hacia el cursor (los más "cercanos" se mueven más).
// Se interpola con un resorte para que la escena tenga inercia.
export default function Parallax({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const capas = Array.from(nodo.querySelectorAll<HTMLElement>("[data-profundidad]")).map(
      (capa) => ({ capa, profundidad: Number(capa.dataset.profundidad) || 0 })
    );
    const objetivo = { x: 0, y: 0 };
    const actual = { x: 0, y: 0 };
    let cuadro = 0;

    const pintar = () => {
      actual.x += (objetivo.x - actual.x) * 0.08;
      actual.y += (objetivo.y - actual.y) * 0.08;
      for (const { capa, profundidad } of capas) {
        capa.style.transform = `translate3d(${actual.x * profundidad}px, ${
          actual.y * profundidad
        }px, 0)`;
      }
      const quieto =
        Math.abs(objetivo.x - actual.x) < 0.0005 && Math.abs(objetivo.y - actual.y) < 0.0005;
      cuadro = quieto ? 0 : requestAnimationFrame(pintar);
    };

    // Se escucha en toda la ventana: la escena reacciona aunque el cursor
    // esté sobre el titular, no solo encima de la ilustración.
    const alMover = (evento: PointerEvent) => {
      objetivo.x = (evento.clientX / window.innerWidth) * 2 - 1;
      objetivo.y = (evento.clientY / window.innerHeight) * 2 - 1;
      if (!cuadro) cuadro = requestAnimationFrame(pintar);
    };

    window.addEventListener("pointermove", alMover, { passive: true });
    return () => {
      window.removeEventListener("pointermove", alMover);
      cancelAnimationFrame(cuadro);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
