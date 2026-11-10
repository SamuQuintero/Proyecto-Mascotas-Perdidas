import { headers } from "next/headers";

// Enlace de WhatsApp para un teléfono escrito libremente. Un celular
// colombiano de 10 dígitos (3XX…) recibe el indicativo 57.
export function enlaceWhatsApp(telefono: string): string | null {
  let digitos = telefono.replace(/\D/g, "");
  if (digitos.length === 10 && digitos.startsWith("3")) digitos = `57${digitos}`;
  return digitos.length >= 11 ? `https://wa.me/${digitos}` : null;
}

export function enlaceTelefono(telefono: string): string {
  return `tel:${telefono.replace(/[^\d+]/g, "")}`;
}

// URL absoluta para el QR de la placa (HU-8) y la vista previa al compartir.
// Si URL_PUBLICA está definida (el dominio donde se publica la app) se usa esa:
// en producción debe estarlo, porque la cabecera Host la puede manipular quien
// hace la petición. Sin ella (desarrollo) se usa la del host de la petición,
// siempre que tenga forma de nombre de host válido.
const HOST_VALIDO = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:\d{1,5})?$/i;

export async function urlAbsoluta(ruta: string): Promise<string> {
  if (/^https?:\/\//.test(ruta)) return ruta; // foto en la nube: ya es absoluta
  const fija = process.env.URL_PUBLICA?.replace(/\/$/, "");
  if (fija) return `${fija}${ruta}`;
  const h = await headers();
  const candidato = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const host = HOST_VALIDO.test(candidato) ? candidato : "localhost:3000";
  const protocolo =
    h.get("x-forwarded-proto") === "https" || (!host.startsWith("localhost") && !host.startsWith("127."))
      ? "https"
      : "http";
  return `${protocolo}://${host}${ruta}`;
}

export function esUrlLocal(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/.test(url);
}
