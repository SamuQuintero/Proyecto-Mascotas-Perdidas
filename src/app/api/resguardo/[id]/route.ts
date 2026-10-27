import { NextRequest, NextResponse } from "next/server";
import { exigirRefugio } from "@/lib/cuenta";
import { prisma } from "@/lib/db";
import { eliminarFotoReporte } from "@/lib/almacenamiento";

// Cada refugio solo gestiona sus propios animales.
async function animalPropio(id: string, refugioId: string) {
  const animal = await prisma.animalResguardo.findUnique({ where: { id } });
  return animal && animal.refugioId === refugioId ? animal : null;
}

// HU-20: marcar un animal como entregado (a su dueño o adoptado): deja de
// aparecer en el listado público de animales en resguardo.
export async function PATCH(_request: NextRequest, { params }: { params: { id: string } }) {
  const { usuario, error } = await exigirRefugio();
  if (error) return error;

  const animal = await animalPropio(params.id, usuario.id);
  if (!animal) {
    return NextResponse.json({ error: "Animal no encontrado." }, { status: 404 });
  }

  await prisma.animalResguardo.update({
    where: { id: animal.id },
    data: { estado: "ENTREGADO", entregadoEn: new Date() },
  });
  return NextResponse.json({ ok: true });
}

// Borrar una publicación hecha por error.
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const { usuario, error } = await exigirRefugio();
  if (error) return error;

  const animal = await animalPropio(params.id, usuario.id);
  if (!animal) {
    return NextResponse.json({ error: "Animal no encontrado." }, { status: 404 });
  }

  await prisma.animalResguardo.delete({ where: { id: animal.id } });
  await eliminarFotoReporte(animal.fotoUrl);
  return NextResponse.json({ ok: true });
}
