"use client";

import { useMemo } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";

interface Props {
  lat: number;
  lng: number;
  color: string;
}

export default function MapaVisor({ lat, lng, color }: Props) {
  const icono = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      }),
    [color]
  );

  return (
    <div className="h-64 w-full overflow-hidden rounded-xl border border-slate-200">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        className="h-full w-full"
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={icono} />
      </MapContainer>
    </div>
  );
}
