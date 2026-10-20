import { NextRequest, NextResponse } from "next/server";
import { extraerColorDominante } from "@/lib/colorImagen";
import { familiasDeColor } from "@/lib/coincidencias";
import { prisma } from "@/lib/db";
import { FOTO_TIPOS_PERMITIDOS } from "@/lib/validacion";

// HU-10: el hallador sube una foto de la mascota que encontró (sin
// necesidad de publicar un reporte) y recibe las mascotas PERDIDA activas
// cuyo color escrito coincide con el color dominante de la foto. Es una
// comparación local por color, no reconocimiento del animal.
export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null);
  const foto = formData?.get("foto");

  if (!(foto instanceof File) || foto.size === 0) {
    return NextResponse.json({ error: "Sube una fotografía para buscar." }, { status: 400 });
  }
  if (!FOTO_TIPOS_PERMITIDOS.includes(foto.type)) {
    return NextResponse.json(
      { error: "Formato no soportado. Usa JPG, PNG o WEBP." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await foto.arrayBuffer());
  const { familia, rgb } = await extraerColorDominante(buffer);

  const especie = formData!.get("especie");
  const candidatos = await prisma.reporte.findMany({
    where: {
      tipo: "PERDIDA",
      estado: "ACTIVO",
      ...(typeof especie === "string" && especie ? { especie } : {}),
    },
    orderBy: { creadoEn: "desc" },
  });

  const coincidencias = candidatos.filter((reporte) =>
    familiasDeColor(reporte.color).has(familia)
  );

  return NextResponse.json({
    colorDetectado: familia,
    colorRgb: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
    reportes: coincidencias.map((r) => ({
      id: r.id,
      titulo: r.nombre || r.especie,
      especie: r.especie,
      color: r.color,
      zona: r.zona,
      fotoUrl: r.fotoUrl,
    })),
  });
}
