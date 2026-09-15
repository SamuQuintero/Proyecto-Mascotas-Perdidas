import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const reporte = await prisma.reporte.findUnique({
    where: { id: params.id },
  });

  if (!reporte) {
    return NextResponse.json(
      { error: "Reporte no encontrado." },
      { status: 404 }
    );
  }

  return NextResponse.json({ reporte });
}
