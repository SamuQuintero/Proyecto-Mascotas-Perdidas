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
        html: `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);border:3px solid white;box-shadow:0 6px 14px rgba(28,24,41,0.35)"></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      }),
    [color]
  );

  return (
    <div className="h-64 w-full overflow-hidden rounded-2xl border border-tinta-200">
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
