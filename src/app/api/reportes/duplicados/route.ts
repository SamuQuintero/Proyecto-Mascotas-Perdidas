import { NextRequest, NextResponse } from "next/server";
import { calcularDuplicados } from "@/lib/coincidencias";
import { prisma } from "@/lib/db";
import { serializarReporte } from "@/lib/tipos";

// HU-15: el formulario llama esta ruta justo antes de publicar, con los
// datos que la persona ya escribió, para advertir si existe un reporte muy
// parecido del mismo tipo (misma especie, color, a menos de 1 km y a pocos
// días de diferencia). No bloquea la publicación, solo advierte.
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const tipo = p.get("tipo");
  const especie = p.get("especie");
  const color = p.get("color");
  const fecha = p.get("fecha");
  const latitud = Number(p.get("latitud"));
  const longitud = Number(p.get("longitud"));

  if (
    (tipo !== "PERDIDA" && tipo !== "ENCONTRADA") ||
    !especie ||
    !color ||
    !fecha ||
    Number.isNaN(Date.parse(fecha)) ||
    !Number.isFinite(latitud) ||
    !Number.isFinite(longitud)
  ) {
    return NextResponse.json({ duplicados: [] });
  }

  const tipoValido = tipo as "PERDIDA" | "ENCONTRADA";
  const candidatos = (
    await prisma.reporte.findMany({ where: { tipo: tipoValido, estado: "ACTIVO" } })
  ).map(serializarReporte);

  const base = {
    id: "__nuevo__",
    tipo: tipoValido,
    especie,
    color,
    tamano: "MEDIANO" as const, // el tamaño no decide duplicado; se ignora aquí
    latitud,
    longitud,
    fecha,
  };

  const duplicados = calcularDuplicados(base, candidatos).slice(0, 5);

  return NextResponse.json({
    duplicados: duplicados.map((d) => ({
      id: d.reporte.id,
      titulo: d.reporte.nombre || d.reporte.especie,
      color: d.reporte.color,
      zona: d.reporte.zona,
      fotoUrl: d.reporte.fotoUrl,
      razones: d.razones,
    })),
  });
}
