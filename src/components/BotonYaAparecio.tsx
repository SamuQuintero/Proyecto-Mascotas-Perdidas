"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, PartyPopper } from "lucide-react";
import { cambiarEstadoReporte } from "@/lib/api-cliente";

// HU-12: el dueño cierra su propio caso cuando la mascota ya apareció.
// Reabrirlo, si fue un error, solo lo hace el administrador.
export default function BotonYaAparecio({
  id,
  compacto = false,
}: {
  id: string;
  compacto?: boolean;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cerrar() {
    if (
      !window.confirm(
        "¿Tu mascota ya apareció? El caso se cerrará y dejará de buscarse. Para reabrirlo tendrías que pedírselo al equipo administrador."
      )
    ) {
      return;
    }
    setEnviando(true);
    setError(null);
    const fallo = await cambiarEstadoReporte(id, "REENCONTRADA");
    setEnviando(false);
    if (fallo) {
      setError(fallo);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={cerrar}
        disabled={enviando}
        className={
          compacto
            ? "inline-flex items-center gap-1.5 rounded-full border border-encontrada-200 bg-encontrada-50 px-3 py-1.5 text-xs font-bold text-encontrada-700 transition hover:bg-encontrada-100"
            : "boton-secundario w-full"
        }
      >
        {enviando ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <PartyPopper className="h-4 w-4" aria-hidden="true" />
        )}
        ¡Ya apareció!
      </button>
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
