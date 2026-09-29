import { createHash, createHmac, timingSafeEqual } from "crypto";

// Sesión del administrador. No hay cuentas de usuario en la aplicación: el
// público sigue usando todo sin iniciar sesión, y solo el administrador
// entra (desde el botón "Admin" del navbar) para editar reportes (HU-25) y
// marcarlos como reencontrados (HU-12).
//
// Las credenciales viven en variables de entorno (ADMIN_USUARIO,
// ADMIN_CONTRASENA), nunca en el código. La sesión es una cookie httpOnly
// firmada con HMAC: el servidor puede verificarla sin guardar nada en la
// base de datos, y el navegador no puede falsificarla ni leerla.

export const COOKIE_ADMIN = "petmatch_admin";
export const DURACION_SESION_MS = 8 * 60 * 60 * 1000; // 8 horas

interface Configuracion {
  usuario: string;
  contrasena: string;
  secreto: string;
}

function leerConfiguracion(): Configuracion | null {
  const usuario = process.env.ADMIN_USUARIO?.trim();
  const contrasena = process.env.ADMIN_CONTRASENA;
  if (!usuario || !contrasena) return null;

  // Si no se define ADMIN_SECRETO se deriva uno de las credenciales, así
  // cambiar la contraseña invalida automáticamente las sesiones abiertas.
  const secreto =
    process.env.ADMIN_SECRETO ||
    createHash("sha256")
      .update(`petmatch-admin:${usuario}:${contrasena}`)
      .digest("hex");

  return { usuario, contrasena, secreto };
}

export function adminConfigurado(): boolean {
  return leerConfiguracion() !== null;
}

// Compara en tiempo constante (sobre hashes de igual longitud) para no
// filtrar por tiempos de respuesta cuántos caracteres coinciden.
function iguales(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

export function credencialesValidas(usuario: string, contrasena: string) {
  const config = leerConfiguracion();
  if (!config) return false;
  // El usuario no distingue mayúsculas; la contraseña sí.
  const usuarioOk = iguales(
    usuario.trim().toLowerCase(),
    config.usuario.toLowerCase()
  );
  const contrasenaOk = iguales(contrasena, config.contrasena);
  return usuarioOk && contrasenaOk;
}

function firmar(contenido: string, secreto: string): string {
  return createHmac("sha256", secreto).update(contenido).digest("base64url");
}

export function crearTokenSesion(ahora = Date.now()): string {
  const config = leerConfiguracion();
  if (!config) throw new Error("El acceso de administrador no está configurado.");

  const contenido = Buffer.from(
    JSON.stringify({ u: config.usuario, exp: ahora + DURACION_SESION_MS })
  ).toString("base64url");
  return `${contenido}.${firmar(contenido, config.secreto)}`;
}

// Devuelve el nombre del administrador si el token es auténtico y vigente.
export function verificarTokenSesion(
  token: string | undefined,
  ahora = Date.now()
): string | null {
  const config = leerConfiguracion();
  if (!config || !token) return null;

  const [contenido, firma] = token.split(".");
  if (!contenido || !firma) return null;

  const esperada = Buffer.from(firmar(contenido, config.secreto));
  const recibida = Buffer.from(firma);
  if (
    esperada.length !== recibida.length ||
    !timingSafeEqual(esperada, recibida)
  ) {
    return null;
  }

  try {
    const datos = JSON.parse(Buffer.from(contenido, "base64url").toString());
    if (typeof datos.exp !== "number" || datos.exp <= ahora) return null;
    return typeof datos.u === "string" ? datos.u : null;
  } catch {
    return null;
  }
}
