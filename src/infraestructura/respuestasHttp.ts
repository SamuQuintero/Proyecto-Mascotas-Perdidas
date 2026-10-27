import { NextResponse } from "next/server";
import type { Falla, Resultado } from "@/servicios/resultado";

// Traduce el resultado de un caso de uso a una respuesta HTTP. Es el único
// lugar que sabe qué código corresponde a cada tipo de falla del negocio.
const ESTADO_HTTP: Record<Exclude<Falla["tipo"], "INVALIDO">, number> = {
  NO_ENCONTRADO: 404,
  SIN_SESION: 401,
  PROHIBIDO: 403,
  CONFLICTO: 409,
  DEMASIADO_PRONTO: 429,
};

export function respuestaDeFalla(falla: Falla): NextResponse {
  if (falla.tipo === "INVALIDO") {
    return NextResponse.json({ errores: falla.errores }, { status: 400 });
  }
  return NextResponse.json({ error: falla.mensaje }, { status: ESTADO_HTTP[falla.tipo] });
}

// Si salió bien, responde con `exito(valor)`; si no, con la falla.
export function responder<T>(
  resultado: Resultado<T>,
  exito: (valor: T) => NextResponse
): NextResponse {
  return resultado.ok ? exito(resultado.valor) : respuestaDeFalla(resultado.falla);
}
