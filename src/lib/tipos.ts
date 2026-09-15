export type TipoReporte = "PERDIDA" | "ENCONTRADA";
export type Tamano = "PEQUENO" | "MEDIANO" | "GRANDE";
export type EstadoReporte = "ACTIVO";

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
  creadoEn: string;
}

export const ETIQUETA_TAMANO: Record<Tamano, string> = {
  PEQUENO: "Pequeño",
  MEDIANO: "Mediano",
  GRANDE: "Grande",
};
