import { NextRequest, NextResponse } from "next/server";
import { sesionGestion } from "@/lib/cuenta";
import { prisma } from "@/lib/db";
import {
  ErrorArchivoInvalido,
  eliminarFotoReporte,
  guardarFotoReporte,
} from "@/lib/almacenamiento";
import { camposMascotaParaGuardar } from "@/lib/mascotas";
import { puedeGestionar } from "@/lib/propiedad";
import { mascotaSchema, primerErrorPorCampo } from "@/lib/validacion";

// HU-23: el dueño (la cuenta con la que se creó el perfil) o el admin
// actualiza los datos de contacto, las señas o la foto de la mascota. La foto
// es opcional y solo se reemplaza si se envía una nueva.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const existente = await prisma.mascota.findUnique({ where: { id: params.id } });
  if (!existente) {
    return NextResponse.json({ error: "Mascota no encontrada." }, { status: 404 });
  }

  const sesion = await sesionGestion();
  if (!puedeGestionar(existente, sesion)) {
    const sinSesion = !sesion.esAdmin && sesion.usuarioId === null;
    return NextResponse.json(
      {
        error: sinSesion
          ? "Inicia sesión para editar este perfil."
          : "Solo quien creó el perfil puede editarlo.",
      },
      { status: sinSesion ? 401 : 403 }
    );
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json(
      { error: "Envía los datos del perfil como multipart/form-data." },
      { status: 400 }
    );
  }

  const foto = formData.get("foto");
  const resultado = mascotaSchema.safeParse(
    Object.fromEntries(Array.from(formData.entries()).filter(([clave]) => clave !== "foto"))
  );
  if (!resultado.success) {
    return NextResponse.json({ errores: primerErrorPorCampo(resultado.error) }, { status: 400 });
  }

  let fotoUrl = existente.fotoUrl;
  if (foto instanceof File && foto.size > 0) {
    try {
      fotoUrl = await guardarFotoReporte(foto);
    } catch (error) {
      if (error instanceof ErrorArchivoInvalido) {
        return NextResponse.json({ errores: { foto: error.message } }, { status: 400 });
      }
      throw error;
    }
  }

  const mascota = await prisma.mascota.update({
    where: { id: existente.id },
    data: { ...camposMascotaParaGuardar(resultado.data), fotoUrl },
  });

  if (fotoUrl !== existente.fotoUrl) {
    await eliminarFotoReporte(existente.fotoUrl);
  }

  return NextResponse.json({ mascota });
}
