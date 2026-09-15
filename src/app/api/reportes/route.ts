import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { primerErrorPorCampo, reporteSchema } from "@/lib/validacion";
import { ErrorArchivoInvalido, guardarFotoReporte } from "@/lib/almacenamiento";

export async function GET(request: NextRequest) {
  const tipo = request.nextUrl.searchParams.get("tipo");

  const reportes = await prisma.reporte.findMany({
    where: tipo === "PERDIDA" || tipo === "ENCONTRADA" ? { tipo } : undefined,
    orderBy: { creadoEn: "desc" },
  });

  return NextResponse.json({ reportes });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
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

  const datos = resultado.data;

  const reporte = await prisma.reporte.create({
    data: {
      tipo: datos.tipo,
      especie: datos.especie,
      color: datos.color,
      tamano: datos.tamano,
      zona: datos.zona,
      fecha: new Date(datos.fecha),
      raza: datos.raza || null,
      nombre: datos.nombre || null,
      tieneCollar:
        datos.tieneCollar === "SI"
          ? true
          : datos.tieneCollar === "NO"
            ? false
            : null,
      senasParticulares: datos.senasParticulares || null,
      fotoUrl,
      latitud: datos.latitud,
      longitud: datos.longitud,
      contactoNombre: datos.contactoNombre || null,
      contactoTelefono: datos.contactoTelefono || null,
      contactoEmail: datos.contactoEmail || null,
      reportanteAnonimo: datos.reportanteAnonimo ?? false,
    },
  });

  return NextResponse.json({ reporte }, { status: 201 });
}
