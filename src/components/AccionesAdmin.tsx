"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Pencil, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { cambiarEstadoReporte } from "@/lib/api-cliente";
import type { EstadoReporte } from "@/lib/tipos";

// Acciones del administrador sobre un reporte: editar (HU-25) y marcar como
// reencontrada o reabrir el caso (HU-12). Solo se renderiza si hay sesión
// de admin; la API vuelve a verificar la sesión en cada petición.
export default function AccionesAdmin({
  id,
  estado,
}: {
  id: string;
  estado: EstadoReporte;
}) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reencontrada = estado === "REENCONTRADA";

  async function cambiarEstado() {
    setGuardando(true);
    setError(null);
    const fallo = await cambiarEstadoReporte(
      id,
      reencontrada ? "ACTIVO" : "REENCONTRADA"
    );
    setGuardando(false);
    if (fallo) {
      setError(fallo);
      return;
    }
    setConfirmando(false);
    router.refresh();
  }

  return (
    <section className="rounded-3xl border border-reencontrada-200 bg-gradient-to-br from-reencontrada-50 to-white p-5 shadow-suave">
      <h2 className="flex items-center gap-2 text-sm font-bold text-reencontrada-700">
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        Herramientas de administrador
      </h2>

      <div className="mt-4 space-y-2">
        <Link
          href={`/reportes/${id}/editar`}
          className="boton-secundario w-full"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Editar reporte
        </Link>

        {confirmando ? (
          <div className="animate-aparecer space-y-2 rounded-2xl border border-reencontrada-200 bg-white p-3">
            <p className="text-sm text-tinta-600">
              {reencontrada
                ? "¿Reabrir el caso? El reporte volverá a aparecer como pendiente."
                : "¿Confirmas que esta mascota ya volvió a casa? El reporte dejará de aparecer como caso abierto."}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmando(false)}
                disabled={guardando}
                className="boton-secundario flex-1 px-3"
              >
                Cancelar
              </button>
              <button
                onClick={cambiarEstado}
                disabled={guardando}
                className="boton flex-1 bg-reencontrada-500 px-3 text-white hover:bg-reencontrada-600 focus-visible:ring-reencontrada-200"
              >
                {guardando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Sí, confirmar
              </button>
            </div>
          </div>
        ) : reencontrada ? (
          <button
            onClick={() => setConfirmando(true)}
            className="boton-secundario w-full"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reabrir caso
          </button>
        ) : (
          <button
            onClick={() => setConfirmando(true)}
            className="boton w-full bg-gradient-to-r from-reencontrada-500 to-reencontrada-600 text-white shadow-brillo-lavanda hover:-translate-y-0.5 focus-visible:ring-reencontrada-200"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Marcar como reencontrada
          </button>
        )}

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
