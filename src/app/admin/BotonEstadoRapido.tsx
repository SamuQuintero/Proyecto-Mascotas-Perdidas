"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, RotateCcw, Sparkles } from "lucide-react";
import { cambiarEstadoReporte } from "@/lib/api-cliente";
import type { EstadoReporte } from "@/lib/tipos";

// Cambio de estado en un clic desde la tabla del panel (HU-12).
export default function BotonEstadoRapido({
  id,
  estado,
  nombre,
}: {
  id: string;
  estado: EstadoReporte;
  nombre: string;
}) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const reencontrada = estado === "REENCONTRADA";

  async function alternar() {
    const pregunta = reencontrada
      ? `¿Reabrir el caso de ${nombre}?`
      : `¿Marcar a ${nombre} como reencontrada?`;
    if (!window.confirm(pregunta)) return;

    setGuardando(true);
    const fallo = await cambiarEstadoReporte(
      id,
      reencontrada ? "ACTIVO" : "REENCONTRADA"
    );
    setGuardando(false);
    if (fallo) {
      window.alert(fallo);
      return;
    }
    router.refresh();
  }

  const Icono = guardando ? Loader2 : reencontrada ? RotateCcw : Sparkles;

  return (
    <button
      onClick={alternar}
      disabled={guardando}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition disabled:opacity-60 ${
        reencontrada
          ? "border border-tinta-200 bg-white text-tinta-600 hover:border-tinta-300"
          : "bg-reencontrada-500 text-white shadow-brillo-lavanda hover:bg-reencontrada-600"
      }`}
    >
      <Icono className={`h-3.5 w-3.5 ${guardando ? "animate-spin" : ""}`} aria-hidden="true" />
      {reencontrada ? "Reabrir" : "Reencontrada"}
    </button>
  );
}
