import { z } from "zod";

// Validación de cuentas reales (HU-16 ciudadano, HU-17 veterinaria).
// Separado de validacion.ts (que es sobre reportes) para no mezclar temas.

export const registroSchema = z
  .object({
    nombre: z.string().trim().min(1, "El nombre es obligatorio.").max(80),
    email: z.string().trim().email("Correo inválido.").max(120).toLowerCase(),
    contrasena: z.string().min(6, "La contraseña debe tener al menos 6 caracteres.").max(100),
    rol: z.enum(["CIUDADANO", "VETERINARIA", "REFUGIO"], {
      errorMap: () => ({ message: "Selecciona un tipo de cuenta." }),
    }),
    nombreClinica: z.string().trim().max(120).optional().or(z.literal("")),
    nombreRefugio: z.string().trim().max(120).optional().or(z.literal("")),
  })
  .superRefine((datos, ctx) => {
    if (datos.rol === "VETERINARIA" && !datos.nombreClinica) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nombreClinica"],
        message: "El nombre de la clínica o veterinaria es obligatorio.",
      });
    }
    if (datos.rol === "REFUGIO" && !datos.nombreRefugio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nombreRefugio"],
        message: "El nombre del refugio o fundación es obligatorio.",
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

// HU-18: datos públicos de una veterinaria o refugio en el directorio de
// "a quién acudir con una mascota encontrada".
export const establecimientoSchema = z
  .object({
    telefono: z
      .string()
      .trim()
      .max(30, "Máximo 30 caracteres.")
      .regex(/^[+\d\s()-]*$/, "Escribe un teléfono válido.")
      .optional()
      .or(z.literal("")),
    direccion: z.string().trim().max(160, "Máximo 160 caracteres.").optional().or(z.literal("")),
    latitud: z.coerce.number().min(-90).max(90).nullable().optional(),
    longitud: z.coerce.number().min(-180).max(180).nullable().optional(),
    recibeEncontradas: z.boolean(),
  })
  .superRefine((datos, ctx) => {
    // Para figurar en el directorio hay que poder llamar y ubicar el lugar.
    if (!datos.recibeEncontradas) return;
    if (!datos.telefono) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["telefono"],
        message: "Para aparecer en el directorio necesitas un teléfono.",
      });
    }
    if (datos.latitud == null || datos.longitud == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["latitud"],
        message: "Marca en el mapa dónde queda tu local.",
      });
    }
  });

export type EstablecimientoFormData = z.infer<typeof establecimientoSchema>;
