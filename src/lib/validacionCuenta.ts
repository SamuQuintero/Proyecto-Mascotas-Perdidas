import { z } from "zod";

// Validación de cuentas reales (HU-16 ciudadano, HU-17 veterinaria).
// Separado de validacion.ts (que es sobre reportes) para no mezclar temas.

export const registroSchema = z
  .object({
    nombre: z.string().trim().min(1, "El nombre es obligatorio.").max(80),
    email: z.string().trim().email("Correo inválido.").max(120).toLowerCase(),
    contrasena: z.string().min(6, "La contraseña debe tener al menos 6 caracteres.").max(100),
    rol: z.enum(["CIUDADANO", "VETERINARIA"], {
      errorMap: () => ({ message: "Selecciona un tipo de cuenta." }),
    }),
    nombreClinica: z.string().trim().max(120).optional().or(z.literal("")),
  })
  .superRefine((datos, ctx) => {
    if (datos.rol === "VETERINARIA" && !datos.nombreClinica) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nombreClinica"],
        message: "El nombre de la clínica o veterinaria es obligatorio.",
      });
    }
  });

export type RegistroFormData = z.infer<typeof registroSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Correo inválido.").max(120).toLowerCase(),
  contrasena: z.string().min(1, "La contraseña es obligatoria.").max(100),
});

// HU-16: suscripción a avisos de cercanía (punto + radio en km).
export const suscripcionSchema = z.object({
  latitud: z.coerce.number().min(-90).max(90),
  longitud: z.coerce.number().min(-180).max(180),
  radioKm: z.coerce.number().int().min(1, "Mínimo 1 km.").max(50, "Máximo 50 km."),
});
