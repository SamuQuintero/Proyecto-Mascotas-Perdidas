"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Megaphone } from "lucide-react";

// HU-19: confirma que el caso sigue abierto y lo vuelve a difundir.
export default function BotonRenovar({
  id,
  compacto = false,
}: {
  id: string;
  compacto?: boolean;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function renovar() {
    setEnviando(true);
    setError(null);
    try {
      const respuesta = await fetch(`/api/reportes/${id}/renovar`, { method: "POST" });
      if (!respuesta.ok) {
        const data = await respuesta.json().catch(() => ({}));
        setError(data.error ?? "No se pudo renovar el reporte.");
        return;
      }
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={renovar}
        disabled={enviando}
        className={
          compacto
            ? "inline-flex items-center gap-1.5 rounded-full bg-perdida-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-perdida-600"
            : "boton-primario w-full"
        }
      >
        {enviando ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Megaphone className="h-4 w-4" aria-hidden="true" />
        )}
        Sigue perdida: volver a difundir
      </button>
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
