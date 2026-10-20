import sharp from "sharp";

// HU-10: "buscar por foto" sin ningún servicio de IA (comparación local,
// gratis). No reconoce al animal: solo extrae el color dominante de la
// imagen y lo compara contra el texto de color de los reportes ya
// publicados, reutilizando las mismas familias de color de coincidencias.ts
// (para que "negro" en una foto y "negro" escrito en un reporte se traten
// igual). Es deliberadamente simple: sirve para acortar la lista, no para
// identificar la mascota con certeza — el formulario lo deja claro.

// Colores de referencia (RGB) para cada familia, y uno aparte para detectar
// fotos muy abigarradas ("manchado"), por su alta variación de color.
const REFERENCIAS: { familia: string; rgb: [number, number, number] }[] = [
  { familia: "negro", rgb: [25, 25, 25] },
  { familia: "blanco", rgb: [240, 240, 235] },
  { familia: "gris", rgb: [140, 140, 140] },
  { familia: "cafe", rgb: [92, 64, 44] },
  { familia: "dorado", rgb: [205, 170, 100] },
  { familia: "naranja", rgb: [190, 95, 45] },
];

function distanciaColor(a: [number, number, number], b: [number, number, number]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

export interface ColorExtraido {
  rgb: [number, number, number];
  familia: string;
  variacion: number; // desviación entre los colores de la imagen; alta = foto muy abigarrada
}

// Reduce la imagen a una cuadrícula pequeña (8×8) y promedia sus píxeles:
// barato, sin dependencias de IA, y suficiente para una familia de color.
export async function extraerColorDominante(buffer: Buffer): Promise<ColorExtraido> {
  const { data, info } = await sharp(buffer)
    .resize(8, 8, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixeles: [number, number, number][] = [];
  for (let i = 0; i + 2 < data.length; i += info.channels) {
    pixeles.push([data[i], data[i + 1], data[i + 2]]);
  }

  const promedio = pixeles
    .reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0])
    .map((v) => Math.round(v / pixeles.length)) as [number, number, number];

  const variacion =
    pixeles.reduce((acc, p) => acc + distanciaColor(p, promedio), 0) / pixeles.length;

  // Mucha variación entre píxeles = pelaje de varios colores, no uno solo.
  if (variacion > 55) {
    return { rgb: promedio, familia: "manchado", variacion };
  }

  const familia = REFERENCIAS.reduce((mejor, ref) =>
    distanciaColor(promedio, ref.rgb) < distanciaColor(promedio, mejor.rgb) ? ref : mejor
  ).familia;

  return { rgb: promedio, familia, variacion };
}
