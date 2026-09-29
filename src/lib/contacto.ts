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

// URL absoluta para el QR de la placa (HU-8). Si URL_PUBLICA está definida
// (el dominio donde se publica la app) se usa esa; si no, la del host de la
// petición actual.
export function urlAbsoluta(ruta: string): string {
  const base =
    process.env.URL_PUBLICA?.replace(/\/$/, "") ||
    (() => {
      const h = headers();
      const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
      const protocolo =
        h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
      return `${protocolo}://${host}`;
    })();
  return `${base}${ruta}`;
}

export function esUrlLocal(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/.test(url);
}
