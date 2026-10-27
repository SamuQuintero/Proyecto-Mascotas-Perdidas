import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ErrorArchivoInvalido, guardarFotoReporte } from "@/lib/almacenamiento";
import { usuarioActual } from "@/lib/cuenta";
import { camposMascotaParaGuardar } from "@/lib/mascotas";
import { mascotaSchema, primerErrorPorCampo } from "@/lib/validacion";

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
// reportes). Recibe multipart/form-data con los datos y la foto.
export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json(
      { error: "Envía los datos del perfil como multipart/form-data." },
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

  const resultado = mascotaSchema.safeParse(
    Object.fromEntries(
      Array.from(formData.entries()).filter(([clave]) => clave !== "foto")
    )
  );
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
      return NextResponse.json({ errores: { foto: error.message } }, { status: 400 });
    }
    throw error;
  }

  const datos = resultado.data;
  // Con sesión iniciada el perfil queda a nombre de la cuenta (HU-23).
  const usuario = await usuarioActual();
  const mascota = await prisma.mascota.create({
    data: {
      ...camposMascotaParaGuardar(datos),
      usuarioId: usuario?.id ?? null,
      fotoUrl,
    },
  });

  return NextResponse.json({ mascota }, { status: 201 });
}
