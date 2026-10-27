import { NextRequest, NextResponse } from "next/server";
import { sesionGestion } from "@/lib/cuenta";
import { prisma } from "@/lib/db";
import { puedeGestionar } from "@/lib/propiedad";
import { puedeRenovar } from "@/lib/renovacion";

// HU-19: el dueño (o el admin) confirma que el caso sigue abierto. El
// reporte vuelve a difundirse: sube en el listado y reaparece en los avisos
// de cercanía de quienes están suscritos a su zona.
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const reporte = await prisma.reporte.findUnique({ where: { id: params.id } });
  if (!reporte) {
    return NextResponse.json({ error: "Reporte no encontrado." }, { status: 404 });
  }

  if (!puedeGestionar(reporte, await sesionGestion())) {
    return NextResponse.json(
      { error: "Solo quien publicó el reporte con su cuenta puede renovarlo." },
      { status: 403 }
    );
  }

  if (reporte.estado !== "ACTIVO") {
    return NextResponse.json({ error: "Este caso ya está cerrado." }, { status: 409 });
  }
  if (!puedeRenovar(reporte)) {
    return NextResponse.json(
      { error: "Ya se difundió hoy. Puedes renovarlo de nuevo mañana." },
      { status: 429 }
    );
  }

  const actualizado = await prisma.reporte.update({
    where: { id: reporte.id },
    data: { renovadoEn: new Date(), renovaciones: { increment: 1 } },
  });
  return NextResponse.json({
    renovadoEn: actualizado.renovadoEn,
    renovaciones: actualizado.renovaciones,
  });
}
