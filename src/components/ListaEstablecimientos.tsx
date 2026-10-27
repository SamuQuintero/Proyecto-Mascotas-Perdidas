"use client";

import { useMemo, useState } from "react";
import { Home, LocateFixed, MapPinned, MessageCircle, Phone, Stethoscope } from "lucide-react";
import {
  enlaceComoLlegar,
  ordenarPorCercania,
  type Establecimiento,
  type FiltroTipoEstablecimiento,
} from "@/lib/establecimientos";
import { formatearDistancia } from "@/lib/coincidencias";

export interface EstablecimientoPublico extends Establecimiento {
  enlaceTelefono: string;
  enlaceWhatsApp: string | null;
}

// Centro de Pasto: punto de partida mientras la persona no comparte su
// ubicación (igual que los mapas de la aplicación).
const CENTRO_PASTO = { latitud: 1.2136, longitud: -77.2811 };

const FILTROS: { valor: FiltroTipoEstablecimiento; etiqueta: string }[] = [
  { valor: "TODOS", etiqueta: "Todos" },
  { valor: "VETERINARIA", etiqueta: "Veterinarias" },
  { valor: "REFUGIO", etiqueta: "Refugios" },
];

// HU-18: lista de veterinarias y refugios que reciben mascotas encontradas,
// ordenada por cercanía a la ubicación de quien la encontró.
export default function ListaEstablecimientos({
  establecimientos,
}: {
  establecimientos: EstablecimientoPublico[];
}) {
  const [origen, setOrigen] = useState(CENTRO_PASTO);
  const [usaMiUbicacion, setUsaMiUbicacion] = useState(false);
  const [tipo, setTipo] = useState<FiltroTipoEstablecimiento>("TODOS");
  const [aviso, setAviso] = useState<string | null>(null);

  const lista = useMemo(
    () => ordenarPorCercania(establecimientos, origen, tipo),
    [establecimientos, origen, tipo]
  );

  function usarMiUbicacion() {
    setAviso(null);
    if (!navigator.geolocation) {
      setAviso("Tu navegador no permite obtener la ubicación.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        setOrigen({ latitud: posicion.coords.latitude, longitud: posicion.coords.longitude });
        setUsaMiUbicacion(true);
      },
      () => setAviso("No pudimos obtener tu ubicación. Mostramos las distancias desde el centro de Pasto.")
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2" role="group" aria-label="Tipo de lugar">
          {FILTROS.map((f) => (
            <button
              key={f.valor}
              type="button"
              onClick={() => setTipo(f.valor)}
              aria-pressed={tipo === f.valor}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                tipo === f.valor
                  ? "bg-tinta-900 text-white"
                  : "border border-tinta-200 bg-white text-tinta-600 hover:border-tinta-300"
              }`}
            >
              {f.etiqueta}
            </button>
          ))}
        </div>
        <button type="button" onClick={usarMiUbicacion} className="boton-secundario">
          <LocateFixed className="h-4 w-4" aria-hidden="true" />
          {usaMiUbicacion ? "Ubicación actualizada" : "Usar mi ubicación"}
        </button>
      </div>

      <p className="text-xs text-tinta-500">
        {usaMiUbicacion
          ? "Distancias calculadas desde tu ubicación."
          : "Distancias calculadas desde el centro de Pasto. Comparte tu ubicación para ver cuál te queda más cerca."}
      </p>
      {aviso && <p className="text-sm font-medium text-perdida-700">{aviso}</p>}

      {lista.length === 0 ? (
        <div className="tarjeta px-6 py-12 text-center text-tinta-500">
          Todavía no hay {tipo === "REFUGIO" ? "refugios" : tipo === "VETERINARIA" ? "veterinarias" : "lugares"} registrados
          que reciban mascotas encontradas.
        </div>
      ) : (
        <ul className="space-y-3">
          {lista.map((e) => (
            <li key={e.id} className="tarjeta p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                      e.tipo === "REFUGIO"
                        ? "bg-reencontrada-50 text-reencontrada-700"
                        : "bg-encontrada-50 text-encontrada-700"
                    }`}
                  >
                    {e.tipo === "REFUGIO" ? (
                      <Home className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Stethoscope className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {e.tipo === "REFUGIO" ? "Refugio" : "Veterinaria"}
                  </span>
                  <h3 className="mt-2 font-display text-lg font-bold text-tinta-900">{e.nombre}</h3>
                  {e.direccion && <p className="text-sm text-tinta-500">{e.direccion}</p>}
                </div>
                <span className="shrink-0 rounded-full bg-crema-100 px-3 py-1 text-sm font-bold text-tinta-700">
                  {formatearDistancia(e.distanciaKm)}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={e.enlaceTelefono} className="boton-secundario">
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {e.telefono}
                </a>
                {e.enlaceWhatsApp && (
                  <a href={e.enlaceWhatsApp} target="_blank" rel="noopener noreferrer" className="boton-secundario">
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    WhatsApp
                  </a>
                )}
                <a href={enlaceComoLlegar(e)} target="_blank" rel="noopener noreferrer" className="boton-secundario">
                  <MapPinned className="h-4 w-4" aria-hidden="true" />
                  Cómo llegar
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
