// HU-21: compartir un reporte en redes con un enlace a la plataforma. Así la
// información sigue viviendo en PetMatch (contacto, mapa, chat) en lugar de
// copiarse a publicaciones sueltas. Funciones puras (ver compartir.test.ts).

interface ReporteCompartible {
  tipo: "PERDIDA" | "ENCONTRADA";
  nombre: string | null;
  especie: string;
  color: string;
  zona: string;
}

// "¡Ayuda! Se perdió Toby (perro, café) en Pasto. Mira el reporte y cómo contactar:"
export function textoParaCompartir(reporte: ReporteCompartible): string {
  const que = `${reporte.especie.toLowerCase()}, ${reporte.color.toLowerCase()}`;
  return reporte.tipo === "PERDIDA"
    ? `¡Ayuda! Se perdió ${reporte.nombre || `un ${que}`}${reporte.nombre ? ` (${que})` : ""} en ${reporte.zona}. Mira el reporte:`
    : `Encontraron un ${que} en ${reporte.zona}. ¿Es tu mascota? Mira el reporte:`;
}

export function enlaceCompartirWhatsApp(url: string, texto: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${texto} ${url}`)}`;
}

export function enlaceCompartirFacebook(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export function enlaceCompartirX(url: string, texto: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(url)}`;
}

// Título y descripción de la vista previa que muestran las redes al pegar el enlace.
export function vistaPreviaReporte(reporte: ReporteCompartible) {
  const titulo =
    reporte.tipo === "PERDIDA"
      ? `Se perdió ${reporte.nombre || `un ${reporte.especie.toLowerCase()}`} en ${reporte.zona}`
      : `Se encontró un ${reporte.especie.toLowerCase()} en ${reporte.zona}`;
  return {
    titulo: `${titulo} — PetMatch`,
    descripcion: `${reporte.especie}, ${reporte.color.toLowerCase()}. Mira la foto, el mapa y cómo contactar.`,
  };
}

// Registro de redes sociales (principio abierto/cerrado): el botón de
// compartir recorre esta lista. Para agregar una red (Telegram, LinkedIn…)
// se agrega una entrada aquí; el componente no se modifica.
export interface RedSocial {
  id: string;
  etiqueta: string;
  enlace(url: string, texto: string): string;
}

export const REDES_SOCIALES: readonly RedSocial[] = [
  { id: "whatsapp", etiqueta: "WhatsApp", enlace: (url, texto) => enlaceCompartirWhatsApp(url, texto) },
  { id: "facebook", etiqueta: "Facebook", enlace: (url) => enlaceCompartirFacebook(url) },
  { id: "x", etiqueta: "X", enlace: (url, texto) => enlaceCompartirX(url, texto) },
];
