import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  COOKIE_ADMIN,
  DURACION_SESION_MS,
  adminConfigurado,
  credencialesValidas,
  crearTokenSesion,
} from "@/lib/sesion";

const credencialesSchema = z.object({
  usuario: z.string().max(100),
  contrasena: z.string().max(200),
});

// Iniciar sesión como administrador.
export async function POST(request: NextRequest) {
  if (!adminConfigurado()) {
    return NextResponse.json(
      {
        error:
          "El acceso de administrador no está configurado. Define ADMIN_USUARIO y ADMIN_CONTRASENA en el archivo .env.",
      },
      { status: 503 }
    );
  }

  const resultado = credencialesSchema.safeParse(
    await request.json().catch(() => null)
  );

  if (
    !resultado.success ||
    !credencialesValidas(resultado.data.usuario, resultado.data.contrasena)
  ) {
    // Pequeña pausa para que probar contraseñas a ciegas sea lento.
    await new Promise((resolver) => setTimeout(resolver, 600));
    return NextResponse.json(
      { error: "Usuario o contraseña incorrectos." },
      { status: 401 }
    );
  }

  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.set(COOKIE_ADMIN, crearTokenSesion(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_SESION_MS / 1000,
  });
  return respuesta;
}

// Cerrar sesión.
export async function DELETE() {
  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.set(COOKIE_ADMIN, "", { path: "/", maxAge: 0 });
  return respuesta;
}
