export type TipoReporte = "PERDIDA" | "ENCONTRADA";
export type Tamano = "PEQUENO" | "MEDIANO" | "GRANDE";
export type EstadoReporte = "ACTIVO" | "REENCONTRADA";

export interface Reporte {
  id: string;
  tipo: TipoReporte;
  especie: string;
  color: string;
  tamano: Tamano;
  zona: string;
  fecha: string;
  raza: string | null;
  nombre: string | null;
  tieneCollar: boolean | null;
  senasParticulares: string | null;
  fotoUrl: string;
  latitud: number;
  longitud: number;
  contactoNombre: string | null;
  contactoTelefono: string | null;
  contactoEmail: string | null;
  reportanteAnonimo: boolean;
  estado: EstadoReporte;
  reencontradaEn: string | null;
  usuarioId: string | null;
  renovadoEn: string;
  renovaciones: number;
  creadoEn: string;
  actualizadoEn: string;
}

export const ETIQUETA_TAMANO: Record<Tamano, string> = {
  PEQUENO: "Pequeño",
  MEDIANO: "Mediano",
  GRANDE: "Grande",
};

// Los componentes cliente reciben el reporte serializado (fechas como
// string). Prisma devuelve Date; esta función hace la conversión explícita
// en lugar de un cast que ocultaría la diferencia.
export function serializarReporte(reporte: {
  fecha: Date;
  creadoEn: Date;
  actualizadoEn: Date;
  reencontradaEn: Date | null;
  renovadoEn: Date;
  [clave: string]: unknown;
}): Reporte {
  return {
    ...reporte,
    fecha: reporte.fecha.toISOString(),
    creadoEn: reporte.creadoEn.toISOString(),
    actualizadoEn: reporte.actualizadoEn.toISOString(),
    reencontradaEn: reporte.reencontradaEn?.toISOString() ?? null,
    renovadoEn: reporte.renovadoEn.toISOString(),
  } as Reporte;
}
