// Contratos mínimos que necesita cada comparación (principio de segregación
// de interfaces, la "I" de SOLID). En vez de una interfaz grande, cada
// capacidad es una interfaz pequeña, y cada tipo comparable las compone:
//
//   Identificable ─┐
//   Geolocalizable ─┤
//   ConFecha ───────┼─► ReporteComparable   (HU-4, 7, 15, 20)
//   PerfilFisico ───┤
//   SenasFelinas ───┘
//
//   Identificable + PerfilFisico + SenasFelinas ─► MascotaComparable (HU-10)
//   Identificable + PerfilFisico + { desde }    ─► AnimalResguardoComparable (HU-20)
//
// Un criterio de puntuación pide solo lo que usa: el de color acepta
// cualquier PerfilFisico, el de distancia cualquier Geolocalizable. Así un
// perfil de mascota (sin ubicación) o un animal de refugio (sin señas de
// gato) pueden pasar por los mismos criterios sin inventar campos
// (sustitución de Liskov, la "L").

import type { SenasFelinas } from "@/lib/felinos";
import type { Tamano, TipoReporte } from "@/lib/tipos";

export interface Identificable {
  id: string;
}

export interface Geolocalizable {
  latitud: number;
  longitud: number;
}

export interface ConFecha {
  fecha: Date | string;
}

export interface PerfilFisico {
  especie: string;
  color: string;
  tamano: Tamano;
}

// "Vive en interior" solo se muestra; no interviene en las comparaciones.
export type SenasFelinasComparables = Omit<SenasFelinas, "esDeInterior">;

export type ReporteComparable = Identificable &
  Geolocalizable &
  ConFecha &
  PerfilFisico &
  SenasFelinasComparables & { tipo: TipoReporte };

export type MascotaComparable = Identificable & PerfilFisico & SenasFelinasComparables;

export type AnimalResguardoComparable = Identificable & PerfilFisico & { desde: Date | string };
