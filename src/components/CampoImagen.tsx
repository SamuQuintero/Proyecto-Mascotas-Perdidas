"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImageUp } from "lucide-react";

interface Props {
  onCambiar: (archivo: File | null) => void;
  error?: string;
  // Foto actual del reporte al editar (HU-25); si no se elige otra, se conserva.
  urlInicial?: string;
}

export default function CampoImagen({ onCambiar, error, urlInicial }: Props) {
  const [previsualizacion, setPrevisualizacion] = useState<string | null>(
    urlInicial ?? null
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Libera la URL temporal del archivo anterior al cambiar de foto.
  useEffect(() => {
    return () => {
      if (previsualizacion?.startsWith("blob:")) {
        URL.revokeObjectURL(previsualizacion);
      }
    };
  }, [previsualizacion]);

  function manejarCambio(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0] ?? null;
    onCambiar(archivo);
    setPrevisualizacion(
      archivo ? URL.createObjectURL(archivo) : urlInicial ?? null
    );
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold text-tinta-700">
        Fotografía {!urlInicial && <span className="text-perdida-500">*</span>}
      </span>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`group relative flex w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl border-2 border-dashed p-6 text-center transition hover:border-perdida-300 hover:bg-perdida-50/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-perdida-100 ${
          error ? "border-red-300 bg-red-50/40" : "border-tinta-200 bg-crema-50"
        }`}
      >
        {previsualizacion ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previsualizacion}
              alt="Vista previa de la fotografía"
              className="h-52 w-full max-w-sm rounded-2xl object-cover shadow-suave"
            />
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-tinta-700 shadow-sm ring-1 ring-tinta-200 transition group-hover:ring-perdida-300">
              <ImageUp className="h-4 w-4" aria-hidden="true" />
              Cambiar foto
            </span>
          </>
        ) : (
          <>
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-perdida-100 to-sol-100 text-perdida-500 transition duration-300 group-hover:-rotate-6 group-hover:scale-110">
              <Camera className="h-7 w-7" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-semibold text-tinta-800">
                Toca para subir una foto
              </span>
              <span className="block text-xs text-tinta-500">
                JPG, PNG o WEBP · máximo 5 MB · que se vea bien su carita
              </span>
            </span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={manejarCambio}
        className="hidden"
      />
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
