// HU-15: advertir reportes posiblemente duplicados del mismo tipo (p. ej.
// dos integrantes de una misma familia publicando por separado la pérdida
// de la misma mascota). A diferencia de compararReportes (que cruza
// PERDIDA↔ENCONTRADA), aquí se comparan reportes del MISMO tipo, con un
// radio y una ventana de fecha mucho más estrictos: no es "¿puede ser la
// misma mascota en otro reporte?", sino "¿es, casi con certeza, la misma
// publicación repetida?". No usa puntajes: es una decisión sí/no, así que
// no pasa por el motor de puntuación.

import { coloresEnComun } from "./colores";
import { distanciaKm, formatearDistancia } from "./geo";
import type { ReporteComparable } from "./perfiles";
import { especiesCompatibles } from "./reglas";

export const RADIO_DUPLICADO_KM = 1;
const VENTANA_DUPLICADO_MS = 5 * 24 * 60 * 60 * 1000; // 5 días
const DIA_MS = 24 * 60 * 60 * 1000;

export interface PosibleDuplicado<R extends ReporteComparable = ReporteComparable> {
  reporte: R;
  distanciaKm: number;
  razones: string[];
}

export function compararDuplicados<R extends ReporteComparable>(
  base: ReporteComparable,
  otro: R
): PosibleDuplicado<R> | null {
  if (base.tipo !== otro.tipo || base.id === otro.id) return null;
  if (!especiesCompatibles(base.especie, otro.especie)) return null;

  const diferenciaFecha = Math.abs(
    new Date(base.fecha).getTime() - new Date(otro.fecha).getTime()
  );
  if (diferenciaFecha > VENTANA_DUPLICADO_MS) return null;

  if (coloresEnComun(base.color, otro.color).comunes.length === 0) return null;

  const distancia = distanciaKm(base, otro);
  if (distancia > RADIO_DUPLICADO_KM) return null;

  const razones = [
    base.especie === otro.especie ? `Misma especie (${base.especie.toLowerCase()})` : null,
    `Color parecido (${otro.color.toLowerCase()})`,
    distancia < 0.1 ? "En el mismo lugar" : `A ${formatearDistancia(distancia)} de distancia`,
    diferenciaFecha < DIA_MS
      ? "El mismo día"
      : `Con ${Math.round(diferenciaFecha / DIA_MS)} días de diferencia`,
  ].filter((r): r is string => r !== null);

  return { reporte: otro, distanciaKm: distancia, razones };
}

export function calcularDuplicados<R extends ReporteComparable>(
  base: ReporteComparable,
  candidatos: R[]
): PosibleDuplicado<R>[] {
  return candidatos
    .map((candidato) => compararDuplicados(base, candidato))
    .filter((d): d is PosibleDuplicado<R> => d !== null)
    .sort((a, b) => a.distanciaKm - b.distanciaKm);
}
