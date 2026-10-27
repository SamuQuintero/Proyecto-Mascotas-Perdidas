import { NextRequest, NextResponse } from "next/server";
import { exigirVeterinaria } from "@/lib/cuenta";
import { prisma } from "@/lib/db";

// HU-17: borrar una vacuna mal registrada. Solo veterinarias.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; vacunaId: string } }
) {
  const { error } = await exigirVeterinaria();
  if (error) return error;

  const vacuna = await prisma.vacuna.findUnique({ where: { id: params.vacunaId } });
  if (!vacuna || vacuna.mascotaId !== params.id) {
    return NextResponse.json({ error: "Vacuna no encontrada." }, { status: 404 });
  }

  await prisma.vacuna.delete({ where: { id: params.vacunaId } });
  return NextResponse.json({ ok: true });
}
