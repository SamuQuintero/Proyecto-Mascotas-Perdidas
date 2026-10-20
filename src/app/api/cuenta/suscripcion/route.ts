import { NextRequest, NextResponse } from "next/server";
import { exigirCiudadano } from "@/lib/cuenta";
import { prisma } from "@/lib/db";
import { primerErrorPorCampo } from "@/lib/validacion";
import { suscripcionSchema } from "@/lib/validacionCuenta";

// HU-16: el ciudadano define dónde quiere recibir avisos y a qué radio
// (en km, con el control deslizante del formulario).
export async function PATCH(request: NextRequest) {
  const { usuario, error } = await exigirCiudadano();
  if (error) return error;

  const resultado = suscripcionSchema.safeParse(await request.json().catch(() => null));
  if (!resultado.success) {
    return NextResponse.json(
      { errores: primerErrorPorCampo(resultado.error) },
      { status: 400 }
    );
  }

  const actualizado = await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      avisoLatitud: resultado.data.latitud,
      avisoLongitud: resultado.data.longitud,
      avisoRadioKm: resultado.data.radioKm,
    },
  });

  return NextResponse.json({
    usuario: {
      avisoLatitud: actualizado.avisoLatitud,
      avisoLongitud: actualizado.avisoLongitud,
      avisoRadioKm: actualizado.avisoRadioKm,
    },
  });
}

// Desactivar la suscripción sin borrar la cuenta.
export async function DELETE() {
  const { usuario, error } = await exigirCiudadano();
  if (error) return error;

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { avisoLatitud: null, avisoLongitud: null, avisoRadioKm: null },
  });
  return NextResponse.json({ ok: true });
}
