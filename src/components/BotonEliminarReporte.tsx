"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

// HU-26: el dueño (o el administrador) retira un reporte que ya no es
// necesario. Pide confirmación porque no se puede deshacer: se borran también
// la foto y los mensajes del chat.
export default function BotonEliminarReporte({ id }: { id: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function eliminar() {
    if (
      !window.confirm(
        "¿Eliminar este reporte? Se borrará con su foto y sus mensajes, y no se puede deshacer."
      )
    ) {
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const respuesta = await fetch(`/api/reportes/${id}`, { method: "DELETE" });
      if (!respuesta.ok) {
        const data = await respuesta.json().catch(() => ({}));
        setError(data.error ?? "No se pudo eliminar el reporte.");
        return;
      }
      router.push("/reportes");
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
        onClick={eliminar}
        disabled={enviando}
        className="boton-secundario w-full text-red-600 hover:border-red-200 hover:text-red-700"
      >
        {enviando ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        )}
        Eliminar este reporte
      </button>
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
