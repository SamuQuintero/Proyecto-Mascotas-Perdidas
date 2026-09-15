"use client";

export default function ErrorGlobal({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Algo salió mal</h1>
      <p className="text-slate-600">
        Ocurrió un error inesperado. Intenta nuevamente.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Reintentar
      </button>
    </div>
  );
}
