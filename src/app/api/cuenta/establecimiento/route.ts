import { NextRequest, NextResponse } from "next/server";
import { exigirEstablecimiento } from "@/lib/cuenta";
import { prisma } from "@/lib/db";
import { ETIQUETA_ESTABLECIMIENTOS, ETIQUETA_RESGUARDO, invalidar } from "@/lib/cache";
import { primerErrorPorCampo } from "@/lib/validacion";
import { establecimientoSchema } from "@/lib/validacionCuenta";

// HU-18: la veterinaria o el refugio define su teléfono, dirección,
// ubicación y si recibe mascotas encontradas (si aparece en el directorio).
export async function PATCH(request: NextRequest) {
  const { usuario, error } = await exigirEstablecimiento();
  if (error) return error;

  const resultado = establecimientoSchema.safeParse(await request.json().catch(() => null));
  if (!resultado.success) {
    return NextResponse.json(
      { errores: primerErrorPorCampo(resultado.error) },
      { status: 400 }
    );
  }

  const datos = resultado.data;
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      telefono: datos.telefono || null,
      direccion: datos.direccion || null,
      latitud: datos.latitud ?? null,
      longitud: datos.longitud ?? null,
      recibeEncontradas: datos.recibeEncontradas,
    },
  });

  // El refugio de un animal en resguardo muestra su teléfono: también se actualiza.
  invalidar(ETIQUETA_ESTABLECIMIENTOS, ETIQUETA_RESGUARDO);
  return NextResponse.json({ ok: true });
}
