"use client";

import { useEffect, useRef } from "react";

// Envuelve ilustraciones con animaciones en bucle y las congela cuando salen
// de la pantalla o la pestaña está oculta (la regla CSS vive en globals.css,
// [data-fuera-de-vista]). Así un hero animado no gasta batería mientras la
// persona lee el resto de la página.
export default function PausaFueraDeVista({
  children,
  className,
  as: Etiqueta = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "footer";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo) return;
    let visible = true;
    const actualizar = () =>
      nodo.setAttribute(
        "data-fuera-de-vista",
        String(!visible || document.visibilityState === "hidden")
      );
    const observador = new IntersectionObserver(([entrada]) => {
      visible = entrada.isIntersecting;
      actualizar();
    });
    observador.observe(nodo);
    document.addEventListener("visibilitychange", actualizar);
    return () => {
      observador.disconnect();
      document.removeEventListener("visibilitychange", actualizar);
    };
  }, []);

  return (
    <Etiqueta ref={ref as React.Ref<HTMLDivElement>} className={className}>
      {children}
    </Etiqueta>
  );
}
