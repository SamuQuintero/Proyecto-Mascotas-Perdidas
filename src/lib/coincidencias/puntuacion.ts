// Motor de puntuación: principio abierto/cerrado (la "O" de SOLID).
//
// Antes, cada comparación (reporte↔reporte, mascota↔hallazgo,
// resguardo↔pérdida) repetía su propio bloque de "suma puntos por especie,
// por color, por tamaño…", con pesos distintos. Agregar un criterio nuevo
// obligaba a tocar las tres funciones.
//
// Ahora un CRITERIO es un objeto pequeño que sabe puntuar UNA característica,
// y el MOTOR solo suma lo que cada criterio aporta. Para sumar una
// característica nueva (p. ej. "edad aproximada") se escribe un criterio y se
// agrega a la lista de la comparación que lo necesite: el motor y las demás
// comparaciones no se modifican. Los pesos de cada comparación son datos
// (la lista de criterios y sus números), no código repetido.

export interface Aporte {
  puntos: number;
  razones?: string[];
  // El criterio "se cumplió" (p. ej. hay un color en común). La comparación
  // puede exigir ciertos criterios cumplidos además del puntaje.
  cumple?: boolean;
  // Descarta la comparación entera (p. ej. sin color en común no puede ser
  // la misma mascota).
  descarta?: boolean;
}

export interface Criterio<A, B> {
  nombre: string;
  // Declarado como método (no propiedad) para que un criterio escrito para
  // un tipo pequeño (p. ej. PerfilFisico) sirva en listas de tipos mayores
  // (p. ej. ReporteComparable): sustitución de Liskov.
  evaluar(a: A, b: B): Aporte;
}

export interface Puntuacion {
  puntaje: number; // 0–100
  razones: string[];
  cumplidos: ReadonlySet<string>;
}

export function puntuar<A, B>(
  criterios: readonly Criterio<A, B>[],
  a: A,
  b: B
): Puntuacion | null {
  let suma = 0;
  const razones: string[] = [];
  const cumplidos = new Set<string>();

  for (const criterio of criterios) {
    const aporte = criterio.evaluar(a, b);
    if (aporte.descarta) return null;
    suma += aporte.puntos;
    if (aporte.razones) razones.push(...aporte.razones);
    if (aporte.cumple) cumplidos.add(criterio.nombre);
  }

  return { puntaje: Math.max(0, Math.min(100, suma)), razones, cumplidos };
}
