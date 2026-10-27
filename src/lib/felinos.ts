// HU-24: señas propias de los gatos (patrón y largo del pelaje, color de
// ojos, si es de interior). En gatos las búsquedas fallan más: "gris" o
// "atigrado" describen a miles, y el tamaño casi no distingue. Estas señas
// afinan la coincidencia (HU-4, HU-10) cuando AMBOS lados son gatos y las
// registraron. Funciones puras, sin base de datos (ver felinos.test.ts).

import { normalizarTexto } from "@/lib/texto";

export const PATRONES_PELAJE = ["Sólido", "Atigrado", "Bicolor", "Tricolor", "Manchado", "Puntos"] as const;
export const LARGOS_PELAJE = ["Corto", "Medio", "Largo"] as const;
export const COLORES_OJOS = ["Verde", "Amarillo", "Azul", "Café", "Distintos entre sí"] as const;

export interface SenasFelinas {
  patronPelaje?: string | null;
  largoPelaje?: string | null;
  colorOjos?: string | null;
  esDeInterior?: boolean | null;
}

type ConEspecie = SenasFelinas & { especie: string };

// Cuánto suma coincidir y cuánto resta contradecirse en cada seña. El patrón
// y el color de ojos pesan más que el largo del pelaje, que cambia con el
// corte o la época.
const PESOS = {
  patronPelaje: { suma: 8, resta: 20, etiqueta: "patrón de pelaje" },
  largoPelaje: { suma: 4, resta: 10, etiqueta: "largo de pelaje" },
  colorOjos: { suma: 8, resta: 15, etiqueta: "color de ojos" },
} as const;

function igual(a: string, b: string) {
  return normalizarTexto(a) === normalizarTexto(b);
}

// Ajuste al puntaje de parecido entre dos gatos. Solo se comparan las señas
// que ambos lados registraron: un dato que falta no suma ni resta.
export function ajusteFelino(a: ConEspecie, b: ConEspecie): { puntos: number; razones: string[] } {
  if (a.especie !== "Gato" || b.especie !== "Gato") return { puntos: 0, razones: [] };

  let puntos = 0;
  const razones: string[] = [];
  for (const campo of ["patronPelaje", "largoPelaje", "colorOjos"] as const) {
    const x = a[campo];
    const y = b[campo];
    if (!x || !y) continue;
    const peso = PESOS[campo];
    if (igual(x, y)) {
      puntos += peso.suma;
      razones.push(`Mismo ${peso.etiqueta} (${y.toLowerCase()})`);
    } else {
      puntos -= peso.resta;
    }
  }
  return { puntos, razones };
}

// Las señas felinas solo se guardan para gatos: si se cambia la especie al
// editar, las de un gato no quedan pegadas a otro animal.
export function senasFelinasParaGuardar(datos: {
  especie: string;
  patronPelaje?: string;
  largoPelaje?: string;
  colorOjos?: string;
  esDeInterior?: string;
}) {
  const esGato = datos.especie === "Gato";
  return {
    patronPelaje: esGato ? datos.patronPelaje || null : null,
    largoPelaje: esGato ? datos.largoPelaje || null : null,
    colorOjos: esGato ? datos.colorOjos || null : null,
    esDeInterior: esGato
      ? datos.esDeInterior === "SI"
        ? true
        : datos.esDeInterior === "NO"
          ? false
          : null
      : null,
  };
}

// Para mostrar en el detalle: [["Patrón de pelaje", "Atigrado"], …]. Solo las
// señas que se registraron.
export function resumenSenasFelinas(datos: ConEspecie): [string, string][] {
  if (datos.especie !== "Gato") return [];
  const filas: [string, string | null | undefined][] = [
    ["Patrón de pelaje", datos.patronPelaje],
    ["Largo de pelaje", datos.largoPelaje],
    ["Color de ojos", datos.colorOjos],
    [
      "Vive en",
      datos.esDeInterior === true ? "Interior" : datos.esDeInterior === false ? "Sale a la calle" : null,
    ],
  ];
  return filas.filter((f): f is [string, string] => Boolean(f[1]));
}
