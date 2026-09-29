import type { LucideIcon } from "lucide-react";

// Piezas visuales compartidas por los formularios (reportes y perfil QR).

export function Seccion({
  numero,
  titulo,
  Icono,
  children,
}: {
  numero: number;
  titulo: string;
  Icono: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <fieldset
      className="tarjeta animate-aparecer space-y-4 p-5 sm:p-6"
      style={{ animationDelay: `${numero * 70}ms` }}
    >
      <legend className="sr-only">{titulo}</legend>
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-tinta-900 text-white">
          <Icono className="h-4 w-4" />
        </span>
        <span>
          <span className="block text-[11px] font-bold uppercase tracking-wider text-tinta-400">
            Paso {numero}
          </span>
          <span className="block font-display text-lg font-bold leading-tight text-tinta-900">
            {titulo}
          </span>
        </span>
      </div>
      {children}
    </fieldset>
  );
}

export function Campo({
  etiqueta,
  error,
  obligatorio,
  children,
}: {
  etiqueta: string;
  error?: string;
  obligatorio?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-tinta-700">
        {etiqueta} {obligatorio && <span className="text-perdida-500">*</span>}
      </span>
      {children}
      {error && (
        <span className="mt-1.5 block text-xs font-medium text-red-600">{error}</span>
      )}
    </label>
  );
}

export function Alerta({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="animate-aparecer rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
    >
      {children}
    </p>
  );
}
