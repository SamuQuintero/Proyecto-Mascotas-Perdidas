// Criterios de puntuación reutilizables (ver puntuacion.ts). Cada fábrica
// recibe el peso que tiene ese criterio en la comparación que lo usa.

import { ajusteFelino } from "@/lib/felinos";
import type { Tamano } from "@/lib/tipos";
import { coloresEnComun } from "./colores";
import { RADIO_CERCANIA_KM, distanciaKm } from "./geo";
import type { Geolocalizable, PerfilFisico, SenasFelinasComparables } from "./perfiles";
import type { Criterio } from "./puntuacion";

const ORDEN_TAMANO: Record<Tamano, number> = { PEQUENO: 0, MEDIANO: 1, GRANDE: 2 };

// Misma especie (y no "Otro", que es un comodín compatible con todo).
export function criterioEspecie(peso: number): Criterio<PerfilFisico, PerfilFisico> {
  return {
    nombre: "especie",
    evaluar: (a, b) =>
      a.especie === b.especie && a.especie !== "Otro"
        ? { puntos: peso, razones: [`Misma especie (${a.especie.toLowerCase()})`], cumple: true }
        : { puntos: 0 },
  };
}

// Colores en común, por familias ("café" = "marrón"). Con `obligatorio`, sin
// ningún color en común la comparación se descarta.
export function criterioColor(
  peso: number,
  { obligatorio = false }: { obligatorio?: boolean } = {}
): Criterio<PerfilFisico, PerfilFisico> {
  return {
    nombre: "color",
    evaluar: (a, b) => {
      const { comunes, menor } = coloresEnComun(a.color, b.color);
      if (comunes.length === 0) return obligatorio ? { puntos: 0, descarta: true } : { puntos: 0 };
      return {
        puntos: Math.round(peso * (comunes.length / menor)),
        razones: [`Color parecido (${b.color.toLowerCase()})`],
        cumple: true,
      };
    },
  };
}

// Mismo tamaño suma `pesoIgual`; un escalón de diferencia, `pesoVecino`.
export function criterioTamano(
  pesoIgual: number,
  pesoVecino: number
): Criterio<PerfilFisico, PerfilFisico> {
  return {
    nombre: "tamano",
    evaluar: (a, b) => {
      const diferencia = Math.abs(ORDEN_TAMANO[a.tamano] - ORDEN_TAMANO[b.tamano]);
      if (diferencia === 0) return { puntos: pesoIgual, razones: ["Mismo tamaño"] };
      if (diferencia === 1) return { puntos: pesoVecino };
      return { puntos: 0 };
    },
  };
}

// Cercanía entre dos ubicaciones: ≤ 1 km, ≤ radio de cercanía, ≤ 10 km.
export const criterioDistancia: Criterio<Geolocalizable, Geolocalizable> = {
  nombre: "distancia",
  evaluar: (a, b) => {
    const km = distanciaKm(a, b);
    if (km <= 1) return { puntos: 15 };
    if (km <= RADIO_CERCANIA_KM) return { puntos: 10 };
    if (km <= 10) return { puntos: 5 };
    return { puntos: 0 };
  },
};

// HU-24: señas propias de los gatos (solo aplica si ambos lados son gatos).
export const criterioFelino: Criterio<
  PerfilFisico & SenasFelinasComparables,
  PerfilFisico & SenasFelinasComparables
> = {
  nombre: "felino",
  evaluar: (a, b) => {
    const { puntos, razones } = ajusteFelino(a, b);
    return { puntos, razones };
  },
};
