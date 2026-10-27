import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { invalidar, ETIQUETA_REPORTES } from "@/lib/cache";
import { sesionGestion } from "@/lib/cuenta";
import { puedeCambiarEstado } from "@/lib/propiedad";

const cuerpoSchema = z.object({
  estado: z.enum(["ACTIVO", "REENCONTRADA"]),
});

// HU-12: marcar un reporte como "reencontrada" (o reabrirlo si se marcó
// por error). El administrador puede todo; el dueño del reporte (la cuenta
// con la que se publicó) solo puede marcarlo como reencontrada.
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

  const existente = await prisma.reporte.findUnique({
    where: { id: params.id },
    select: { id: true, usuarioId: true },
  });
  if (!existente) {
    return NextResponse.json(
      { error: "Reporte no encontrado." },
      { status: 404 }
    );
  }

  const { estado } = resultado.data;

  const sesion = await sesionGestion();
  if (!puedeCambiarEstado(existente, sesion, estado)) {
    const sinSesion = !sesion.esAdmin && sesion.usuarioId === null;
    return NextResponse.json(
      {
        error: sinSesion
          ? "Inicia sesión para cerrar este caso."
          : "Solo el administrador o quien publicó el reporte puede cerrar el caso.",
      },
      { status: sinSesion ? 401 : 403 }
    );
  }

  const reporte = await prisma.reporte.update({
    where: { id: existente.id },
    data: {
      estado,
      reencontradaEn: estado === "REENCONTRADA" ? new Date() : null,
    },
  });

  invalidar(ETIQUETA_REPORTES);
  return NextResponse.json({ reporte });
}
