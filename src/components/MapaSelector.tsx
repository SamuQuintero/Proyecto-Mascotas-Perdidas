"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { LocateFixed } from "lucide-react";

// El mapa siempre arranca centrado en Pasto (Nariño), la ciudad donde opera
// la aplicación. Es solo el punto de partida visual: no se guarda como
// ubicación del reporte hasta que la persona toca el mapa o usa su ubicación.
export const CENTRO_PASTO: [number, number] = [1.2136, -77.2811];
const CENTRO_POR_DEFECTO = CENTRO_PASTO;

function crearIcono(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);border:3px solid white;box-shadow:0 6px 14px rgba(28,24,41,0.35)"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
}

interface Props {
  lat: number | null;
  lng: number | null;
  color: string;
  onCambiar: (lat: number, lng: number) => void;
}

function CapturaClicks({
  onCambiar,
}: {
  onCambiar: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(evento) {
      onCambiar(evento.latlng.lat, evento.latlng.lng);
    },
  });
  return null;
}

// Si el punto queda fuera de la vista (p. ej. al usar "mi ubicación"),
// mueve el mapa hasta él.
function Recentrar({ lat, lng }: { lat: number | null; lng: number | null }) {
  const mapa = useMap();
  useEffect(() => {
    if (lat !== null && lng !== null && !mapa.getBounds().contains([lat, lng])) {
      mapa.setView([lat, lng], 15);
    }
  }, [lat, lng, mapa]);
  return null;
}

export default function MapaSelector({ lat, lng, color, onCambiar }: Props) {
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);
  const [errorGeo, setErrorGeo] = useState<string | null>(null);
  const icono = useMemo(() => crearIcono(color), [color]);
  const posicion: [number, number] =
    lat !== null && lng !== null ? [lat, lng] : CENTRO_POR_DEFECTO;

  const usarMiUbicacion = useCallback(() => {
    if (!navigator.geolocation) {
      setErrorGeo("Tu navegador no permite obtener la ubicación.");
      return;
    }
    setBuscandoUbicacion(true);
    setErrorGeo(null);
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        onCambiar(posicion.coords.latitude, posicion.coords.longitude);
        setBuscandoUbicacion(false);
      },
      () => {
        setErrorGeo("No se pudo obtener tu ubicación. Marca el punto en el mapa.");
        setBuscandoUbicacion(false);
      }
    );
  }, [onCambiar]);

  return (
    <div className="space-y-2">
      <div className="h-72 w-full overflow-hidden rounded-2xl border border-tinta-200">
        <MapContainer
          center={posicion}
          zoom={lat !== null ? 15 : 14}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <CapturaClicks onCambiar={onCambiar} />
          <Recentrar lat={lat} lng={lng} />
          {lat !== null && lng !== null && (
            <Marker position={[lat, lng]} icon={icono} />
          )}
        </MapContainer>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-tinta-500">
          Toca el mapa para marcar el punto exacto.
        </p>
        <button
          type="button"
          onClick={usarMiUbicacion}
          disabled={buscandoUbicacion}
          className="inline-flex items-center gap-1.5 rounded-full border border-tinta-200 bg-white px-3.5 py-2 text-xs font-semibold text-tinta-700 shadow-sm transition hover:-translate-y-0.5 hover:border-tinta-300 disabled:opacity-50"
        >
          <LocateFixed className="h-3.5 w-3.5" aria-hidden="true" />
          {buscandoUbicacion ? "Buscando…" : "Usar mi ubicación actual"}
        </button>
      </div>
      {errorGeo && <p className="text-xs text-red-600">{errorGeo}</p>}
    </div>
  );
}
