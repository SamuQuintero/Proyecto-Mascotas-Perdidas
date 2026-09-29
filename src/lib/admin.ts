import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_ADMIN, verificarTokenSesion } from "@/lib/sesion";

// Lectura de la sesión de administrador desde páginas y rutas de API.

export function adminActual(): string | null {
  return verificarTokenSesion(cookies().get(COOKIE_ADMIN)?.value);
}

// Para rutas de API: devuelve una respuesta 401 si no hay sesión válida,
// o null si la petición puede continuar.
export function exigirAdmin(): NextResponse | null {
  if (adminActual()) return null;
  return NextResponse.json(
    { error: "Necesitas iniciar sesión como administrador." },
    { status: 401 }
  );
}
