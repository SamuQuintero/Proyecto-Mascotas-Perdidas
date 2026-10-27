import { NextRequest, NextResponse } from "next/server";
import { servicioMascotas } from "@/composicion";
import { leerFormulario } from "@/infraestructura/formulario";
import { responder } from "@/infraestructura/respuestasHttp";
import { sesionGestion } from "@/lib/cuenta";

// HU-23: el dueño (la cuenta con la que se creó el perfil) o el admin
// actualiza los datos de contacto, las señas o la foto de la mascota. La foto
// es opcional y solo se reemplaza si se envía una nueva. Las reglas viven en
// ServicioMascotas.editar.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const formulario = await leerFormulario(request);
  if (!formulario) {
    return NextResponse.json(
      { error: "Envía los datos del perfil como multipart/form-data." },
      { status: 400 }
    );
  }

  const resultado = await servicioMascotas.editar({
    id: params.id,
    datos: formulario.datos,
    foto: formulario.foto,
    sesion: await sesionGestion(),
  });
  return responder(resultado, (mascota) => NextResponse.json({ mascota }));
}
