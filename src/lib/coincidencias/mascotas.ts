// HU-10: alerta al dueño cuando se publica un hallazgo con las mismas
// características que una mascota suya con perfil QR (HU-8) — aunque esa
// mascota todavía no esté reportada como perdida. Es la misma idea de HU-4
// (comparar características), pero aplicada a un perfil en vez de a un
// reporte propio: no tiene ubicación ni fecha con qué comparar, solo
// especie, color y tamaño (y señas, si es gato).

import { criterioColor, criterioEspecie, criterioFelino, criterioTamano } from "./criterios";
import type { MascotaComparable, ReporteComparable } from "./perfiles";
import { puntuar, type Criterio } from "./puntuacion";
import { especiesCompatibles } from "./reglas";

export const PUNTAJE_MINIMO_COINCIDENCIA_MASCOTA = 55;

export interface AlertaMascota<R extends ReporteComparable = ReporteComparable> {
  reporte: R;
  puntaje: number;
  razones: string[];
}

// Sin color en común no es la misma mascota (criterio obligatorio).
const CRITERIOS: readonly Criterio<MascotaComparable, ReporteComparable>[] = [
  criterioEspecie(35),
  criterioColor(40, { obligatorio: true }),
  criterioTamano(25, 8),
  criterioFelino,
];

export function compararMascotaConReporte<R extends ReporteComparable>(
  mascota: MascotaComparable,
  reporte: R
): AlertaMascota<R> | null {
  // Solo interesan los hallazgos: es ahí donde "alguien reportó las mismas
  // características que tiene mi mascota" tiene sentido accionable.
  if (reporte.tipo !== "ENCONTRADA") return null;
  if (!especiesCompatibles(mascota.especie, reporte.especie)) return null;

  const puntuacion = puntuar(CRITERIOS, mascota, reporte);
  if (!puntuacion || puntuacion.puntaje < PUNTAJE_MINIMO_COINCIDENCIA_MASCOTA) return null;

  return { reporte, puntaje: puntuacion.puntaje, razones: puntuacion.razones };
}

export function calcularAlertasMascota<R extends ReporteComparable>(
  mascota: MascotaComparable,
  candidatos: R[]
): AlertaMascota<R>[] {
  return candidatos
    .map((candidato) => compararMascotaConReporte(mascota, candidato))
    .filter((a): a is AlertaMascota<R> => a !== null)
    .sort((a, b) => b.puntaje - a.puntaje);
}
