import { NextRequest, NextResponse } from "next/server";
import { servicioReportes } from "@/composicion";
import { leerFormulario } from "@/infraestructura/formulario";
import { responder } from "@/infraestructura/respuestasHttp";
import { prisma } from "@/lib/db";
import { sesionGestion } from "@/lib/cuenta";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const reporte = await prisma.reporte.findUnique({
    where: { id: params.id },
  });

  if (!reporte) {
    return NextResponse.json(
      { error: "Reporte no encontrado." },
      { status: 404 }
    );
  }

  return NextResponse.json({ reporte });
}

// HU-25 / HU-23: editar un reporte (el administrador, o su dueño: la cuenta
// con la que se publicó). Recibe el mismo multipart/form-data que la
// creación; la foto es opcional. Las reglas viven en ServicioReportes.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const formulario = await leerFormulario(request);
  if (!formulario) {
    return NextResponse.json(
      { error: "Envía los datos del reporte como multipart/form-data." },
      { status: 400 }
    );
  }

  const resultado = await servicioReportes.editar({
    id: params.id,
    datos: formulario.datos,
    foto: formulario.foto,
    sesion: await sesionGestion(),
  });
  return responder(resultado, (reporte) => NextResponse.json({ reporte }));
}
