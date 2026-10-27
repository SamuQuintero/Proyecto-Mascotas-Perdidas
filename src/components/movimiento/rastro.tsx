// Geometría del rastro de huellas: un camino de curvas Bézier cúbicas y las
// huellas repartidas a la misma distancia a lo largo de él, alternando pie
// izquierdo y derecho y giradas en la dirección de la marcha.

export type Punto = [number, number];
export type Segmento = [Punto, Punto, Punto, Punto];

export interface PasoHuella {
  x: number;
  y: number;
  angulo: number;
}

function bezier([p0, p1, p2, p3]: Segmento, t: number): Punto {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return [
    a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
    a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
  ];
}

export function caminoSvg(segmentos: Segmento[]): string {
  const [inicio] = segmentos[0];
  return (
    `M${inicio[0]} ${inicio[1]}` +
    segmentos.map(([, c1, c2, fin]) => ` C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${fin[0]} ${fin[1]}`).join("")
  );
}

export function huellasDelRastro(
  segmentos: Segmento[],
  cantidad: number,
  separacionLateral = 6
): PasoHuella[] {
  // Muestreo fino del camino para medir su longitud real.
  const muestras: Punto[] = [];
  for (const segmento of segmentos) {
    for (let i = 0; i <= 60; i++) muestras.push(bezier(segmento, i / 60));
  }
  const acumulado = [0];
  for (let i = 1; i < muestras.length; i++) {
    const [x0, y0] = muestras[i - 1];
    const [x1, y1] = muestras[i];
    acumulado.push(acumulado[i - 1] + Math.hypot(x1 - x0, y1 - y0));
  }
  const total = acumulado[acumulado.length - 1];

  const pasos: PasoHuella[] = [];
  let j = 1;
  for (let n = 0; n < cantidad; n++) {
    const meta = (total * (n + 0.5)) / cantidad;
    while (j < acumulado.length - 1 && acumulado[j] < meta) j++;
    const [x0, y0] = muestras[j - 1];
    const [x1, y1] = muestras[j];
    const tangente = Math.atan2(y1 - y0, x1 - x0);
    const lado = n % 2 === 0 ? -1 : 1;
    pasos.push({
      x: x1 + Math.cos(tangente + Math.PI / 2) * separacionLateral * lado,
      y: y1 + Math.sin(tangente + Math.PI / 2) * separacionLateral * lado,
      // La huella dibujada apunta hacia arriba (-y): se gira 90° extra.
      angulo: (tangente * 180) / Math.PI + 90,
    });
  }
  return pasos;
}

// Huella de pata dibujada alrededor de (0, 0), con los dedos hacia arriba.
export function FormaHuella({ className }: { className?: string }) {
  return (
    <g className={className}>
      <path d="M0 -0.6c3.6 0 6.6 2.9 6.6 6 0 2.4-1.9 3.6-3.6 3.6-1.3 0-2-.8-3-.8s-1.7.8-3 .8c-1.7 0-3.6-1.2-3.6-3.6 0-3.1 3-6 6.6-6z" />
      <ellipse cx="-6.3" cy="-3.4" rx="2.1" ry="2.7" transform="rotate(-24 -6.3 -3.4)" />
      <ellipse cx="-2.3" cy="-7.4" rx="2.1" ry="2.8" transform="rotate(-8 -2.3 -7.4)" />
      <ellipse cx="2.3" cy="-7.4" rx="2.1" ry="2.8" transform="rotate(8 2.3 -7.4)" />
      <ellipse cx="6.3" cy="-3.4" rx="2.1" ry="2.7" transform="rotate(24 6.3 -3.4)" />
    </g>
  );
}
