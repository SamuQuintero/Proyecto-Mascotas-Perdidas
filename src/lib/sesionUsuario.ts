import { createHmac, timingSafeEqual } from "crypto";
import { leerSecreto } from "@/lib/secretos";

// Sesión de cuentas reales (ciudadano HU-16, veterinaria HU-17, refugio HU-20). Es un
// módulo separado de src/lib/sesion.ts (el admin único, por variables de
// entorno): aquí la identidad vive en la tabla Usuario, y la cookie solo
// guarda el id y el rol, firmados con HMAC, para no tener que consultar la
// base de datos en cada petición.

export const COOKIE_USUARIO = "petmatch_usuario";
export const DURACION_SESION_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

// En producción SESION_SECRETO es obligatorio (ver secretos.ts); en
// desarrollo se usa una clave fija con aviso.
function secreto(): string {
  return leerSecreto("SESION_SECRETO", "clave-de-desarrollo-petmatch-no-usar-en-produccion");
}

const ROLES = ["CIUDADANO", "VETERINARIA", "REFUGIO"];

interface DatosSesion {
  id: string;
  rol: "CIUDADANO" | "VETERINARIA" | "REFUGIO";
  // El nombre va en la cookie (firmada, no se puede falsificar) para que el
  // navbar lo muestre sin consultar la base de datos en cada navegación.
  // Las rutas que necesitan el registro completo y verificado (/cuenta,
  // /veterinaria, las acciones protegidas) siguen consultando la base de
  // datos aparte, con usuarioActual().
  nombre: string;
}

function firmar(contenido: string): string {
  return createHmac("sha256", secreto()).update(contenido).digest("base64url");
}

export function crearTokenUsuario(datos: DatosSesion, ahora = Date.now()): string {
  const contenido = Buffer.from(
    JSON.stringify({ ...datos, exp: ahora + DURACION_SESION_MS })
  ).toString("base64url");
  return `${contenido}.${firmar(contenido)}`;
}

export function verificarTokenUsuario(
  token: string | undefined,
  ahora = Date.now()
): DatosSesion | null {
  if (!token) return null;
  const [contenido, firma] = token.split(".");
  if (!contenido || !firma) return null;

  const esperada = Buffer.from(firmar(contenido));
  const recibida = Buffer.from(firma);
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) {
    return null;
  }

  try {
    const datos = JSON.parse(Buffer.from(contenido, "base64url").toString());
    if (typeof datos.exp !== "number" || datos.exp <= ahora) return null;
    if (!ROLES.includes(datos.rol)) return null;
    if (typeof datos.id !== "string") return null;
    if (typeof datos.nombre !== "string") return null;
    return { id: datos.id, rol: datos.rol, nombre: datos.nombre };
  } catch {
    return null;
  }
}
