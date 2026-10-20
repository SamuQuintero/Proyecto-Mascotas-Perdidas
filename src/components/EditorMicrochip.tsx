"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Loader2, Pencil, ShieldCheck, X } from "lucide-react";

interface Props {
  reporteId: string;
  microchip: string | null;
  verificadoPor: string | null;
}

// HU-17: la veterinaria confirma o corrige el microchip directamente desde
// la lista, sin salir del panel.
export default function EditorMicrochip({ reporteId, microchip, verificadoPor }: Props) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(microchip ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    setGuardando(true);
    setError(null);
    try {
      const respuesta = await fetch(`/api/reportes/${reporteId}/microchip`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ microchip: valor.trim() }),
      });
      if (!respuesta.ok) {
        const data = await respuesta.json().catch(() => ({}));
        setError(data.error ?? "No se pudo guardar.");
        return;
      }
      setEditando(false);
      router.refresh();
    } finally {
      setGuardando(false);
    }
  }

  if (editando) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="N.º de microchip"
          className="w-36 rounded-lg border border-tinta-200 px-2 py-1.5 text-xs"
          autoFocus
        />
        <button
          onClick={guardar}
          disabled={guardando}
          className="rounded-lg bg-encontrada-500 p-1.5 text-white hover:bg-encontrada-600 disabled:opacity-60"
          aria-label="Guardar"
        >
          {guardando ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          onClick={() => {
            setEditando(false);
            setValor(microchip ?? "");
            setError(null);
          }}
          className="rounded-lg border border-tinta-200 p-1.5 text-tinta-500 hover:bg-tinta-100"
          aria-label="Cancelar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }

  return microchip ? (
    <button
      onClick={() => setEditando(true)}
      className="group flex items-center gap-1.5 rounded-full bg-encontrada-100 px-2.5 py-1 text-xs font-bold text-encontrada-700 hover:bg-encontrada-200"
      title={verificadoPor ? `Verificado por ${verificadoPor}` : undefined}
    >
      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
      {microchip}
      <Pencil className="h-3 w-3 opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
    </button>
  ) : (
    <button
      onClick={() => setEditando(true)}
      className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-tinta-300 px-2.5 py-1 text-xs font-semibold text-tinta-500 hover:border-encontrada-300 hover:text-encontrada-700"
    >
      <Pencil className="h-3 w-3" aria-hidden="true" />
      Vincular microchip
    </button>
  );
}
