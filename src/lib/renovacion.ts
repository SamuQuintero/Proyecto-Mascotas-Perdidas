// HU-19: mientras una mascota no aparece, el reporte se vuelve a difundir
// cuando su dueño confirma que el caso sigue abierto. Renovar sube el
// reporte en el listado y vuelve a avisar a quienes están suscritos a su
// zona (HU-16). Funciones puras, sin base de datos (ver renovacion.test.ts).

import type { EstadoReporte, TipoReporte } from "@/lib/tipos";

// Pasados estos días sin renovar, se le recuerda al dueño confirmar.
export const DIAS_ENTRE_RECORDATORIOS = 7;
// Para no inundar de avisos, no se puede renovar de nuevo antes de un día.
export const HORAS_MINIMAS_ENTRE_RENOVACIONES = 24;

const HORA_MS = 60 * 60 * 1000;
const DIA_MS = 24 * HORA_MS;

interface ReporteRenovable {
  tipo: TipoReporte;
  estado: EstadoReporte;
  renovadoEn: Date | string;
}

export function diasSinRenovar(renovadoEn: Date | string, ahora = new Date()): number {
  return Math.max(0, Math.floor((ahora.getTime() - new Date(renovadoEn).getTime()) / DIA_MS));
}

// ¿Toca preguntarle al dueño si su mascota sigue perdida?
export function necesitaRecordatorio(reporte: ReporteRenovable, ahora = new Date()): boolean {
  return (
    reporte.tipo === "PERDIDA" &&
    reporte.estado === "ACTIVO" &&
    diasSinRenovar(reporte.renovadoEn, ahora) >= DIAS_ENTRE_RECORDATORIOS
  );
}

// ¿Se puede renovar ahora? Solo los casos abiertos, y no más de una vez al día.
export function puedeRenovar(reporte: ReporteRenovable, ahora = new Date()): boolean {
  if (reporte.estado !== "ACTIVO") return false;
  return (
    ahora.getTime() - new Date(reporte.renovadoEn).getTime() >=
    HORAS_MINIMAS_ENTRE_RENOVACIONES * HORA_MS
  );
}

// Un reporte "renovado" es el que se volvió a difundir al menos una vez.
export function fueRenovado(reporte: { renovaciones: number }): boolean {
  return reporte.renovaciones > 0;
}
