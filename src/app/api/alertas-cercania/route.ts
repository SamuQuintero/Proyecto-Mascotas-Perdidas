import { NextResponse } from "next/server";
import { usuarioActual } from "@/lib/cuenta";
import { distanciaKm, formatearDistancia } from "@/lib/coincidencias";
import { prisma } from "@/lib/db";

// HU-16: avisos de mascotas perdidas cerca de un ciudadano suscrito, sin
// que tenga que haber publicado ningún reporte propio (a diferencia de
// /api/alertas, que solo mira los reportes creados desde este dispositivo).
export async function GET() {
  const usuario = await usuarioActual();
  if (!usuario || usuario.rol !== "CIUDADANO") {
    return NextResponse.json({ suscrito: false, reportes: [] });
  }

  const { avisoLatitud, avisoLongitud, avisoRadioKm } = usuario;
  if (avisoLatitud === null || avisoLongitud === null || avisoRadioKm === null) {
    return NextResponse.json({ suscrito: false, reportes: [] });
  }

  const centro = { latitud: avisoLatitud, longitud: avisoLongitud };
  const perdidas = await prisma.reporte.findMany({
    where: { tipo: "PERDIDA", estado: "ACTIVO" },
    orderBy: { renovadoEn: "desc" },
  });

  const cercanos = perdidas
    .map((reporte) => ({ reporte, distanciaKm: distanciaKm(centro, reporte) }))
    .filter((r) => r.distanciaKm <= avisoRadioKm)
    .sort((a, b) => a.distanciaKm - b.distanciaKm)
    .slice(0, 30);

  return NextResponse.json({
    suscrito: true,
    radioKm: avisoRadioKm,
    reportes: cercanos.map(({ reporte, distanciaKm: d }) => ({
      id: reporte.id,
      titulo: reporte.nombre || reporte.especie,
      color: reporte.color,
      zona: reporte.zona,
      fotoUrl: reporte.fotoUrl,
      creadoEn: reporte.creadoEn,
      // HU-19: si el dueño lo renovó, vuelve a avisarse como novedad.
      renovadoEn: reporte.renovadoEn,
      renovado: reporte.renovaciones > 0,
      distanciaKm: d,
      distanciaTexto: formatearDistancia(d),
    })),
  });
}
