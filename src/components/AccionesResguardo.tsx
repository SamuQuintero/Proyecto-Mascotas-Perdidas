"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CircleCheckBig, Trash2 } from "lucide-react";

// HU-20: el refugio marca un animal como entregado (sale del listado
// público) o borra una publicación hecha por error.
export default function AccionesResguardo({
  id,
  entregado = false,
}: {
  id: string;
  entregado?: boolean;
}) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);

  async function ejecutar(metodo: "PATCH" | "DELETE", confirmacion: string) {
    if (!window.confirm(confirmacion)) return;
    setOcupado(true);
    try {
      await fetch(`/api/resguardo/${id}`, { method: metodo });
      router.refresh();
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {!entregado && (
        <button
          type="button"
          disabled={ocupado}
          onClick={() =>
            ejecutar("PATCH", "¿Ya fue entregado a su dueño o adoptado? Dejará de aparecer en el listado público.")
          }
          className="inline-flex items-center gap-1.5 rounded-full border border-encontrada-200 bg-encontrada-50 px-3 py-1.5 text-xs font-bold text-encontrada-700 transition hover:bg-encontrada-100"
        >
          <CircleCheckBig className="h-3.5 w-3.5" aria-hidden="true" />
          Marcar entregado
        </button>
      )}
      <button
        type="button"
        disabled={ocupado}
        onClick={() => ejecutar("DELETE", "¿Borrar esta publicación? No se puede deshacer.")}
        className="inline-flex items-center gap-1.5 rounded-full border border-tinta-200 bg-white px-3 py-1.5 text-xs font-bold text-tinta-600 transition hover:border-red-200 hover:text-red-600"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        Borrar
      </button>
    </div>
  );
}
