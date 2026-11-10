import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { gastarTiempoDeVerificacion, verificarContrasena } from "@/lib/contrasenas";
import { Limitador, ipCliente } from "@/lib/limitador";
import { COOKIE_USUARIO, DURACION_SESION_MS, crearTokenUsuario } from "@/lib/sesionUsuario";
import { primerErrorPorCampo } from "@/lib/validacion";
import { loginSchema } from "@/lib/validacionCuenta";

// Bloqueo temporal tras fallos repetidos, por correo y por IP, para frenar la
// fuerza bruta (el límite por IP del middleware es más amplio).
const fallos = new Limitador();
const MAX_FALLOS = 5;
const VENTANA_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  const resultado = loginSchema.safeParse(await request.json().catch(() => null));
  if (!resultado.success) {
    return NextResponse.json(
      { errores: primerErrorPorCampo(resultado.error) },
      { status: 400 }
    );
  }

  const claveCorreo = `correo:${resultado.data.email}`;
  const claveIp = `ip:${ipCliente(request.headers)}`;
  const bloqueo = [claveCorreo, claveIp]
    .map((c) => fallos.bloqueado(c, MAX_FALLOS, VENTANA_MS))
    .find((r) => !r.permitido);
  if (bloqueo) {
    return NextResponse.json(
      { error: "Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo." },
      { status: 429, headers: { "Retry-After": String(bloqueo.reintentarEnSeg) } }
    );
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email: resultado.data.email },
  });

  if (!usuario) gastarTiempoDeVerificacion(resultado.data.contrasena);
  if (!usuario || !verificarContrasena(resultado.data.contrasena, usuario.contrasenaHash)) {
    fallos.registrar(claveCorreo, VENTANA_MS);
    fallos.registrar(claveIp, VENTANA_MS);
    console.warn(`[seguridad] inicio de sesión fallido (${claveIp})`);
    // Pequeña demora para que probar contraseñas a ciegas sea lento.
    await new Promise((resolver) => setTimeout(resolver, 400));
    return NextResponse.json(
      { error: "Correo o contraseña incorrectos." },
      { status: 401 }
    );
  }

  fallos.olvidar(claveCorreo);
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
