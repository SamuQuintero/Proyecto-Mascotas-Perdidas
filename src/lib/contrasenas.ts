import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// Hash de contraseñas de Usuario (HU-16 ciudadano, HU-17 veterinaria) con
// scrypt (incluido en Node, sin dependencias nuevas). Formato guardado:
// "<salt-hex>:<hash-hex>". El admin único (src/lib/sesion.ts) sigue aparte,
// por variables de entorno: este módulo es solo para cuentas reales en la
// base de datos.

const LARGO_CLAVE = 64;

export function hashContrasena(contrasena: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(contrasena, salt, LARGO_CLAVE).toString("hex");
  return `${salt}:${hash}`;
}

export function verificarContrasena(contrasena: string, guardado: string): boolean {
  const [salt, hash] = guardado.split(":");
  if (!salt || !hash) return false;
  const esperado = Buffer.from(hash, "hex");
  const calculado = scryptSync(contrasena, salt, LARGO_CLAVE);
  return esperado.length === calculado.length && timingSafeEqual(esperado, calculado);
}
