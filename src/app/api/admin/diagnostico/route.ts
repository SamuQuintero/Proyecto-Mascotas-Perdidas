import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { exigirAdmin } from "@/lib/admin";

// Diagnóstico para el administrador: qué almacén de fotos está activo y si
// Supabase Storage y la base de datos responden. Nunca devuelve claves.
export async function GET() {
  const denegado = await exigirAdmin();
  if (denegado) return denegado;

  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const clave = process.env.SUPABASE_SERVICE_KEY;
  const informe: Record<string, unknown> = {
    almacenDeFotos: url && clave ? "supabase" : "disco (no persistente en Vercel)",
    supabaseUrlDefinida: !!url,
    supabaseClaveDefinida: !!clave,
    tipoDeClave: clave ? (clave.startsWith("sb_secret_") ? "sb_secret" : clave.split(".").length === 3 ? "jwt" : "desconocida") : null,
    servidorUrl: url ? new URL(url).host : null,
    urlPublica: process.env.URL_PUBLICA ?? null,
  };

  try {
    await prisma.reporte.count();
    informe.baseDeDatos = "ok";
  } catch (e) {
    informe.baseDeDatos = `error: ${(e as Error).message.split("\n").pop()}`;
  }

  if (url && clave) {
    const cabeceras: Record<string, string> = { apikey: clave };
    if (!clave.startsWith("sb_")) cabeceras.Authorization = `Bearer ${clave}`;
    try {
      const r = await fetch(`${url}/storage/v1/bucket/fotos`, { headers: cabeceras });
      const cuerpo = await r.json().catch(() => ({}));
      informe.bucketFotos = { estado: r.status, publico: cuerpo.public ?? null, mensaje: r.ok ? null : cuerpo.message ?? cuerpo.error ?? null };
    } catch (e) {
      informe.bucketFotos = { error: (e as Error).message };
    }
  }
  return NextResponse.json(informe);
}
