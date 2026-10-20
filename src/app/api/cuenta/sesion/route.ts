import { NextResponse } from "next/server";
import { COOKIE_USUARIO } from "@/lib/sesionUsuario";

export async function DELETE() {
  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.set(COOKIE_USUARIO, "", { path: "/", maxAge: 0 });
  return respuesta;
}
