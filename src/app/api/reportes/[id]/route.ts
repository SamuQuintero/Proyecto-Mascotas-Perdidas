import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { exigirAdmin } from "@/lib/admin";
import {
  ErrorArchivoInvalido,
  eliminarFotoReporte,
  guardarFotoReporte,
} from "@/lib/almacenamiento";
import { camposParaGuardar } from "@/lib/reportes";
import { primerErrorPorCampo, reporteSchema } from "@/lib/validacion";

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

// HU-25: editar un reporte (solo administrador). Recibe el mismo
// multipart/form-data que la creación; la foto es opcional y solo se
// reemplaza si se envía una nueva. El tipo (perdida/encontrada) no se
// cambia al editar: se toma siempre del reporte existente.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const noAutorizado = exigirAdmin();
  if (noAutorizado) return noAutorizado;

  const existente = await prisma.reporte.findUnique({
    where: { id: params.id },
  });
  if (!existente) {
    return NextResponse.json(
      { error: "Reporte no encontrado." },
      { status: 404 }
    );
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json(
      { error: "Envía los datos del reporte como multipart/form-data." },
      { status: 400 }
    );
  }
  const foto = formData.get("foto");
  const datosCrudos = Object.fromEntries(
    Array.from(formData.entries()).filter(([clave]) => clave !== "foto")
  );

  const resultado = reporteSchema.safeParse({
    ...datosCrudos,
    tipo: existente.tipo,
  });
  if (!resultado.success) {
    return NextResponse.json(
      { errores: primerErrorPorCampo(resultado.error) },
      { status: 400 }
    );
  }

  let fotoUrl = existente.fotoUrl;
  if (foto instanceof File && foto.size > 0) {
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
  }

  const reporte = await prisma.reporte.update({
    where: { id: existente.id },
    data: { ...camposParaGuardar(resultado.data), fotoUrl },
  });

  if (fotoUrl !== existente.fotoUrl) {
    await eliminarFotoReporte(existente.fotoUrl);
  }

  return NextResponse.json({ reporte });
}
