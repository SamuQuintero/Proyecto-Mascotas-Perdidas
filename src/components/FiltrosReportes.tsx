"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ChevronDown, Loader2, RotateCcw, SlidersHorizontal } from "lucide-react";
import {
  contarFiltrosActivos,
  urlConFiltros,
  type FiltrosReporte,
} from "@/lib/filtros";
import CampoColor from "@/components/CampoColor";
import { ESPECIES, TAMANOS } from "@/lib/validacion";

// HU-6: panel de filtros del listado. Es un <form method="get"> normal
// (funciona incluso sin JavaScript); con JavaScript se omiten los campos
// vacíos para que la URL quede limpia y se muestra un indicador de carga.
export default function FiltrosReportes({
  filtros,
}: {
  filtros: FiltrosReporte;
}) {
  const router = useRouter();
  const [cargando, iniciarTransicion] = useTransition();
  const activos = contarFiltrosActivos(filtros);
  const [abierto, setAbierto] = useState(activos > 0);
  const [color, setColor] = useState(filtros.color ?? "");
  // Si el filtro de color cambia desde fuera (p. ej. al quitarlo con la "x"
  // de su etiqueta), el campo lo refleja.
  useEffect(() => setColor(filtros.color ?? ""), [filtros.color]);

  function aplicar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    const leer = (clave: string) =>
      (datos.get(clave) as string | null)?.trim() || undefined;

    iniciarTransicion(() => {
      router.push(
        urlConFiltros(filtros, {
          especie: leer("especie"),
          tamano: leer("tamano"),
          zona: leer("zona"),
          color: leer("color"),
          desde: leer("desde"),
          hasta: leer("hasta"),
        })
      );
    });
  }

  function limpiar() {
    setColor("");
    iniciarTransicion(() => {
      router.push(
        urlConFiltros(filtros, {
          especie: undefined,
          tamano: undefined,
          zona: undefined,
          color: undefined,
          desde: undefined,
          hasta: undefined,
        })
      );
    });
  }

  return (
    <section className="tarjeta overflow-hidden" aria-label="Filtros de búsqueda">
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        aria-expanded={abierto}
      >
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-perdida-100 to-reencontrada-100 text-perdida-600">
            <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block font-display text-base font-bold text-tinta-900">
              Filtrar reportes
            </span>
            <span className="block text-xs text-tinta-500">
              Zona, especie, color, tamaño y fechas
            </span>
          </span>
          {activos > 0 && (
            <span className="rounded-full bg-perdida-500 px-2 py-0.5 text-xs font-bold text-white">
              {activos}
            </span>
          )}
        </span>
        <ChevronDown
          className={`h-5 w-5 text-tinta-400 transition duration-300 ${abierto ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {abierto && (
        <form
          key={JSON.stringify(filtros)}
          method="get"
          action="/reportes"
          onSubmit={aplicar}
          className="animate-aparecer border-t border-tinta-100 px-5 pb-5 pt-4"
        >
          {filtros.tipo && <input type="hidden" name="tipo" value={filtros.tipo} />}
          {filtros.estado !== "ACTIVO" && (
            <input type="hidden" name="estado" value={filtros.estado} />
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Campo etiqueta="Zona o barrio">
              <input
                name="zona"
                defaultValue={filtros.zona}
                placeholder="Ej. Las Cuadras"
                className="campo-input"
                maxLength={60}
              />
            </Campo>
            <Campo etiqueta="Especie">
              <select name="especie" defaultValue={filtros.especie ?? ""} className="campo-input">
                <option value="">Todas</option>
                {ESPECIES.map((especie) => (
                  <option key={especie} value={especie}>
                    {especie}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo etiqueta="Color">
              <CampoColor
                name="color"
                valor={color}
                onCambiar={setColor}
                placeholder="Ej. café, negro…"
              />
            </Campo>
            <Campo etiqueta="Tamaño">
              <select name="tamano" defaultValue={filtros.tamano ?? ""} className="campo-input">
                <option value="">Todos</option>
                {TAMANOS.map((tamano) => (
                  <option key={tamano.valor} value={tamano.valor}>
                    {tamano.etiqueta}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo etiqueta="Desde">
              <input
                type="date"
                name="desde"
                defaultValue={filtros.desde}
                className="campo-input"
              />
            </Campo>
            <Campo etiqueta="Hasta">
              <input
                type="date"
                name="hasta"
                defaultValue={filtros.hasta}
                className="campo-input"
              />
            </Campo>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={limpiar}
              disabled={activos === 0 || cargando}
              className="boton-secundario"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Limpiar filtros
            </button>
            <button type="submit" disabled={cargando} className="boton-primario">
              {cargando ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              )}
              Aplicar filtros
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function Campo({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-tinta-500">
        {etiqueta}
      </span>
      {children}
    </label>
  );
}
