export type RolCuenta = "CIUDADANO" | "VETERINARIA" | "REFUGIO";

// Panel al que lleva cada tipo de cuenta tras iniciar sesión (o desde el
// navbar). Es una tabla, no una cadena de if: al agregar un rol, TypeScript
// obliga a agregar su panel aquí (el Record debe cubrir todos los roles).
// Está aparte de cuenta.ts porque ese módulo usa next/headers y los
// componentes cliente también necesitan esta función.
const PANEL_POR_ROL: Record<RolCuenta, string> = {
  CIUDADANO: "/cuenta",
  VETERINARIA: "/veterinaria",
  REFUGIO: "/refugio",
};

export function rutaPanel(rol: RolCuenta): string {
  return PANEL_POR_ROL[rol];
}
