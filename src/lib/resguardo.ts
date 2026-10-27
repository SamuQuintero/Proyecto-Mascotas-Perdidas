import { z } from "zod";
import { fechaParaInput, formatearFecha, instanteColombia } from "@/lib/formato";
import { ESPECIES } from "@/lib/validacion";

// HU-20: animales bajo resguardo de un refugio o rescatista. Validación y
// textos de "desde cuándo", sin tocar la base de datos.

export const animalResguardoSchema = z.object({
  especie: z.enum(ESPECIES, { errorMap: () => ({ message: "Selecciona una especie." }) }),
  nombre: z.string().trim().max(60, "Máximo 60 caracteres.").optional().or(z.literal("")),
  raza: z.string().trim().max(60, "Máximo 60 caracteres.").optional().or(z.literal("")),
  color: z
    .string({ required_error: "El color es obligatorio." })
    .trim()
    .min(1, "El color es obligatorio.")
    .max(60, "Máximo 60 caracteres."),
  tamano: z.enum(["PEQUENO", "MEDIANO", "GRANDE"], {
    errorMap: () => ({ message: "Selecciona un tamaño." }),
  }),
  senasParticulares: z.string().trim().max(500, "Máximo 500 caracteres.").optional().or(z.literal("")),
  // Día (hora de Colombia) en que el refugio recibió al animal.
  desde: z
    .string({ required_error: "Indica desde cuándo lo tienes." })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Indica desde cuándo lo tienes.")
    .refine((v) => !Number.isNaN(instanteColombia(v).getTime()), "Fecha inválida.")
    .refine((v) => v <= fechaParaInput(new Date()), "La fecha no puede ser futura."),
});

export type AnimalResguardoFormData = z.infer<typeof animalResguardoSchema>;

const DIA_MS = 24 * 60 * 60 * 1000;

// Días completos que lleva el animal en resguardo (0 = llegó hoy).
export function diasEnResguardo(desde: Date | string, ahora = new Date()): number {
  const inicio = fechaParaInput(desde);
  const hoy = fechaParaInput(ahora);
  const diferencia = instanteColombia(hoy, "12:00").getTime() - instanteColombia(inicio, "12:00").getTime();
  return Math.max(0, Math.round(diferencia / DIA_MS));
}

// "En resguardo desde el 3 mar 2026 (hace 12 días)"
export function textoResguardo(desde: Date | string, ahora = new Date()): string {
  const dias = diasEnResguardo(desde, ahora);
  const hace = dias === 0 ? "llegó hoy" : dias === 1 ? "hace 1 día" : `hace ${dias} días`;
  return `En resguardo desde el ${formatearFecha(desde)} (${hace})`;
}
