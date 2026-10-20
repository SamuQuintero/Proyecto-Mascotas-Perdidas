import { NextResponse } from "next/server";
import { usuarioActual } from "@/lib/cuenta";

// Sesión actual para componentes cliente (la campana, el navbar).
export async function GET() {
  const usuario = await usuarioActual();
  if (!usuario) return NextResponse.json({ usuario: null });
  return NextResponse.json({
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      rol: usuario.rol,
      avisoLatitud: usuario.avisoLatitud,
      avisoLongitud: usuario.avisoLongitud,
      avisoRadioKm: usuario.avisoRadioKm,
    },
  });
}
