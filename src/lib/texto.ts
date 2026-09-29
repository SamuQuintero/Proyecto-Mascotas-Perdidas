// Normalización de texto escrito libremente por las personas. Para buscar y
// comparar da igual si se escribió con mayúsculas o minúsculas, con o sin
// tilde, o con espacios de más: "FÁTIMA ", "fatima" y "Fátima" son lo mismo.

export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita tildes, diéresis y la virgulilla de la ñ
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// ¿`texto` contiene lo que se busca? (sin distinguir mayúsculas ni tildes)
export function contieneTexto(texto: string, busqueda: string): boolean {
  const buscado = normalizarTexto(busqueda);
  return buscado === "" || normalizarTexto(texto).includes(buscado);
}
