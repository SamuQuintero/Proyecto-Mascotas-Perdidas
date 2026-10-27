"use client";

import { useEffect, useRef } from "react";

// Número que sube desde cero cuando entra en pantalla. El servidor ya pinta
// el valor final (si el JavaScript falla, la cifra se ve igual); al
// hidratar, solo se anima si el usuario no pidió reducir el movimiento.
export default function Contador({
  valor,
  duracion = 1400,
  retraso = 0,
  className,
}: {
  valor: number;
  duracion?: number;
  retraso?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo || valor === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cuadro = 0;
    let temporizador = 0;
    nodo.textContent = "0";

    const animar = () => {
      const inicio = performance.now();
      const paso = (ahora: number) => {
        // El primer cuadro puede traer una marca de tiempo anterior a `inicio`.
        const t = Math.min(Math.max((ahora - inicio) / duracion, 0), 1);
        // Ease-out exponencial: corre al principio y se posa en la cifra.
        const avance = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        nodo.textContent = String(Math.round(avance * valor));
        if (t < 1) cuadro = requestAnimationFrame(paso);
      };
      cuadro = requestAnimationFrame(paso);
    };

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        observador.disconnect();
        temporizador = window.setTimeout(animar, retraso);
      },
      { threshold: 0.6 }
    );
    observador.observe(nodo);

    return () => {
      observador.disconnect();
      cancelAnimationFrame(cuadro);
      clearTimeout(temporizador);
      nodo.textContent = String(valor);
    };
  }, [valor, duracion, retraso]);

  return (
    <span ref={ref} className={className}>
      {valor}
    </span>
  );
}
