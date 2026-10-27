import { NextRequest, NextResponse } from "next/server";
import { servicioResguardo } from "@/composicion";
import { responder } from "@/infraestructura/respuestasHttp";
import { exigirRefugio } from "@/lib/cuenta";

// HU-20: marcar un animal como entregado (a su dueño o adoptado): deja de
// aparecer en el listado público. Cada refugio solo gestiona los suyos.
export async function PATCH(_request: NextRequest, { params }: { params: { id: string } }) {
  const { usuario, error } = await exigirRefugio();
  if (error) return error;

  const resultado = await servicioResguardo.marcarEntregado({
    id: params.id,
    refugioId: usuario.id,
  });
  return responder(resultado, () => NextResponse.json({ ok: true }));
}

// Borrar una publicación hecha por error.
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const { usuario, error } = await exigirRefugio();
  if (error) return error;

  const resultado = await servicioResguardo.eliminar({ id: params.id, refugioId: usuario.id });
  return responder(resultado, () => NextResponse.json({ ok: true }));
}
