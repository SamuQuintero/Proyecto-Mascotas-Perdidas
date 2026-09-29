"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check } from "lucide-react";
import {
  aplicarColor,
  canonizarColor,
  colorCompleto,
  sugerirColores,
} from "@/lib/colores";

interface Props {
  valor: string;
  onCambiar: (valor: string) => void;
  name?: string; // para formularios nativos (p. ej. el panel de filtros)
  placeholder?: string;
  invalido?: boolean;
}

// Campo de color con autocompletado: mientras se escribe, se filtran los
// colores principales (sin importar mayúsculas ni tildes). Se puede elegir
// una opción o escribir libremente, y combinar colores ("Café con blanco").
export default function CampoColor({
  valor,
  onCambiar,
  name,
  placeholder = "Ej. Café con blanco",
  invalido,
}: Props) {
  const idLista = useId();
  const [abierta, setAbierta] = useState(false);
  const [activa, setActiva] = useState(0);
  const contenedor = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const opciones = sugerirColores(valor);
  const mostrar = abierta && opciones.length > 0 && !colorCompleto(valor);

  useEffect(() => setActiva(0), [valor]);

  useEffect(() => {
    if (!abierta) return;
    const alClic = (evento: MouseEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierta(false);
    };
    document.addEventListener("mousedown", alClic);
    return () => document.removeEventListener("mousedown", alClic);
  }, [abierta]);

  function elegir(nombre: string) {
    onCambiar(aplicarColor(valor, nombre));
    setAbierta(false);
    input.current?.focus();
  }

  function alTeclear(evento: React.KeyboardEvent<HTMLInputElement>) {
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      if (!mostrar) return setAbierta(true);
      setActiva((i) => (i + 1) % opciones.length);
    } else if (evento.key === "ArrowUp" && mostrar) {
      evento.preventDefault();
      setActiva((i) => (i - 1 + opciones.length) % opciones.length);
    } else if (evento.key === "Enter" && mostrar) {
      evento.preventDefault(); // elegir la opción en lugar de enviar el formulario
      elegir(opciones[activa].nombre);
    } else if ((evento.key === "Escape" || evento.key === "Tab") && mostrar) {
      setAbierta(false);
    }
  }

  return (
    <div ref={contenedor} className="relative">
      <input
        ref={input}
        name={name}
        value={valor}
        onChange={(e) => {
          onCambiar(e.target.value);
          setAbierta(true);
        }}
        onFocus={() => setAbierta(true)}
        onBlur={() => {
          const corregido = canonizarColor(valor);
          if (corregido !== valor) onCambiar(corregido);
        }}
        onKeyDown={alTeclear}
        className="campo-input"
        placeholder={placeholder}
        autoComplete="off"
        maxLength={60}
        role="combobox"
        aria-expanded={mostrar}
        aria-controls={idLista}
        aria-autocomplete="list"
        aria-activedescendant={mostrar ? `${idLista}-${activa}` : undefined}
        aria-invalid={invalido || undefined}
      />

      {mostrar && (
        <ul
          id={idLista}
          role="listbox"
          className="absolute inset-x-0 top-full z-30 mt-1.5 max-h-64 animate-aparecer overflow-y-auto rounded-2xl border border-tinta-200 bg-white p-1.5 shadow-elevada"
        >
          {opciones.map((opcion, indice) => (
            <li
              key={opcion.nombre}
              id={`${idLista}-${indice}`}
              role="option"
              aria-selected={indice === activa}
              // mousedown (no click) para elegir antes de que el input pierda el foco
              onMouseDown={(e) => {
                e.preventDefault();
                elegir(opcion.nombre);
              }}
              onMouseEnter={() => setActiva(indice)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                indice === activa ? "bg-crema-100 text-tinta-900" : "text-tinta-700"
              }`}
            >
              <span
                className="h-5 w-5 shrink-0 rounded-full border border-tinta-200 shadow-inner"
                style={{ background: opcion.muestra }}
                aria-hidden="true"
              />
              <span className="flex-1 font-medium">{opcion.nombre}</span>
              {indice === activa && (
                <Check className="h-4 w-4 text-perdida-500" aria-hidden="true" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
