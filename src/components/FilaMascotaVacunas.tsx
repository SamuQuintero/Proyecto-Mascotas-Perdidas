"use client";

import { useState } from "react";
import { ChevronDown, Syringe } from "lucide-react";
import PanelVacunas from "@/components/PanelVacunas";

interface Vacuna {
  id: string;
  nombre: string;
  fecha: string;
  veterinaria: string;
}

// HU-17: fila expandible de una mascota en el panel de la veterinaria;
// al abrirla aparece su carnet de vacunas (PanelVacunas).
export default function FilaMascotaVacunas({
  mascotaId,
  vacunas,
}: {
  mascotaId: string;
  vacunas: Vacuna[];
}) {
  const [abierta, setAbierta] = useState(false);

  return (
    <div className="border-t border-tinta-100 pt-3">
      <button
        onClick={() => setAbierta((valor) => !valor)}
        className="flex w-full items-center justify-between gap-2 text-left"
        aria-expanded={abierta}
      >
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-encontrada-700">
          <Syringe className="h-4 w-4" aria-hidden="true" />
          Carnet de vacunas ({vacunas.length})
        </span>
        <ChevronDown
          className={`h-4 w-4 text-tinta-400 transition ${abierta ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {abierta && (
        <div className="mt-3 animate-aparecer">
          <PanelVacunas mascotaId={mascotaId} vacunasIniciales={vacunas} />
        </div>
      )}
    </div>
  );
}
