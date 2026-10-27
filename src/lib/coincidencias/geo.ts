import type { Geolocalizable } from "./perfiles";

// HU-7: radio en el que un hallazgo se considera "cerca" de donde se perdió
// la mascota. 2 km cubre varios barrios de Pasto sin volverse ruido.
export const RADIO_CERCANIA_KM = 2;

// Distancia en kilómetros entre dos coordenadas (fórmula del haversine).
export function distanciaKm(a: Geolocalizable, b: Geolocalizable): number {
  const R = 6371;
  const rad = (grados: number) => (grados * Math.PI) / 180;
  const dLat = rad(b.latitud - a.latitud);
  const dLng = rad(b.longitud - a.longitud);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitud)) * Math.cos(rad(b.latitud)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatearDistancia(km: number): string {
  if (km < 1) return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`;
  return `${km.toFixed(1).replace(".", ",")} km`;
}
