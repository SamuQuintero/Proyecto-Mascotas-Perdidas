import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { primerErrorPorCampo, reporteSchema } from "@/lib/validacion";
import { ErrorArchivoInvalido, guardarFotoReporte } from "@/lib/almacenamiento";
import { buscarReportes } from "@/lib/busqueda";
import { leerFiltros } from "@/lib/filtros";
import { camposParaGuardar } from "@/lib/reportes";

// GET acepta los mismos filtros que la página /reportes (HU-6):
// tipo, estado, especie, tamano, zona, color, desde, hasta.
export async function GET(request: NextRequest) {
  const filtros = leerFiltros(
    Object.fromEntries(request.nextUrl.searchParams.entries())
  );

  const reportes = await buscarReportes(filtros);

  return NextResponse.json({ reportes, filtros });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json(
      { error: "Envía los datos del reporte como multipart/form-data." },
      { status: 400 }
    );
  }
  const foto = formData.get("foto");

  if (!(foto instanceof File) || foto.size === 0) {
    return NextResponse.json(
      { errores: { foto: "La fotografía es obligatoria." } },
      { status: 400 }
    );
  }

  const datosCrudos = Object.fromEntries(
    Array.from(formData.entries()).filter(([clave]) => clave !== "foto")
  );

  const resultado = reporteSchema.safeParse(datosCrudos);

  if (!resultado.success) {
    return NextResponse.json(
      { errores: primerErrorPorCampo(resultado.error) },
      { status: 400 }
    );
  }

  let fotoUrl: string;
  try {
    fotoUrl = await guardarFotoReporte(foto);
  } catch (error) {
    if (error instanceof ErrorArchivoInvalido) {
      return NextResponse.json(
        { errores: { foto: error.message } },
        { status: 400 }
      );
    }
    throw error;
  }

  const reporte = await prisma.reporte.create({
    data: {
      tipo: resultado.data.tipo,
      ...camposParaGuardar(resultado.data),
      fotoUrl,
    },
  });

  return NextResponse.json({ reporte }, { status: 201 });
}
