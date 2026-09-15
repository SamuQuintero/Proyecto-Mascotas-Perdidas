"use client";

import { useRef, useState } from "react";

interface Props {
  onCambiar: (archivo: File | null) => void;
  error?: string;
}

export default function CampoImagen({ onCambiar, error }: Props) {
  const [previsualizacion, setPrevisualizacion] = useState<string | null>(
    null
  );
  const inputRef = useRef<HTMLInputElement>(null);

  function manejarCambio(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0] ?? null;
    onCambiar(archivo);

    if (archivo) {
      const url = URL.createObjectURL(archivo);
      setPrevisualizacion(url);
    } else {
      setPrevisualizacion(null);
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        Fotografía <span className="text-red-500">*</span>
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition hover:bg-slate-50 ${
          error ? "border-red-300" : "border-slate-300"
        }`}
      >
        {previsualizacion ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previsualizacion}
            alt="Vista previa de la fotografía"
            className="h-40 w-40 rounded-lg object-cover"
          />
        ) : (
          <>
            <span className="text-3xl">📷</span>
            <span className="text-sm text-slate-600">
              Toca para subir una foto (JPG, PNG o WEBP, máx. 5 MB)
            </span>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={manejarCambio}
        className="hidden"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
