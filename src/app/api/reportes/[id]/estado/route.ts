import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { exigirAdmin } from "@/lib/admin";

const cuerpoSchema = z.object({
  estado: z.enum(["ACTIVO", "REENCONTRADA"]),
});

// HU-12: marcar un reporte como "reencontrada" (o reabrirlo si se marcó
// por error). Solo administrador.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const noAutorizado = exigirAdmin();
  if (noAutorizado) return noAutorizado;

  const resultado = cuerpoSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!resultado.success) {
    return NextResponse.json(
      { error: "Estado inválido. Usa ACTIVO o REENCONTRADA." },
      { status: 400 }
    );
  }

  const existente = await prisma.reporte.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!existente) {
    return NextResponse.json(
      { error: "Reporte no encontrado." },
      { status: 404 }
    );
  }

  const { estado } = resultado.data;
  const reporte = await prisma.reporte.update({
    where: { id: existente.id },
    data: {
      estado,
      reencontradaEn: estado === "REENCONTRADA" ? new Date() : null,
    },
  });

  return NextResponse.json({ reporte });
}
