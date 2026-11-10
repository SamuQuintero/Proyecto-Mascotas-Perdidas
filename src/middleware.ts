import { NextRequest, NextResponse } from "next/server";
import { Limitador, ipCliente } from "@/lib/limitador";
import {
  CUERPO_MAXIMO_BYTES,
  METODOS_ESCRITURA,
  origenPermitido,
  reglaDeLimite,
} from "@/lib/proteccion";

// Primera línea de defensa de la API: tamaño del cuerpo, origen de las
// peticiones que modifican datos (CSRF) y límite de peticiones por IP.

const limitador = new Limitador();

function rechazo(estado: number, mensaje: string, cabeceras?: Record<string, string>) {
  return NextResponse.json({ error: mensaje }, { status: estado, headers: cabeceras });
}

export function middleware(request: NextRequest) {
  const metodo = request.method;
  const ruta = request.nextUrl.pathname;
  const escritura = METODOS_ESCRITURA.includes(metodo);

  if (escritura) {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    if (!origenPermitido(request.headers.get("origin"), host, request.headers.get("sec-fetch-site"))) {
      console.warn(`[seguridad] petición de otro origen bloqueada: ${metodo} ${ruta}`);
      return rechazo(403, "Petición no permitida desde otro sitio.");
    }
    const largo = Number(request.headers.get("content-length") ?? 0);
    if (largo > CUERPO_MAXIMO_BYTES) {
      return rechazo(413, "La petición es demasiado grande.");
    }
  }

  const regla = reglaDeLimite(metodo, ruta);
  const resultado = limitador.intentar(
    `${regla.nombre}:${ipCliente(request.headers)}`,
    regla.limite,
    regla.ventanaMs
  );
  if (!resultado.permitido) {
    return rechazo(
      429,
      "Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.",
      { "Retry-After": String(resultado.reintentarEnSeg) }
    );
  }

  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
