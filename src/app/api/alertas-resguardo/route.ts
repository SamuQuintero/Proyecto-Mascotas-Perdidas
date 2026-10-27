import { NextRequest, NextResponse } from "next/server";
import { alertasResguardoDeReportes } from "@/lib/alertasResguardo";
import { prisma } from "@/lib/db";

// GET /api/alertas-resguardo?ids=a,b
// Animales en resguardo (HU-20) que se parecen a las mascotas perdidas
// publicadas desde este dispositivo. La campana del navbar la consulta.
export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => /^[a-z0-9]{10,40}$/.test(id))
    .slice(0, 30);
  if (ids.length === 0) return NextResponse.json({ reportes: [] });

  const reportes = await prisma.reporte.findMany({
    where: { id: { in: ids }, tipo: "PERDIDA", estado: "ACTIVO" },
  });
  const alertas = await alertasResguardoDeReportes(reportes);

  return NextResponse.json({
    reportes: reportes
      .map((r) => ({
        id: r.id,
        titulo: r.nombre || r.especie,
        animales: alertas.get(r.id) ?? [],
      }))
      .filter((r) => r.animales.length > 0),
  });
}
