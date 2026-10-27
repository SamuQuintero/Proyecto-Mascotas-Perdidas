import { NextRequest, NextResponse } from "next/server";
import { servicioReportes } from "@/composicion";
import { leerFormulario } from "@/infraestructura/formulario";
import { responder } from "@/infraestructura/respuestasHttp";
import { buscarReportes } from "@/lib/busqueda";
import { usuarioActual } from "@/lib/cuenta";
import { leerFiltros } from "@/lib/filtros";

// GET acepta los mismos filtros que la página /reportes (HU-6):
// tipo, estado, especie, tamano, zona, color, desde, hasta.
export async function GET(request: NextRequest) {
  const filtros = leerFiltros(
    Object.fromEntries(request.nextUrl.searchParams.entries())
  );

  const reportes = await buscarReportes(filtros);

  return NextResponse.json({ reportes, filtros });
}

// Ruta delgada: lee la petición, delega en el caso de uso y traduce el
// resultado a HTTP. Las reglas viven en ServicioReportes.
export async function POST(request: NextRequest) {
  const formulario = await leerFormulario(request);
  if (!formulario) {
    return NextResponse.json(
      { error: "Envía los datos del reporte como multipart/form-data." },
      { status: 400 }
    );
  }

  // Con sesión iniciada el reporte queda a nombre de la cuenta: así su
  // dueño puede renovarlo (HU-19) y editarlo (HU-23).
  const usuario = await usuarioActual();

  const resultado = await servicioReportes.publicar({
    datos: formulario.datos,
    foto: formulario.foto,
    usuarioId: usuario?.id ?? null,
  });
  return responder(resultado, (reporte) => NextResponse.json({ reporte }, { status: 201 }));
}
