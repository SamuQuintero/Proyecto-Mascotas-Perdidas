import { NextRequest, NextResponse } from "next/server";
import { alertasDeReportes } from "@/lib/alertas";
import { prisma } from "@/lib/db";
import { serializarReporte } from "@/lib/tipos";

// GET /api/alertas?ids=a,b,c
// Alertas (HU-4 coincidencias, HU-7 cercanía) de los reportes publicados
// desde este dispositivo. Como no hay cuentas, el navegador guarda los ids
// de los reportes que creó y la campana del navbar consulta esta ruta.
export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => /^[a-z0-9]{10,40}$/.test(id))
    .slice(0, 30);

  if (ids.length === 0) {
    return NextResponse.json({ reportes: [] });
  }

  const reportes = (
    await prisma.reporte.findMany({ where: { id: { in: ids } } })
  ).map(serializarReporte);
  const alertas = await alertasDeReportes(reportes);

  return NextResponse.json({
    reportes: reportes.map((reporte) => ({
      id: reporte.id,
      tipo: reporte.tipo,
      estado: reporte.estado,
      titulo: reporte.nombre || reporte.especie,
      alertas: (alertas.get(reporte.id) ?? []).map((alerta) => ({
        id: alerta.reporte.id,
        titulo: alerta.reporte.nombre || alerta.reporte.especie,
        color: alerta.reporte.color,
        zona: alerta.reporte.zona,
        fotoUrl: alerta.reporte.fotoUrl,
        creadoEn: alerta.reporte.creadoEn,
        esCoincidencia: alerta.esCoincidencia,
        esCercano: alerta.esCercano,
        distanciaKm: alerta.distanciaKm,
        puntaje: alerta.puntaje,
      })),
    })),
  });
}
