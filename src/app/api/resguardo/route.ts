import { NextRequest, NextResponse } from "next/server";
import { exigirRefugio } from "@/lib/cuenta";
import { prisma } from "@/lib/db";
import { ErrorArchivoInvalido, guardarFotoReporte } from "@/lib/almacenamiento";
import { animalResguardoSchema } from "@/lib/resguardo";
import { primerErrorPorCampo } from "@/lib/validacion";
import { instanteColombia } from "@/lib/formato";

// HU-20: un refugio publica un animal que tiene bajo resguardo. Recibe
// multipart/form-data (datos + foto), como los reportes.
export async function POST(request: NextRequest) {
  const { usuario, error } = await exigirRefugio();
  if (error) return error;

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json(
      { error: "Envía los datos como multipart/form-data." },
      { status: 400 }
    );
  }

  const foto = formData.get("foto");
  if (!(foto instanceof File) || foto.size === 0) {
    return NextResponse.json({ errores: { foto: "La fotografía es obligatoria." } }, { status: 400 });
  }

  const resultado = animalResguardoSchema.safeParse(
    Object.fromEntries(Array.from(formData.entries()).filter(([clave]) => clave !== "foto"))
  );
  if (!resultado.success) {
    return NextResponse.json({ errores: primerErrorPorCampo(resultado.error) }, { status: 400 });
  }

  let fotoUrl: string;
  try {
    fotoUrl = await guardarFotoReporte(foto);
  } catch (e) {
    if (e instanceof ErrorArchivoInvalido) {
      return NextResponse.json({ errores: { foto: e.message } }, { status: 400 });
    }
    throw e;
  }

  const datos = resultado.data;
  const animal = await prisma.animalResguardo.create({
    data: {
      refugioId: usuario.id,
      especie: datos.especie,
      nombre: datos.nombre || null,
      raza: datos.raza || null,
      color: datos.color,
      tamano: datos.tamano,
      senasParticulares: datos.senasParticulares || null,
      fotoUrl,
      desde: instanteColombia(datos.desde),
    },
  });

  return NextResponse.json({ animal }, { status: 201 });
}
