import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// Hash de contraseñas de Usuario (HU-16 ciudadano, HU-17 veterinaria) con
// scrypt (incluido en Node, sin dependencias nuevas). El admin único
// (src/lib/sesion.ts) sigue aparte, por variables de entorno.
//
// Formato actual: "s2:<salt-hex>:<hash-hex>" con N=2^15, r=8, p=1 (el costo
// recomendado por OWASP). Formato anterior, aún verificable: "<salt>:<hash>"
// con los parámetros por defecto de Node (N=2^14).

const LARGO_CLAVE = 64;
const COSTO_ACTUAL = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const COSTO_ANTERIOR = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export function hashContrasena(contrasena: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(contrasena, salt, LARGO_CLAVE, COSTO_ACTUAL).toString("hex");
  return `s2:${salt}:${hash}`;
}

export function verificarContrasena(contrasena: string, guardado: string): boolean {
  const partes = guardado.split(":");
  const nuevo = partes[0] === "s2" && partes.length === 3;
  const [salt, hash] = nuevo ? partes.slice(1) : partes;
  if (!salt || !hash) return false;
  const esperado = Buffer.from(hash, "hex");
  const calculado = scryptSync(contrasena, salt, LARGO_CLAVE, nuevo ? COSTO_ACTUAL : COSTO_ANTERIOR);
  return esperado.length === calculado.length && timingSafeEqual(esperado, calculado);
}

// Hash de relleno para gastar el mismo tiempo cuando el correo no existe y
// que la demora de la respuesta no revele qué correos tienen cuenta.
const HASH_SENUELO = hashContrasena(randomBytes(16).toString("hex"));
export function gastarTiempoDeVerificacion(contrasena: string): void {
  verificarContrasena(contrasena, HASH_SENUELO);
}
