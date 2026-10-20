"use client";

import Link from "next/link";
import { useState } from "react";
import { Camera, Loader2, SearchX, Sparkles } from "lucide-react";
import CampoImagen from "@/components/CampoImagen";

interface ResultadoFoto {
  id: string;
  titulo: string;
  especie: string;
  color: string;
  zona: string;
  fotoUrl: string;
}

const MUESTRA_COLOR: Record<string, string> = {
  negro: "#1f1d24",
  blanco: "#ffffff",
  gris: "#9a9aa3",
  cafe: "#5c402c",
  dorado: "#cdaa64",
  naranja: "#be5f2d",
  manchado:
    "radial-gradient(circle at 30% 30%,#2b2b2b 25%,transparent 26%),radial-gradient(circle at 70% 65%,#2b2b2b 20%,#fff 21%)",
};

// HU-10: buscar una mascota a partir de una foto, sin publicar un reporte.
// Comparación local por color (sin IA): se explica así de entrada para no
// generar falsas expectativas de reconocimiento del animal.
export default function BuscarPorFotoPage() {
  const [foto, setFoto] = useState<File | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [colorDetectado, setColorDetectado] = useState<string | null>(null);
  const [resultados, setResultados] = useState<ResultadoFoto[] | null>(null);

  async function buscar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!foto) {
      setError("Sube una fotografía primero.");
      return;
    }
    setBuscando(true);
    setError(null);
    setResultados(null);

    try {
      const formData = new FormData();
      formData.append("foto", foto);
      const respuesta = await fetch("/api/buscar-por-foto", { method: "POST", body: formData });
      const data = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        setError(data.error ?? "No se pudo procesar la foto.");
        return;
      }
      setColorDetectado(data.colorDetectado);
      setResultados(data.reportes);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="animate-aparecer">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-reencontrada-400 to-perdida-500 text-white shadow-brillo">
          <Camera className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="titulo-display mt-4 text-3xl sm:text-4xl">
          Buscar mascota a partir de una foto
        </h1>
        <p className="mt-2 text-tinta-500">
          Para cuando encontraste una mascota sin placa ni collar. Sube una foto y te
          mostramos las mascotas perdidas con un color parecido.
        </p>
        <p className="mt-2 rounded-2xl bg-crema-100 p-3 text-xs text-tinta-600">
          Es una comparación simple por color, no reconocimiento del animal: úsala para
          acortar la lista, no como una identificación certera. Revisa siempre el reporte
          completo antes de contactar.
        </p>
      </div>

      <form onSubmit={buscar} className="tarjeta space-y-4 p-5 sm:p-6">
        <CampoImagen onCambiar={setFoto} error={error ?? undefined} />
        <button type="submit" disabled={buscando} className="boton-primario w-full py-3.5">
          {buscando ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          )}
          {buscando ? "Buscando…" : "Buscar coincidencias"}
        </button>
      </form>

      {colorDetectado && resultados !== null && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span
              className="h-6 w-6 shrink-0 rounded-full border border-tinta-200 shadow-inner"
              style={{ background: MUESTRA_COLOR[colorDetectado] ?? "#999" }}
              aria-hidden="true"
            />
            <p className="text-sm text-tinta-600">
              Color detectado en la foto: <strong className="text-tinta-900">{colorDetectado}</strong>
            </p>
          </div>

          {resultados.length === 0 ? (
            <div className="tarjeta flex flex-col items-center gap-3 px-6 py-12 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-crema-100 text-perdida-500">
                <SearchX className="h-7 w-7" aria-hidden="true" />
              </span>
              <p className="text-tinta-600">
                No hay mascotas perdidas activas con un color parecido por ahora.
              </p>
              <Link href="/encontrada/nuevo" className="boton-secundario">
                Publicar este hallazgo igual
              </Link>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {resultados.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/reportes/${r.id}`}
                    className="flex gap-3 rounded-2xl border border-tinta-100 bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-suave"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.fotoUrl}
                      alt=""
                      className="h-20 w-20 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-display font-bold text-tinta-900">{r.titulo}</p>
                      <p className="truncate text-xs text-tinta-500">
                        {r.especie} · {r.color}
                      </p>
                      <p className="truncate text-xs text-tinta-500">{r.zona}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
