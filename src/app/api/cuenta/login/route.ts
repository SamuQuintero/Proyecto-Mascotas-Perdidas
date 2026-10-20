import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verificarContrasena } from "@/lib/contrasenas";
import { COOKIE_USUARIO, DURACION_SESION_MS, crearTokenUsuario } from "@/lib/sesionUsuario";
import { primerErrorPorCampo } from "@/lib/validacion";
import { loginSchema } from "@/lib/validacionCuenta";

export async function POST(request: NextRequest) {
  const resultado = loginSchema.safeParse(await request.json().catch(() => null));
  if (!resultado.success) {
    return NextResponse.json(
      { errores: primerErrorPorCampo(resultado.error) },
      { status: 400 }
    );
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email: resultado.data.email },
  });

  if (!usuario || !verificarContrasena(resultado.data.contrasena, usuario.contrasenaHash)) {
    // Pequeña demora para que probar contraseñas a ciegas sea lento.
    await new Promise((resolver) => setTimeout(resolver, 400));
    return NextResponse.json(
      { error: "Correo o contraseña incorrectos." },
      { status: 401 }
    );
  }

  const respuesta = NextResponse.json({
    usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
  });
  const token = crearTokenUsuario({ id: usuario.id, rol: usuario.rol, nombre: usuario.nombre });
  respuesta.cookies.set(COOKIE_USUARIO, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_SESION_MS / 1000,
  });
  return respuesta;
}
