import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { COOKIE_USUARIO, verificarTokenUsuario } from "@/lib/sesionUsuario";

// Lectura de la sesión de usuario (ciudadano, veterinaria o refugio) desde páginas y
// rutas de API. Paralelo a src/lib/admin.ts, que hace lo mismo para el
// admin único.

export async function usuarioActual() {
  const datos = verificarTokenUsuario(cookies().get(COOKIE_USUARIO)?.value);
  if (!datos) return null;
  const usuario = await prisma.usuario.findUnique({ where: { id: datos.id } });
  // La cuenta pudo borrarse después de emitir la cookie; no confiar solo en el token.
  if (!usuario) return null;
  return usuario;
}

// Versión ligera, sin consultar la base de datos: solo decodifica y
// verifica la firma de la cookie. Se usa en el layout raíz (se ejecuta en
// cada navegación) para que el navbar muestre el nombre y el rol sin pagar
// una consulta a Supabase en cada clic. No es apta para decidir permisos:
// para eso siempre se usa usuarioActual() o exigirCiudadano/exigirVeterinaria,
// que sí verifican contra la base de datos que la cuenta sigue existiendo.
export function usuarioSesionLigera() {
  return verificarTokenUsuario(cookies().get(COOKIE_USUARIO)?.value);
}

export async function exigirCiudadano() {
  const usuario = await usuarioActual();
  if (usuario?.rol === "CIUDADANO") return { usuario, error: null };
  return {
    usuario: null,
    error: NextResponse.json(
      { error: "Necesitas iniciar sesión como ciudadano." },
      { status: 401 }
    ),
  };
}

export async function exigirRefugio() {
  const usuario = await usuarioActual();
  if (usuario?.rol === "REFUGIO") return { usuario, error: null };
  return {
    usuario: null,
    error: NextResponse.json(
      { error: "Necesitas iniciar sesión como refugio." },
      { status: 401 }
    ),
  };
}

// HU-18: veterinarias y refugios comparten el perfil público de
// "a quién acudir" (ubicación, teléfono, recibe mascotas encontradas).
export async function exigirEstablecimiento() {
  const usuario = await usuarioActual();
  if (usuario && (usuario.rol === "VETERINARIA" || usuario.rol === "REFUGIO")) {
    return { usuario, error: null };
  }
  return {
    usuario: null,
    error: NextResponse.json(
      { error: "Necesitas iniciar sesión como veterinaria o refugio." },
      { status: 401 }
    ),
  };
}

export async function exigirVeterinaria() {
  const usuario = await usuarioActual();
  if (usuario?.rol === "VETERINARIA") return { usuario, error: null };
  return {
    usuario: null,
    error: NextResponse.json(
      { error: "Necesitas iniciar sesión como veterinaria." },
      { status: 401 }
    ),
  };
}
