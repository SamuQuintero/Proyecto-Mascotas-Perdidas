import { NextRequest, NextResponse } from "next/server";
import { calcularAlertasMascota } from "@/lib/coincidencias";
import { prisma } from "@/lib/db";

// HU-10 (redefinida): "si una persona reporta las mismas características
// que tiene mi mascota, que me dé una alerta de advertencia". El navegador
// recuerda los perfiles de mascota (HU-8) creados desde este dispositivo
// (misMascotas en dispositivo.ts); esta ruta compara cada una contra los
// hallazgos (ENCONTRADA) activos y devuelve las coincidencias.
export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => /^[a-z0-9]{10,40}$/.test(id))
    .slice(0, 20);

  if (ids.length === 0) {
    return NextResponse.json({ mascotas: [] });
  }

  const [mascotas, hallazgos] = await Promise.all([
    prisma.mascota.findMany({ where: { id: { in: ids } } }),
    prisma.reporte.findMany({ where: { tipo: "ENCONTRADA", estado: "ACTIVO" } }),
  ]);

  return NextResponse.json({
    mascotas: mascotas.map((mascota) => ({
      id: mascota.id,
      nombre: mascota.nombre,
      alertas: calcularAlertasMascota(mascota, hallazgos).map((alerta) => ({
        id: alerta.reporte.id,
        titulo: alerta.reporte.nombre || alerta.reporte.especie,
        color: alerta.reporte.color,
        zona: alerta.reporte.zona,
        fotoUrl: alerta.reporte.fotoUrl,
        creadoEn: alerta.reporte.creadoEn,
        puntaje: alerta.puntaje,
        razones: alerta.razones,
      })),
    })),
  });
}
