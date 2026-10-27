// HU-20 ↔ HU-4: un animal que un refugio tiene en resguardo puede ser una
// mascota que alguien reportó perdida. Se compara por características
// (especie, color, tamaño), como el perfil con QR de HU-10, y solo contra
// pérdidas anteriores a su ingreso (con un día de margen).

import { criterioColor, criterioEspecie, criterioTamano } from "./criterios";
import type { AnimalResguardoComparable, ReporteComparable } from "./perfiles";
import { puntuar, type Criterio } from "./puntuacion";
import { TOLERANCIA_FECHA_MS, especiesCompatibles } from "./reglas";

export const PUNTAJE_MINIMO_COINCIDENCIA_RESGUARDO = 55;

export interface AlertaResguardo<A extends AnimalResguardoComparable = AnimalResguardoComparable> {
  animal: A;
  puntaje: number;
  razones: string[];
}

// Los animales de refugio no registran señas de gato: sin criterio felino.
const CRITERIOS: readonly Criterio<ReporteComparable, AnimalResguardoComparable>[] = [
  criterioEspecie(35),
  criterioColor(40, { obligatorio: true }),
  criterioTamano(25, 8),
];

export function compararResguardoConPerdida<A extends AnimalResguardoComparable>(
  animal: A,
  reporte: ReporteComparable
): AlertaResguardo<A> | null {
  if (reporte.tipo !== "PERDIDA") return null;
  if (!especiesCompatibles(animal.especie, reporte.especie)) return null;
  if (new Date(animal.desde).getTime() < new Date(reporte.fecha).getTime() - TOLERANCIA_FECHA_MS) {
    return null;
  }

  // El "otro lado" de la comparación es el animal: así las razones nombran
  // su color, como en el resto de las alertas.
  const puntuacion = puntuar(CRITERIOS, reporte, animal);
  if (!puntuacion || puntuacion.puntaje < PUNTAJE_MINIMO_COINCIDENCIA_RESGUARDO) return null;

  return { animal, puntaje: puntuacion.puntaje, razones: puntuacion.razones };
}

export function calcularAlertasResguardo<A extends AnimalResguardoComparable>(
  reporte: ReporteComparable,
  animales: A[]
): AlertaResguardo<A>[] {
  return animales
    .map((animal) => compararResguardoConPerdida(animal, reporte))
    .filter((a): a is AlertaResguardo<A> => a !== null)
    .sort((a, b) => b.puntaje - a.puntaje);
}
