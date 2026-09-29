import { normalizarTexto } from "@/lib/texto";

// Colores principales que se sugieren al escribir el color de una mascota.
// Se puede escribir libremente y combinar ("Café con blanco"): la sugerencia
// completa la palabra que se está escribiendo. `muestra` es el fondo CSS del
// circulito de color que acompaña cada opción.
export const COLORES_PRINCIPALES = [
  { nombre: "Negro", muestra: "#1f1d24" },
  { nombre: "Blanco", muestra: "#ffffff" },
  { nombre: "Gris", muestra: "#9a9aa3" },
  { nombre: "Plateado", muestra: "linear-gradient(135deg,#e6e8ec,#9fa4ad)" },
  { nombre: "Café", muestra: "#7b4a2a" },
  { nombre: "Marrón", muestra: "#8b5a3c" },
  { nombre: "Chocolate", muestra: "#4e2c1c" },
  { nombre: "Canela", muestra: "#c68642" },
  { nombre: "Beige", muestra: "#e3cfa8" },
  { nombre: "Crema", muestra: "#f5e6c8" },
  { nombre: "Dorado", muestra: "#d4a32c" },
  { nombre: "Amarillo", muestra: "#f2c94c" },
  { nombre: "Naranja", muestra: "#ec8a3b" },
  { nombre: "Rojizo", muestra: "#b5502f" },
  { nombre: "Atigrado", muestra: "repeating-linear-gradient(45deg,#8a6a45 0 4px,#3b2a1a 4px 8px)" },
  { nombre: "Manchado", muestra: "radial-gradient(circle at 30% 30%,#2b2b2b 25%,transparent 26%),radial-gradient(circle at 70% 65%,#2b2b2b 20%,#fff 21%)" },
  { nombre: "Bicolor", muestra: "linear-gradient(90deg,#1f1d24 50%,#fff 50%)" },
  { nombre: "Tricolor", muestra: "conic-gradient(#1f1d24 0 33%,#c68642 0 66%,#fff 0)" },
  { nombre: "Carey", muestra: "conic-gradient(#1f1d24 0 25%,#c86b2a 0 45%,#1f1d24 0 70%,#e0a060 0)" },
] as const;

export type ColorPrincipal = (typeof COLORES_PRINCIPALES)[number];

// Separadores para combinar colores: "café con blanco", "negro y gris",
// "blanco, café".
const SEPARADOR = /(,\s*|\s+(?:con|y)\s+|\s*\/\s*)/i;

// Divide el texto en lo ya escrito y la palabra que se está escribiendo.
function partir(texto: string): { anterior: string; actual: string } {
  const partes = texto.split(SEPARADOR);
  const actual = partes.pop() ?? "";
  return { anterior: partes.join(""), actual };
}

// Opciones para lo que se está escribiendo, sin distinguir mayúsculas ni
// tildes ("cafe" → "Café"). Primero las que empiezan igual, luego las que lo
// contienen. Sin nada escrito se muestran todas.
export function sugerirColores(texto: string, maximo = 8): ColorPrincipal[] {
  const { anterior, actual } = partir(texto);
  const buscado = normalizarTexto(actual);
  const yaUsados = new Set(
    anterior.split(SEPARADOR).map(normalizarTexto).filter(Boolean)
  );
  const disponibles = COLORES_PRINCIPALES.filter(
    (c) => !yaUsados.has(normalizarTexto(c.nombre))
  );
  if (!buscado) return disponibles.slice(0, maximo);

  const empiezan = disponibles.filter((c) => normalizarTexto(c.nombre).startsWith(buscado));
  const contienen = disponibles.filter(
    (c) => !empiezan.includes(c) && normalizarTexto(c.nombre).includes(buscado)
  );
  return [...empiezan, ...contienen].slice(0, maximo);
}

// Reemplaza la palabra que se está escribiendo por el color elegido. El
// primer color va con mayúscula inicial y los siguientes en minúscula
// ("Café con blanco").
export function aplicarColor(texto: string, color: string): string {
  const { anterior } = partir(texto);
  return anterior ? `${anterior}${color.toLowerCase()}` : color;
}

function colorConocido(palabra: string): ColorPrincipal | undefined {
  const buscado = normalizarTexto(palabra);
  return COLORES_PRINCIPALES.find((c) => normalizarTexto(c.nombre) === buscado);
}

// ¿La palabra actual ya está escrita exactamente como el color de la lista?
// ("Café" sí; "cafe" o "CAFE" todavía no: se sigue ofreciendo "Café").
export function colorCompleto(texto: string): boolean {
  const color = colorConocido(partir(texto).actual);
  return color !== undefined && aplicarColor(texto, color.nombre) === texto;
}

// Corrige la escritura de los colores conocidos al salir del campo:
// "CAFE con BLANCO" → "Café con blanco". Lo que no es un color de la lista
// se deja como se escribió.
export function canonizarColor(texto: string): string {
  let posicion = 0;
  return texto
    .trim()
    .split(SEPARADOR)
    .map((parte) => {
      if (SEPARADOR.test(parte)) {
        const separador = normalizarTexto(parte);
        return separador === "," ? ", " : separador === "/" ? " / " : ` ${separador} `;
      }
      const color = colorConocido(parte);
      const indice = posicion++;
      if (!color) return parte.trim();
      return indice === 0 ? color.nombre : color.nombre.toLowerCase();
    })
    .join("");
}
