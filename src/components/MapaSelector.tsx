"use client";

import { useCallback, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Centro por defecto cuando aún no hay un punto seleccionado ni permiso de
// geolocalización (Bogotá, Colombia). Es solo el punto de partida visual del
// mapa, no se guarda como ubicación del reporte.
const CENTRO_POR_DEFECTO: [number, number] = [4.711, -74.0721];

function crearIcono(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
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
      <div className="h-64 w-full overflow-hidden rounded-xl border border-slate-200">
        <MapContainer
          center={posicion}
          zoom={lat !== null ? 15 : 12}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <CapturaClicks onCambiar={onCambiar} />
          {lat !== null && lng !== null && (
            <Marker position={[lat, lng]} icon={icono} />
          )}
        </MapContainer>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          Toca el mapa para marcar el punto exacto.
        </p>
        <button
          type="button"
          onClick={usarMiUbicacion}
          disabled={buscandoUbicacion}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {buscandoUbicacion ? "Buscando…" : "📍 Usar mi ubicación actual"}
        </button>
      </div>
      {errorGeo && <p className="text-xs text-red-600">{errorGeo}</p>}
    </div>
  );
}
