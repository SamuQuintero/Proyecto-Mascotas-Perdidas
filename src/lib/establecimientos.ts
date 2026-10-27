// HU-18: directorio de veterinarias y refugios que reciben mascotas
// encontradas. Funciones puras para ordenarlos por cercanía a quien
// encontró al animal (se prueban en establecimientos.test.ts).

import { distanciaKm } from "@/lib/coincidencias";

export interface Establecimiento {
  id: string;
  tipo: "VETERINARIA" | "REFUGIO";
  nombre: string;
  telefono: string;
  direccion: string | null;
  latitud: number;
  longitud: number;
}

export type EstablecimientoCercano<E extends Establecimiento = Establecimiento> = E & {
  distanciaKm: number;
};

export type FiltroTipoEstablecimiento = "TODOS" | Establecimiento["tipo"];

// Más cercanos primero. Con `tipo` se limita a veterinarias o a refugios.
export function ordenarPorCercania<E extends Establecimiento>(
  lista: E[],
  origen: { latitud: number; longitud: number },
  tipo: FiltroTipoEstablecimiento = "TODOS"
): EstablecimientoCercano<E>[] {
  return lista
    .filter((e) => tipo === "TODOS" || e.tipo === tipo)
    .map((e) => ({ ...e, distanciaKm: distanciaKm(origen, e) }))
    .sort((a, b) => a.distanciaKm - b.distanciaKm);
}

// Enlace de "cómo llegar" en Google Maps hacia las coordenadas del local.
export function enlaceComoLlegar(e: { latitud: number; longitud: number }): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${e.latitud},${e.longitud}`;
}
