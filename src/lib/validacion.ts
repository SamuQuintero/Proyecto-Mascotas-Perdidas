import { z } from "zod";

// Esquema único de validación para los datos mínimos obligatorios (HU-13),
// reutilizado por el flujo de mascota perdida (HU-1, HU-3) y el de
// mascota encontrada (HU-2, HU-5). Mantener un solo esquema evita que los
// dos formularios queden con reglas distintas o incompletas.

export const ESPECIES = ["Perro", "Gato", "Otro"] as const;
export const TAMANOS = [
  { valor: "PEQUENO", etiqueta: "Pequeño" },
  { valor: "MEDIANO", etiqueta: "Mediano" },
  { valor: "GRANDE", etiqueta: "Grande" },
] as const;

export const FOTO_TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
export const FOTO_TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5 MB

const camposComunes = {
  especie: z.enum(ESPECIES, {
    errorMap: () => ({ message: "Selecciona una especie." }),
  }),
  color: z
    .string({ required_error: "El color es obligatorio." })
    .trim()
    .min(1, "El color es obligatorio.")
    .max(60, "Máximo 60 caracteres."),
  tamano: z.enum(["PEQUENO", "MEDIANO", "GRANDE"], {
    errorMap: () => ({ message: "Selecciona un tamaño." }),
  }),
  zona: z
    .string({ required_error: "La zona es obligatoria." })
    .trim()
    .min(1, "La zona es obligatoria.")
    .max(120, "Máximo 120 caracteres."),
  fecha: z
    .string({ required_error: "La fecha es obligatoria." })
    .refine((valor) => !Number.isNaN(Date.parse(valor)), "Fecha inválida.")
    .refine(
      (valor) => new Date(valor).getTime() <= Date.now(),
      "La fecha no puede ser futura."
    ),
  raza: z.string().trim().max(60).optional().or(z.literal("")),
  nombre: z.string().trim().max(60).optional().or(z.literal("")),
  tieneCollar: z.enum(["SI", "NO", "NO_SE"]).optional(),
  senasParticulares: z.string().trim().max(500).optional().or(z.literal("")),
  latitud: z.coerce
    .number({ invalid_type_error: "Selecciona un punto en el mapa." })
    .min(-90)
    .max(90),
  longitud: z.coerce
    .number({ invalid_type_error: "Selecciona un punto en el mapa." })
    .min(-180)
    .max(180),
  contactoNombre: z.string().trim().max(80).optional().or(z.literal("")),
  contactoTelefono: z.string().trim().max(30).optional().or(z.literal("")),
  contactoEmail: z
    .string()
    .trim()
    .email("Correo inválido.")
    .max(120)
    .optional()
    .or(z.literal("")),
  reportanteAnonimo: z.coerce.boolean().optional().default(false),
};

export const reporteSchema = z
  .object({
    tipo: z.enum(["PERDIDA", "ENCONTRADA"]),
    ...camposComunes,
  })
  .superRefine((datos, ctx) => {
    const tieneTelefono = Boolean(datos.contactoTelefono);
    const tieneEmail = Boolean(datos.contactoEmail);

    if (datos.tipo === "PERDIDA" && !tieneTelefono && !tieneEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contactoTelefono"],
        message:
          "Deja al menos un teléfono o correo para que puedan contactarte.",
      });
    }
  });

export type ReporteFormData = z.infer<typeof reporteSchema>;

export function primerErrorPorCampo(
  error: z.ZodError
): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const issue of error.issues) {
    const clave = issue.path.join(".") || "general";
    if (!errores[clave]) {
      errores[clave] = issue.message;
    }
  }
  return errores;
}
