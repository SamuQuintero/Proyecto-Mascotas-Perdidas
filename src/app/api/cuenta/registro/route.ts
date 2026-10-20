import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashContrasena } from "@/lib/contrasenas";
import { COOKIE_USUARIO, DURACION_SESION_MS, crearTokenUsuario } from "@/lib/sesionUsuario";
import { primerErrorPorCampo } from "@/lib/validacion";
import { registroSchema } from "@/lib/validacionCuenta";

// HU-16 / HU-17: registro de ciudadano o veterinaria. Son cuentas reales
// (con contraseña), a diferencia del resto de la aplicación, que no las
// necesita para publicar o buscar reportes.
export async function POST(request: NextRequest) {
  const resultado = registroSchema.safeParse(await request.json().catch(() => null));
  if (!resultado.success) {
    return NextResponse.json(
      { errores: primerErrorPorCampo(resultado.error) },
      { status: 400 }
    );
  }

  const datos = resultado.data;
  const existente = await prisma.usuario.findUnique({ where: { email: datos.email } });
  if (existente) {
    return NextResponse.json(
      { errores: { email: "Ya existe una cuenta con ese correo." } },
      { status: 409 }
    );
  }

  const usuario = await prisma.usuario.create({
    data: {
      nombre: datos.nombre,
      email: datos.email,
      contrasenaHash: hashContrasena(datos.contrasena),
      rol: datos.rol,
      nombreClinica: datos.rol === "VETERINARIA" ? datos.nombreClinica || null : null,
    },
  });

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
