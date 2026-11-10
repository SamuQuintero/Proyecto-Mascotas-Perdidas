// Reglas puras de protección de la API, usadas por src/middleware.ts.

export const METODOS_ESCRITURA = ["POST", "PUT", "PATCH", "DELETE"];

// Foto de 5 MB más los campos del formulario.
export const CUERPO_MAXIMO_BYTES = 6 * 1024 * 1024;

// Defensa contra CSRF además de SameSite=Lax: una petición que modifica datos
// y viene de un navegador debe originarse en este mismo sitio. Los clientes
// que no son navegadores (curl, pruebas) no envían Origin ni Sec-Fetch-Site y
// no llevan las cookies de ninguna víctima, así que no son un riesgo de CSRF.
export function origenPermitido(
  origen: string | null,
  host: string | null,
  secFetchSite: string | null
): boolean {
  if (origen) {
    try {
      return !!host && new URL(origen).host === host;
    } catch {
      return false;
    }
  }
  return secFetchSite === null || secFetchSite === "same-origin" || secFetchSite === "none";
}

export interface ReglaLimite {
  nombre: string;
  limite: number;
  ventanaMs: number;
}

const MIN = 60 * 1000;

// Qué cubo de límite aplica a una petición. El bloqueo fino por intentos
// fallidos de contraseña está en las propias rutas de login.
export function reglaDeLimite(metodo: string, ruta: string): ReglaLimite {
  if (metodo === "POST" && ruta === "/api/cuenta/registro") {
    return { nombre: "registro", limite: 5, ventanaMs: 60 * MIN };
  }
  if (metodo === "POST" && (ruta === "/api/cuenta/login" || ruta === "/api/admin/sesion")) {
    return { nombre: "acceso", limite: 30, ventanaMs: 15 * MIN };
  }
  if (metodo === "POST" && (ruta === "/api/reportes" || ruta === "/api/mascotas")) {
    return { nombre: "publicar", limite: 20, ventanaMs: 60 * MIN };
  }
  if (METODOS_ESCRITURA.includes(metodo)) {
    return { nombre: "escritura", limite: 120, ventanaMs: MIN };
  }
  return { nombre: "lectura", limite: 600, ventanaMs: MIN };
}
