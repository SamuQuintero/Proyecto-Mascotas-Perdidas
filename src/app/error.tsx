"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";

export default function ErrorGlobal({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-sol-100 text-sol-500">
        <TriangleAlert className="h-8 w-8" aria-hidden="true" />
      </span>
      <h1 className="titulo-display text-2xl">Algo salió mal</h1>
      <p className="text-tinta-500">
        Ocurrió un error inesperado. Revisa tu conexión e intenta nuevamente.
      </p>
      <button onClick={reset} className="boton-primario">
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Reintentar
      </button>
    </div>
  );
}
