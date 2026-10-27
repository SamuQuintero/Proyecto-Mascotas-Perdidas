import { NextRequest, NextResponse } from "next/server";
import { servicioReportes } from "@/composicion";
import { responder } from "@/infraestructura/respuestasHttp";
import { sesionGestion } from "@/lib/cuenta";

// HU-19: el dueño (o el admin) confirma que el caso sigue abierto. El
// reporte vuelve a difundirse: sube en el listado y reaparece en los avisos
// de cercanía de quienes están suscritos a su zona. La regla (dueño, caso
// abierto, no más de una vez al día) vive en ServicioReportes.renovar.
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const resultado = await servicioReportes.renovar({
    id: params.id,
    sesion: await sesionGestion(),
  });
  return responder(resultado, (reporte) =>
    NextResponse.json({
      renovadoEn: reporte.renovadoEn,
      renovaciones: reporte.renovaciones,
    })
  );
}
