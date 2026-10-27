// HU-4 (coincidencias por características) y HU-7 (hallazgos cerca de donde
// se perdió la mascota). Funciones puras: reciben un reporte y los reportes
// del tipo contrario, y devuelven las alertas. No consultan la base de
// datos, así se pueden probar sin ella (ver coincidencias.test.ts).
//
// Funciona en ambos sentidos: para una mascota perdida busca hallazgos, y
// para un hallazgo busca mascotas perdidas.

import {
  criterioColor,
  criterioDistancia,
  criterioEspecie,
  criterioFelino,
  criterioTamano,
} from "./criterios";
import { RADIO_CERCANIA_KM, distanciaKm, formatearDistancia } from "./geo";
import type { ReporteComparable } from "./perfiles";
import { puntuar, type Criterio } from "./puntuacion";
import { TOLERANCIA_FECHA_MS, especiesCompatibles } from "./reglas";

export interface Alerta<R extends ReporteComparable = ReporteComparable> {
  reporte: R; // el otro reporte (el hallazgo, si la base es una pérdida)
  distanciaKm: number;
  puntaje: number; // 0–100, parecido por características
  // HU-4: sus características coinciden (especie, color, tamaño…).
  esCoincidencia: boolean;
  // HU-7: se reportó cerca de donde se perdió / se encontró.
  esCercano: boolean;
  razones: string[];
}

export const PUNTAJE_MINIMO_COINCIDENCIA = 60;

// Pesos de esta comparación (suman 100 con todo coincidiendo). Para agregar
// o reponderar una característica se edita esta lista, no la función.
const CRITERIOS: readonly Criterio<ReporteComparable, ReporteComparable>[] = [
  criterioEspecie(30),
  criterioColor(35),
  criterioTamano(20, 5),
  criterioDistancia,
  criterioFelino,
];

// ¿Pueden ser la misma mascota por fechas? Un hallazgo muy anterior a la
// pérdida no puede ser esa mascota.
function fechasCompatibles(base: ReporteComparable, otro: ReporteComparable) {
  const perdida = base.tipo === "PERDIDA" ? base : otro;
  const hallazgo = base.tipo === "PERDIDA" ? otro : base;
  return (
    new Date(hallazgo.fecha).getTime() >=
    new Date(perdida.fecha).getTime() - TOLERANCIA_FECHA_MS
  );
}

export function compararReportes<R extends ReporteComparable>(
  base: ReporteComparable,
  otro: R
): Alerta<R> | null {
  if (base.tipo === otro.tipo || base.id === otro.id) return null;
  if (!especiesCompatibles(base.especie, otro.especie)) return null;
  if (!fechasCompatibles(base, otro)) return null;

  const puntuacion = puntuar(CRITERIOS, base, otro);
  if (!puntuacion) return null;

  const distancia = distanciaKm(base, otro);
  const esCercano = distancia <= RADIO_CERCANIA_KM;
  const razones = [...puntuacion.razones];
  if (esCercano) {
    razones.push(
      distancia < 0.1
        ? "En el mismo lugar"
        : `A ${formatearDistancia(distancia)} de ${
            base.tipo === "PERDIDA" ? "donde se perdió" : "donde se encontró"
          }`
    );
  }

  // Sin un color en común no se considera la misma mascota, aunque
  // coincidan especie y tamaño (un perro blanco no es un perro negro).
  const esCoincidencia =
    puntuacion.cumplidos.has("color") && puntuacion.puntaje >= PUNTAJE_MINIMO_COINCIDENCIA;

  if (!esCoincidencia && !esCercano) return null;
  return {
    reporte: otro,
    distanciaKm: distancia,
    puntaje: puntuacion.puntaje,
    esCoincidencia,
    esCercano,
    razones,
  };
}

// Alertas de un reporte: primero las coincidencias más parecidas, luego los
// reportes cercanos que no se parecen tanto, ordenados por distancia.
export function calcularAlertas<R extends ReporteComparable>(
  base: ReporteComparable,
  candidatos: R[]
): Alerta<R>[] {
  return candidatos
    .map((candidato) => compararReportes(base, candidato))
    .filter((alerta): alerta is Alerta<R> => alerta !== null)
    .sort((a, b) => {
      if (a.esCoincidencia !== b.esCoincidencia) return a.esCoincidencia ? -1 : 1;
      if (a.esCoincidencia) return b.puntaje - a.puntaje || a.distanciaKm - b.distanciaKm;
      return a.distanciaKm - b.distanciaKm;
    });
}
