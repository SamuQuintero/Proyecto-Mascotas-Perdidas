// Reglas de elegibilidad compartidas: se aplican ANTES de puntuar, para
// descartar pares que no pueden ser la misma mascota.

// Un hallazgo puede reportarse con hora aproximada, así que se acepta hasta
// un día de diferencia antes de descartarlo por fecha.
export const TOLERANCIA_FECHA_MS = 24 * 60 * 60 * 1000;

// "Otro" es un comodín compatible con cualquier especie.
export function especiesCompatibles(a: string, b: string): boolean {
  return a === b || a === "Otro" || b === "Otro";
}
