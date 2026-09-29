import { HeartHandshake, Search, Sparkles } from "lucide-react";
import type { EstadoReporte, TipoReporte } from "@/lib/tipos";

// Etiquetas de color compartidas por tarjetas, detalle y panel admin, para
// que "perdida", "encontrada" y "reencontrada" se vean igual en toda la app.

export const ESTILO_TIPO = {
  PERDIDA: {
    etiqueta: "Perdida",
    etiquetaLarga: "Mascota perdida",
    clase: "bg-perdida-100 text-perdida-700 ring-perdida-200",
    colorMapa: "#FF6B45",
    Icono: Search,
  },
  ENCONTRADA: {
    etiqueta: "Encontrada",
    etiquetaLarga: "Mascota encontrada",
    clase: "bg-encontrada-100 text-encontrada-700 ring-encontrada-200",
    colorMapa: "#14AD84",
    Icono: HeartHandshake,
  },
} as const;

export function EtiquetaTipo({
  tipo,
  larga,
}: {
  tipo: TipoReporte;
  larga?: boolean;
}) {
  const { etiqueta, etiquetaLarga, clase, Icono } = ESTILO_TIPO[tipo];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${clase}`}
    >
      <Icono className="h-3.5 w-3.5" aria-hidden="true" />
      {larga ? etiquetaLarga : etiqueta}
    </span>
  );
}

export function EtiquetaEstado({ estado }: { estado: EstadoReporte }) {
  if (estado === "REENCONTRADA") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-reencontrada-500 to-reencontrada-600 px-2.5 py-1 text-xs font-bold text-white shadow-brillo-lavanda">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        ¡Reencontrada!
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-sol-100 px-2.5 py-1 text-xs font-bold text-sol-500 ring-1 ring-inset ring-sol-200">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sol-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-sol-500" />
      </span>
      Caso abierto
    </span>
  );
}
