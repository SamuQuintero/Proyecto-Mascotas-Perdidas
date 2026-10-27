// HU-22: indicadores del administrador. ¿La plataforma está cerrando la
// brecha entre perros y gatos? Se miden reportes, coincidencias y
// reunificaciones por especie, zona y tiempo. Funciones puras: reciben los
// reportes ya leídos y no consultan la base (ver indicadores.test.ts).

import { calcularAlertas, type ReporteComparable } from "@/lib/coincidencias";
import { fechaParaInput } from "@/lib/formato";
import { normalizarTexto } from "@/lib/texto";
import type { EstadoReporte, TipoReporte } from "@/lib/tipos";

export interface ReporteIndicador extends ReporteComparable {
  estado: EstadoReporte;
  zona: string;
  creadoEn: Date | string;
  reencontradaEn: Date | string | null;
}

export type PeriodoIndicadores = "30" | "90" | "365" | "todo";

export const PERIODOS: { valor: PeriodoIndicadores; etiqueta: string }[] = [
  { valor: "30", etiqueta: "Últimos 30 días" },
  { valor: "90", etiqueta: "Últimos 90 días" },
  { valor: "365", etiqueta: "Último año" },
  { valor: "todo", etiqueta: "Todo el tiempo" },
];

export const ESPECIES_INDICADORES = ["Perro", "Gato", "Otro"] as const;
export type EspecieIndicador = (typeof ESPECIES_INDICADORES)[number];

const DIA_MS = 24 * 60 * 60 * 1000;

export function leerPeriodo(valor: string | undefined): PeriodoIndicadores {
  return PERIODOS.find((p) => p.valor === valor)?.valor ?? "90";
}

export interface IndicadorEspecie {
  especie: EspecieIndicador;
  perdidas: number;
  encontradas: number;
  // Mascotas perdidas que ya volvieron a casa (HU-12).
  reunificadas: number;
  // reunificadas / perdidas, de 0 a 1; null si no hubo pérdidas.
  tasaReunificacion: number | null;
  // Perdidas con al menos un hallazgo que se les parece (HU-4).
  conCoincidencia: number;
  // Días promedio entre publicar la pérdida y marcarla reencontrada.
  diasPromedioReunificacion: number | null;
}

export interface IndicadorZona {
  zona: string;
  perdidas: number;
  encontradas: number;
  reunificadas: number;
}

export interface IndicadorMes {
  mes: string; // "2026-03"
  porEspecie: Record<EspecieIndicador, { perdidas: number; reunificadas: number }>;
}

export interface Indicadores {
  total: number;
  porEspecie: IndicadorEspecie[];
  porZona: IndicadorZona[];
  porMes: IndicadorMes[];
  // Puntos porcentuales de diferencia entre la tasa de reunificación de
  // perros y la de gatos (perros − gatos). null si falta alguno de los dos.
  brechaPerrosGatos: number | null;
}

function especieDe(especie: string): EspecieIndicador {
  return especie === "Perro" || especie === "Gato" ? especie : "Otro";
}

function esReunificada(r: ReporteIndicador) {
  return r.tipo === "PERDIDA" && r.estado === "REENCONTRADA";
}

// Desde cuándo se cuenta (por fecha de publicación); null = sin límite.
export function inicioPeriodo(periodo: PeriodoIndicadores, ahora = new Date()): Date | null {
  return periodo === "todo" ? null : new Date(ahora.getTime() - Number(periodo) * DIA_MS);
}

export function calcularIndicadores(
  todos: ReporteIndicador[],
  periodo: PeriodoIndicadores,
  ahora = new Date()
): Indicadores {
  const inicio = inicioPeriodo(periodo, ahora);
  const reportes = inicio
    ? todos.filter((r) => new Date(r.creadoEn).getTime() >= inicio.getTime())
    : todos;

  // Las coincidencias se buscan entre TODOS los reportes (un hallazgo
  // anterior al periodo también puede ser la mascota), pero se cuentan solo
  // las pérdidas del periodo.
  const hallazgos = todos.filter((r) => r.tipo === "ENCONTRADA");

  const porEspecie = ESPECIES_INDICADORES.map((especie): IndicadorEspecie => {
    const delGrupo = reportes.filter((r) => especieDe(r.especie) === especie);
    const perdidas = delGrupo.filter((r) => r.tipo === "PERDIDA");
    const reunificadas = perdidas.filter(esReunificada);
    const dias = reunificadas
      .filter((r) => r.reencontradaEn)
      .map(
        (r) =>
          (new Date(r.reencontradaEn as Date | string).getTime() - new Date(r.creadoEn).getTime()) /
          DIA_MS
      )
      .map((d) => Math.max(0, d));

    return {
      especie,
      perdidas: perdidas.length,
      encontradas: delGrupo.length - perdidas.length,
      reunificadas: reunificadas.length,
      tasaReunificacion: perdidas.length ? reunificadas.length / perdidas.length : null,
      conCoincidencia: perdidas.filter((p) =>
        calcularAlertas(p, hallazgos).some((a) => a.esCoincidencia)
      ).length,
      diasPromedioReunificacion: dias.length
        ? dias.reduce((suma, d) => suma + d, 0) / dias.length
        : null,
    };
  });

  // Zonas: se agrupan sin importar mayúsculas ni tildes ("Pasto" = "pasto ").
  const zonas = new Map<string, IndicadorZona>();
  for (const r of reportes) {
    const clave = normalizarTexto(r.zona);
    const zona = zonas.get(clave) ?? {
      zona: r.zona.trim(),
      perdidas: 0,
      encontradas: 0,
      reunificadas: 0,
    };
    if (r.tipo === "PERDIDA") zona.perdidas++;
    else zona.encontradas++;
    if (esReunificada(r)) zona.reunificadas++;
    zonas.set(clave, zona);
  }
  const porZona = Array.from(zonas.values())
    .sort(
      (a, b) =>
        b.perdidas + b.encontradas - (a.perdidas + a.encontradas) || a.zona.localeCompare(b.zona)
    )
    .slice(0, 10);

  // Meses (hora de Colombia), del más antiguo al más reciente.
  const meses = new Map<string, IndicadorMes>();
  for (const r of reportes) {
    if (r.tipo !== "PERDIDA") continue;
    const mes = fechaParaInput(new Date(r.creadoEn)).slice(0, 7);
    const fila =
      meses.get(mes) ??
      ({
        mes,
        porEspecie: {
          Perro: { perdidas: 0, reunificadas: 0 },
          Gato: { perdidas: 0, reunificadas: 0 },
          Otro: { perdidas: 0, reunificadas: 0 },
        },
      } satisfies IndicadorMes);
    const celda = fila.porEspecie[especieDe(r.especie)];
    celda.perdidas++;
    if (esReunificada(r)) celda.reunificadas++;
    meses.set(mes, fila);
  }
  const porMes = Array.from(meses.values()).sort((a, b) => a.mes.localeCompare(b.mes));

  const tasa = (e: EspecieIndicador) => porEspecie.find((x) => x.especie === e)?.tasaReunificacion;
  const tPerro = tasa("Perro");
  const tGato = tasa("Gato");
  const brechaPerrosGatos =
    tPerro != null && tGato != null ? Math.round((tPerro - tGato) * 100) : null;

  return { total: reportes.length, porEspecie, porZona, porMes, brechaPerrosGatos };
}

export function formatearPorcentaje(tasa: number | null): string {
  return tasa === null ? "—" : `${Math.round(tasa * 100)} %`;
}

export function formatearDias(dias: number | null): string {
  if (dias === null) return "—";
  return dias < 1 ? "menos de 1 día" : `${dias.toFixed(1).replace(".", ",")} días`;
}

// "2026-03" → "mar 2026"
export function etiquetaMes(mes: string): string {
  const [anio, numero] = mes.split("-").map(Number);
  const nombre = new Date(Date.UTC(anio, numero - 1, 15)).toLocaleDateString("es-CO", {
    month: "short",
    timeZone: "UTC",
  });
  return `${nombre.replace(".", "")} ${anio}`;
}

export type { TipoReporte };
