import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

// HU-11: mensajes dentro de la plataforma, ligados al reporte (no a una
// cuenta). El hilo es tan público como el reporte mismo: cualquiera con el
// enlace puede leerlo y escribir, sin exponer teléfono ni dirección.

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const existente = await prisma.reporte.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!existente) {
    return NextResponse.json({ error: "Reporte no encontrado." }, { status: 404 });
  }

  const mensajes = await prisma.mensaje.findMany({
    where: { reporteId: params.id },
    orderBy: { creadoEn: "asc" },
  });
  return NextResponse.json({ mensajes });
}

const cuerpoSchema = z.object({
  autor: z.string().trim().max(60).optional().or(z.literal("")),
  texto: z
    .string()
    .trim()
    .min(1, "Escribe un mensaje antes de enviarlo.")
    .max(500, "Máximo 500 caracteres."),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const resultado = cuerpoSchema.safeParse(await request.json().catch(() => null));
  if (!resultado.success) {
    return NextResponse.json(
      { error: resultado.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }

  const existente = await prisma.reporte.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!existente) {
    return NextResponse.json({ error: "Reporte no encontrado." }, { status: 404 });
  }

  const mensaje = await prisma.mensaje.create({
    data: {
      reporteId: params.id,
      autor: resultado.data.autor || "Anónimo",
      texto: resultado.data.texto,
    },
  });

  return NextResponse.json({ mensaje }, { status: 201 });
}
