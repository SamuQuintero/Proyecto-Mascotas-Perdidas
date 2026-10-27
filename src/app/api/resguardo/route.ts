import { NextRequest, NextResponse } from "next/server";
import { servicioResguardo } from "@/composicion";
import { leerFormulario } from "@/infraestructura/formulario";
import { responder } from "@/infraestructura/respuestasHttp";
import { exigirRefugio } from "@/lib/cuenta";

// HU-20: un refugio publica un animal que tiene bajo resguardo. Recibe
// multipart/form-data (datos + foto), como los reportes. Las reglas viven en
// ServicioResguardo.
export async function POST(request: NextRequest) {
  const { usuario, error } = await exigirRefugio();
  if (error) return error;

  const formulario = await leerFormulario(request);
  if (!formulario) {
    return NextResponse.json(
      { error: "Envía los datos como multipart/form-data." },
      { status: 400 }
    );
  }

  const resultado = await servicioResguardo.publicar({
    refugioId: usuario.id,
    datos: formulario.datos,
    foto: formulario.foto,
  });
  return responder(resultado, (animal) => NextResponse.json({ animal }, { status: 201 }));
}
