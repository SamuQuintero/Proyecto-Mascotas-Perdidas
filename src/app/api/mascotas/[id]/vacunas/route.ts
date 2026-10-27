import { NextRequest, NextResponse } from "next/server";
import { exigirVeterinaria } from "@/lib/cuenta";
import { prisma } from "@/lib/db";
import { primerErrorPorCampo } from "@/lib/validacion";
import { vacunaSchema } from "@/lib/validacionVacuna";

// HU-17: carnet de vacunas de una mascota. Leer es público (es el carnet
// digital: el dueño, o quien escanee el QR, debe poder verlo); escribir
// requiere sesión de veterinaria.
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const existente = await prisma.mascota.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!existente) {
    return NextResponse.json({ error: "Mascota no encontrada." }, { status: 404 });
  }

  const vacunas = await prisma.vacuna.findMany({
    where: { mascotaId: params.id },
    orderBy: { fecha: "desc" },
  });
  return NextResponse.json({ vacunas });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { usuario, error } = await exigirVeterinaria();
  if (error) return error;

  const resultado = vacunaSchema.safeParse(await request.json().catch(() => null));
  if (!resultado.success) {
    return NextResponse.json(
      { errores: primerErrorPorCampo(resultado.error) },
      { status: 400 }
    );
  }

  const existente = await prisma.mascota.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!existente) {
    return NextResponse.json({ error: "Mascota no encontrada." }, { status: 404 });
  }

  const vacuna = await prisma.vacuna.create({
    data: {
      mascotaId: params.id,
      nombre: resultado.data.nombre,
      fecha: new Date(`${resultado.data.fecha}T12:00:00.000Z`),
      veterinaria: usuario!.nombreClinica || usuario!.nombre,
    },
  });

  return NextResponse.json({ vacuna }, { status: 201 });
}
