export type RolCuenta = "CIUDADANO" | "VETERINARIA" | "REFUGIO";

// Panel al que lleva cada tipo de cuenta tras iniciar sesión (o desde el
// navbar). Está aparte de cuenta.ts porque ese módulo usa next/headers y
// los componentes cliente también necesitan esta función.
export function rutaPanel(rol: RolCuenta): string {
  if (rol === "VETERINARIA") return "/veterinaria";
  if (rol === "REFUGIO") return "/refugio";
  return "/cuenta";
}
