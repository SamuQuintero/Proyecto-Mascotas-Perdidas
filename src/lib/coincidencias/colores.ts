import { normalizarTexto } from "@/lib/texto";

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

// Familias que comparten dos colores, y cuántas tiene el que menos tiene
// (para medir qué fracción del color más simple coincide).
export function coloresEnComun(a: string, b: string): { comunes: string[]; menor: number } {
  const familiasA = familiasDeColor(a);
  const familiasB = familiasDeColor(b);
  return {
    comunes: Array.from(familiasA).filter((c) => familiasB.has(c)),
    menor: Math.min(familiasA.size, familiasB.size),
  };
}
