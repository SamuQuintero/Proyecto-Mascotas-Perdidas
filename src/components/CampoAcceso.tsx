"use client";

import { useId, useState } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";

// Campo de las pantallas de acceso: ícono a la izquierda, mensaje de error
// debajo y, en contraseñas, botón para ver u ocultar lo escrito.
export default function CampoAcceso({
  etiqueta,
  Icono,
  tipo = "text",
  valor,
  onCambiar,
  autoComplete,
  autoFocus,
  error,
  placeholder,
}: {
  etiqueta: string;
  Icono: LucideIcon;
  tipo?: "text" | "email" | "password";
  valor: string;
  onCambiar: (valor: string) => void;
  autoComplete?: string;
  autoFocus?: boolean;
  error?: string;
  placeholder?: string;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const esContrasena = tipo === "password";

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-tinta-700">
        {etiqueta}
      </label>
      <div className="group relative">
        <Icono
          className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-tinta-400 transition group-focus-within:text-perdida-500"
          aria-hidden="true"
        />
        <input
          id={id}
          type={esContrasena && visible ? "text" : tipo}
          value={valor}
          onChange={(e) => onCambiar(e.target.value)}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          className={`campo-input !rounded-2xl !py-3.5 pl-11 ${esContrasena ? "pr-12" : ""}`}
          required
        />
        {esContrasena && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-xl p-2 text-tinta-400 transition hover:bg-tinta-100 hover:text-tinta-700"
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={visible}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
