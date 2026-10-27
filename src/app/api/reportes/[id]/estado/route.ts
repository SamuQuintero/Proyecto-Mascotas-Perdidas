import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { servicioReportes } from "@/composicion";
import { responder } from "@/infraestructura/respuestasHttp";
import { sesionGestion } from "@/lib/cuenta";

const cuerpoSchema = z.object({
  estado: z.enum(["ACTIVO", "REENCONTRADA"]),
});

// HU-12: marcar un reporte como "reencontrada" (o reabrirlo si se marcó
// por error). El administrador puede todo; el dueño del reporte (la cuenta
// con la que se publicó) solo puede marcarlo como reencontrada. La regla
// vive en ServicioReportes.cambiarEstado.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const resultado = cuerpoSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!resultado.success) {
    return NextResponse.json(
      { error: "Estado inválido. Usa ACTIVO o REENCONTRADA." },
      { status: 400 }
    );
  }

  const cambio = await servicioReportes.cambiarEstado({
    id: params.id,
    estado: resultado.data.estado,
    sesion: await sesionGestion(),
  });
  return responder(cambio, (reporte) => NextResponse.json({ reporte }));
}
