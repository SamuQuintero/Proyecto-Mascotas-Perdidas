import { z } from "zod";

// HU-17: una veterinaria registra una vacuna en el carnet digital de una
// mascota (perfil con QR, HU-8).
export const vacunaSchema = z.object({
  nombre: z
    .string({ required_error: "El nombre de la vacuna es obligatorio." })
    .trim()
    .min(1, "El nombre de la vacuna es obligatorio.")
    .max(80, "Máximo 80 caracteres."),
  fecha: z
    .string({ required_error: "La fecha es obligatoria." })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida.")
    .refine((valor) => !Number.isNaN(Date.parse(valor)), "Fecha inválida.")
    .refine(
      (valor) => new Date(valor).getTime() <= Date.now() + 24 * 60 * 60 * 1000,
      "La fecha no puede ser futura."
    ),
});

export type VacunaFormData = z.infer<typeof vacunaSchema>;
