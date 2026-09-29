// HU-4 (coincidencias por características) y HU-7 (hallazgos cerca de donde
// se perdió la mascota). Funciones puras: reciben un reporte y los reportes
// del tipo contrario, y devuelven las alertas. No consultan la base de
// datos, así se pueden probar sin ella (ver coincidencias.test.ts).
//
// Funciona en ambos sentidos: para una mascota perdida busca hallazgos, y
// para un hallazgo busca mascotas perdidas.

import { normalizarTexto } from "@/lib/texto";
import type { Tamano, TipoReporte } from "@/lib/tipos";

export interface ReporteComparable {
  id: string;
  tipo: TipoReporte;
  especie: string;
  color: string;
  tamano: Tamano;
  latitud: number;
  longitud: number;
  fecha: Date | string;
}

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

// HU-7: radio en el que un hallazgo se considera "cerca" de donde se perdió
// la mascota. 2 km cubre varios barrios de Pasto sin volverse ruido.
export const RADIO_CERCANIA_KM = 2;
export const PUNTAJE_MINIMO_COINCIDENCIA = 60;
// Un hallazgo puede reportarse con hora aproximada, así que se acepta hasta
// un día de diferencia antes de descartarlo por fecha.
const TOLERANCIA_FECHA_MS = 24 * 60 * 60 * 1000;

// Distancia en kilómetros entre dos coordenadas (fórmula del haversine).
export function distanciaKm(
  a: { latitud: number; longitud: number },
  b: { latitud: number; longitud: number }
): number {
  const R = 6371;
  const rad = (grados: number) => (grados * Math.PI) / 180;
  const dLat = rad(b.latitud - a.latitud);
  const dLng = rad(b.longitud - a.longitud);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitud)) * Math.cos(rad(b.latitud)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Familias de colores: quien reporta escribe el color libremente ("café",
// "marrón", "chocolate"…), así que se agrupan palabras equivalentes. Cada
// entrada es el inicio de la palabra, para cubrir plural y femenino.
const FAMILIAS_COLOR: Record<string, string[]> = {
  negro: ["negr", "oscur", "azabache"],
  blanco: ["blanc", "hues", "niev"],
  gris: ["gris", "plat", "plom", "azul", "ceniz"],
  cafe: ["caf", "marr", "chocol", "castan", "canel", "cafe"],
  dorado: ["dorad", "amarill", "crem", "beig", "rubi", "miel", "caramel", "mostaz"],
  naranja: ["naranj", "anaranj", "rojiz", "roj", "cobriz", "pelirroj"],
  atigrado: ["atigr", "ray", "tabby", "barcin"],
  manchado: ["manch", "pint", "tricol", "calic", "carey", "moteado", "dalmat", "bicol"],
};

const PALABRAS_IGNORADAS = new Set(["con", "y", "de", "el", "la", "muy", "claro", "oscuro"]);

export function familiasDeColor(color: string): Set<string> {
  const palabras = normalizarTexto(color)
    .split(/[^a-z]+/)
    .filter((p) => p.length > 1 && !PALABRAS_IGNORADAS.has(p));

  const familias = new Set<string>();
  for (const palabra of palabras) {
    const familia = Object.entries(FAMILIAS_COLOR).find(([, raices]) =>
      raices.some((raiz) => palabra.startsWith(raiz))
    )?.[0];
    familias.add(familia ?? palabra);
  }
  return familias;
}

const ORDEN_TAMANO: Record<Tamano, number> = { PEQUENO: 0, MEDIANO: 1, GRANDE: 2 };

function especiesCompatibles(a: string, b: string) {
  return a === b || a === "Otro" || b === "Otro";
}

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

  const razones: string[] = [];
  let puntaje = 0;

  if (base.especie === otro.especie && base.especie !== "Otro") {
    puntaje += 30;
    razones.push(`Misma especie (${base.especie.toLowerCase()})`);
  }

  const coloresBase = familiasDeColor(base.color);
  const coloresOtro = familiasDeColor(otro.color);
  const comunes = Array.from(coloresBase).filter((c) => coloresOtro.has(c));
  if (comunes.length > 0) {
    const menor = Math.min(coloresBase.size, coloresOtro.size);
    puntaje += Math.round(35 * (comunes.length / menor));
    razones.push(`Color parecido (${otro.color.toLowerCase()})`);
  }

  const diferenciaTamano = Math.abs(ORDEN_TAMANO[base.tamano] - ORDEN_TAMANO[otro.tamano]);
  if (diferenciaTamano === 0) {
    puntaje += 20;
    razones.push("Mismo tamaño");
  } else if (diferenciaTamano === 1) {
    puntaje += 5;
  }

  const distancia = distanciaKm(base, otro);
  if (distancia <= 1) puntaje += 15;
  else if (distancia <= RADIO_CERCANIA_KM) puntaje += 10;
  else if (distancia <= 10) puntaje += 5;

  const esCercano = distancia <= RADIO_CERCANIA_KM;
  if (esCercano) {
    razones.push(
      distancia < 0.1
        ? "En el mismo lugar"
        : `A ${formatearDistancia(distancia)} de ${
            base.tipo === "PERDIDA" ? "donde se perdió" : "donde se encontró"
          }`
    );
  }

  puntaje = Math.min(100, puntaje);
  // Sin un color en común no se considera la misma mascota, aunque
  // coincidan especie y tamaño (un perro blanco no es un perro negro).
  const esCoincidencia = comunes.length > 0 && puntaje >= PUNTAJE_MINIMO_COINCIDENCIA;

  if (!esCoincidencia && !esCercano) return null;
  return { reporte: otro, distanciaKm: distancia, puntaje, esCoincidencia, esCercano, razones };
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

export function formatearDistancia(km: number): string {
  if (km < 1) return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`;
  return `${km.toFixed(1).replace(".", ",")} km`;
}
