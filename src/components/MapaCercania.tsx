"use client";

import { useMemo } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { RADIO_CERCANIA_KM, formatearDistancia } from "@/lib/coincidencias";

interface Punto {
  id: string;
  lat: number;
  lng: number;
  titulo: string;
  distanciaKm: number;
}

function pin(color: string, tamano: number) {
  return L.divIcon({
    className: "",
    html: `<div style="width:${tamano}px;height:${tamano}px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);border:3px solid white;box-shadow:0 6px 14px rgba(28,24,41,0.35)"></div>`,
    iconSize: [tamano, tamano],
    iconAnchor: [tamano / 2, tamano],
    popupAnchor: [0, -tamano],
  });
}

// HU-7: mapa con el lugar del reporte, el radio de cercanía y los reportes
// del tipo contrario que caen dentro de él.
export default function MapaCercania({
  centro,
  colorCentro,
  colorPuntos,
  puntos,
}: {
  centro: { lat: number; lng: number };
  colorCentro: string;
  colorPuntos: string;
  puntos: Punto[];
}) {
  const iconoCentro = useMemo(() => pin(colorCentro, 34), [colorCentro]);
  const iconoPunto = useMemo(() => pin(colorPuntos, 26), [colorPuntos]);

  return (
    <div className="h-72 w-full overflow-hidden rounded-2xl border border-tinta-200">
      <MapContainer
        center={[centro.lat, centro.lng]}
        zoom={14}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle
          center={[centro.lat, centro.lng]}
          radius={RADIO_CERCANIA_KM * 1000}
          pathOptions={{ color: colorCentro, weight: 2, fillOpacity: 0.08, dashArray: "6 6" }}
        />
        <Marker position={[centro.lat, centro.lng]} icon={iconoCentro} zIndexOffset={1000} />
        {puntos.map((punto) => (
          <Marker key={punto.id} position={[punto.lat, punto.lng]} icon={iconoPunto}>
            <Popup>
              <a href={`/reportes/${punto.id}`} className="font-semibold">
                {punto.titulo}
              </a>
              <br />A {formatearDistancia(punto.distanciaKm)}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
