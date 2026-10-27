import { NextResponse } from "next/server";
import { usuarioActual } from "@/lib/cuenta";
import { prisma } from "@/lib/db";
import { diasSinRenovar, necesitaRecordatorio } from "@/lib/renovacion";

// HU-19: reportes de pérdida del usuario que llevan una semana o más sin
// confirmarse. La campana del navbar los muestra como "¿sigue perdida?".
export async function GET() {
  const usuario = await usuarioActual();
  if (!usuario) return NextResponse.json({ recordatorios: [] });

  const propios = await prisma.reporte.findMany({
    where: { usuarioId: usuario.id, tipo: "PERDIDA", estado: "ACTIVO" },
    orderBy: { renovadoEn: "asc" },
  });

  const ahora = new Date();
  return NextResponse.json({
    recordatorios: propios
      .filter((reporte) => necesitaRecordatorio(reporte, ahora))
      .map((reporte) => ({
        id: reporte.id,
        titulo: reporte.nombre || reporte.especie,
        fotoUrl: reporte.fotoUrl,
        renovadoEn: reporte.renovadoEn,
        dias: diasSinRenovar(reporte.renovadoEn, ahora),
      })),
  });
}
