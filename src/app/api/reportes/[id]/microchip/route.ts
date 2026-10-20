import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exigirVeterinaria } from "@/lib/cuenta";
import { prisma } from "@/lib/db";

const cuerpoSchema = z.object({
  microchip: z
    .string()
    .trim()
    .regex(/^[0-9A-Za-z-]{6,40}$/, "El número de microchip no parece válido.")
    .optional()
    .or(z.literal("")),
});

// HU-17: una veterinaria confirma o quita el número de microchip de un
// reporte. No se guarda quién lo escribió por nombre propio, sino la
// veterinaria (clínica) para que quede trazable en el reporte público.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { usuario, error } = await exigirVeterinaria();
  if (error) return error;

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

  const microchip = resultado.data.microchip || null;
  const reporte = await prisma.reporte.update({
    where: { id: params.id },
    data: {
      microchip,
      microchipVerificadoPor: microchip ? usuario!.nombreClinica || usuario!.nombre : null,
      microchipVerificadoEn: microchip ? new Date() : null,
    },
  });

  return NextResponse.json({ reporte });
}
