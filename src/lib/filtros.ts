import type { Prisma } from "@prisma/client";
import { familiasDeColor } from "@/lib/coincidencias";
import { instanteColombia } from "@/lib/formato";
import { contieneTexto } from "@/lib/texto";
import { ESPECIES } from "@/lib/validacion";
import type { Tamano, TipoReporte } from "@/lib/tipos";

// HU-6: filtros del listado de reportes. Los filtros viajan en la URL
// (?especie=Perro&zona=...), así un listado filtrado se puede recargar,
// compartir o volver atrás sin perder la búsqueda. Este módulo es el único
// que traduce esos parámetros a una consulta de Prisma, y lo usan tanto la
// página /reportes como GET /api/reportes (a través de buscarReportes).

export type EstadoFiltro = "ACTIVO" | "REENCONTRADA" | "TODOS";

export interface FiltrosReporte {
  tipo?: TipoReporte;
  estado: EstadoFiltro;
  especie?: (typeof ESPECIES)[number];
  tamano?: Tamano;
  zona?: string;
  color?: string;
  desde?: string; // YYYY-MM-DD
  hasta?: string; // YYYY-MM-DD
}

type Parametros = Record<string, string | string[] | undefined>;

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const LARGO_MAXIMO_TEXTO = 60;

function leerTexto(parametros: Parametros, clave: string): string | undefined {
  const crudo = parametros[clave];
  const valor = (Array.isArray(crudo) ? crudo[0] : crudo)?.trim();
  return valor ? valor.slice(0, LARGO_MAXIMO_TEXTO) : undefined;
}

function leerFecha(parametros: Parametros, clave: string): string | undefined {
  const valor = leerTexto(parametros, clave);
  if (!valor || !FECHA_ISO.test(valor)) return undefined;
  return Number.isNaN(instanteColombia(valor).getTime()) ? undefined : valor;
}

export function leerFiltros(parametros: Parametros): FiltrosReporte {
  const tipo = leerTexto(parametros, "tipo");
  const estado = leerTexto(parametros, "estado");
  const especie = leerTexto(parametros, "especie");
  const tamano = leerTexto(parametros, "tamano");

  let desde = leerFecha(parametros, "desde");
  let hasta = leerFecha(parametros, "hasta");
  // Un rango invertido es casi siempre un error de dedo: se corrige en
  // lugar de devolver cero resultados sin explicación.
  if (desde && hasta && desde > hasta) {
    [desde, hasta] = [hasta, desde];
  }

  return {
    tipo: tipo === "PERDIDA" || tipo === "ENCONTRADA" ? tipo : undefined,
    estado:
      estado === "REENCONTRADA" || estado === "TODOS" ? estado : "ACTIVO",
    especie: ESPECIES.find((e) => e === especie),
    tamano:
      tamano === "PEQUENO" || tamano === "MEDIANO" || tamano === "GRANDE"
        ? tamano
        : undefined,
    zona: leerTexto(parametros, "zona"),
    color: leerTexto(parametros, "color"),
    desde,
    hasta,
  };
}

export function construirConsulta(
  filtros: FiltrosReporte
): Prisma.ReporteWhereInput {
  const where: Prisma.ReporteWhereInput = {};

  if (filtros.tipo) where.tipo = filtros.tipo;
  if (filtros.estado !== "TODOS") where.estado = filtros.estado;
  if (filtros.especie) where.especie = filtros.especie;
  if (filtros.tamano) where.tamano = filtros.tamano;
  // Zona y color NO se filtran aquí: Postgres distingue tildes ("fatima" no
  // encontraría "Fátima"). Se filtran después con coincideConTexto.

  if (filtros.desde || filtros.hasta) {
    // Los días del filtro son días en Colombia; "hasta" incluye todo ese
    // día, por eso se compara contra el inicio del día siguiente.
    where.fecha = {};
    if (filtros.desde) {
      where.fecha.gte = instanteColombia(filtros.desde);
    }
    if (filtros.hasta) {
      const finDelDia = instanteColombia(filtros.hasta);
      finDelDia.setUTCDate(finDelDia.getUTCDate() + 1);
      where.fecha.lt = finDelDia;
    }
  }

  return where;
}

// Filtro de los campos de texto libre (zona y color), sin distinguir
// mayúsculas, tildes ni espacios de más. El color además acepta sinónimos:
// buscar "marrón" encuentra "Café con blanco".
export function coincideConTexto(
  reporte: { zona: string; color: string },
  filtros: Pick<FiltrosReporte, "zona" | "color">
): boolean {
  if (filtros.zona && !contieneTexto(reporte.zona, filtros.zona)) return false;
  if (filtros.color) {
    const buscadas = familiasDeColor(filtros.color);
    const delReporte = familiasDeColor(reporte.color);
    const mismaFamilia = Array.from(buscadas).some((f) => delReporte.has(f));
    if (!mismaFamilia && !contieneTexto(reporte.color, filtros.color)) return false;
  }
  return true;
}

// Filtros de detalle (los del panel), sin contar las pestañas de tipo/estado.
export function contarFiltrosActivos(filtros: FiltrosReporte): number {
  return [
    filtros.especie,
    filtros.tamano,
    filtros.zona,
    filtros.color,
    filtros.desde,
    filtros.hasta,
  ].filter(Boolean).length;
}

// Construye la URL del listado conservando los filtros actuales y aplicando
// los cambios indicados (undefined elimina el parámetro).
export function urlConFiltros(
  filtros: FiltrosReporte,
  cambios: Partial<Record<keyof FiltrosReporte, string | undefined>> = {}
): string {
  const combinados: Record<string, string | undefined> = {
    ...filtros,
    ...cambios,
  };
  const parametros = new URLSearchParams();
  for (const [clave, valor] of Object.entries(combinados)) {
    if (!valor) continue;
    if (clave === "estado" && valor === "ACTIVO") continue; // valor por defecto
    parametros.set(clave, valor);
  }
  const query = parametros.toString();
  return query ? `/reportes?${query}` : "/reportes";
}
