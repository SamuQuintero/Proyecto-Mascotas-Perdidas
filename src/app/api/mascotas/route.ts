import { NextRequest, NextResponse } from "next/server";
import { servicioMascotas } from "@/composicion";
import { leerFormulario } from "@/infraestructura/formulario";
import { responder } from "@/infraestructura/respuestasHttp";
import { usuarioActual } from "@/lib/cuenta";
import { prisma } from "@/lib/db";

// GET /api/mascotas?ids=a,b — resumen de los perfiles creados desde este
// dispositivo (para listarlos en /mascotas).
export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .filter((id) => /^[a-z0-9]{10,40}$/.test(id))
    .slice(0, 20);
  const mascotas = ids.length
    ? await prisma.mascota.findMany({
        where: { id: { in: ids } },
        select: { id: true, nombre: true, especie: true, fotoUrl: true },
      })
    : [];
  return NextResponse.json({ mascotas });
}

// HU-8: crear el perfil digital de una mascota (sin cuenta, como los
// reportes). Recibe multipart/form-data con los datos y la foto. Las reglas
// viven en ServicioMascotas.
export async function POST(request: NextRequest) {
  const formulario = await leerFormulario(request);
  if (!formulario) {
    return NextResponse.json(
      { error: "Envía los datos del perfil como multipart/form-data." },
      { status: 400 }
    );
  }

  // Con sesión iniciada el perfil queda a nombre de la cuenta (HU-23).
  const usuario = await usuarioActual();

  const resultado = await servicioMascotas.crear({
    datos: formulario.datos,
    foto: formulario.foto,
    usuarioId: usuario?.id ?? null,
  });
  return responder(resultado, (mascota) => NextResponse.json({ mascota }, { status: 201 }));
}
