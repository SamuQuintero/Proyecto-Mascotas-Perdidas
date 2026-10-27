import { z } from "zod";
import { COLORES_OJOS, LARGOS_PELAJE, PATRONES_PELAJE } from "@/lib/felinos";
import { instanteColombia } from "@/lib/formato";

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
  // Fecha ("YYYY-MM-DD") y hora ("HH:mm") en hora de Colombia en que se
  // perdió o se encontró la mascota. Se validan por separado para mostrar
  // el error en el campo correcto, y juntas (abajo) para no aceptar un
  // momento futuro.
  fecha: z
    .string({ required_error: "La fecha es obligatoria." })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha es obligatoria.")
    .refine(
      (valor) => !Number.isNaN(instanteColombia(valor).getTime()),
      "Fecha inválida."
    )
    .refine(
      (valor) => instanteColombia(valor).getTime() <= Date.now(),
      "La fecha no puede ser futura."
    ),
  hora: z
    .string({ required_error: "La hora es obligatoria." })
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Indica la hora aproximada."),
  raza: z.string().trim().max(60).optional().or(z.literal("")),
  nombre: z.string().trim().max(60).optional().or(z.literal("")),
  tieneCollar: z.enum(["SI", "NO", "NO_SE"]).optional(),
  senasParticulares: z.string().trim().max(500).optional().or(z.literal("")),
  // HU-24: señas propias de los gatos (se ignoran si la especie no es Gato).
  patronPelaje: z.enum(PATRONES_PELAJE).optional().or(z.literal("")),
  largoPelaje: z.enum(LARGOS_PELAJE).optional().or(z.literal("")),
  colorOjos: z.enum(COLORES_OJOS).optional().or(z.literal("")),
  esDeInterior: z.enum(["SI", "NO", "NO_SE"]).optional().or(z.literal("")),
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
  // FormData envía los booleanos como texto: z.coerce.boolean convertiría
  // "false" en true (cualquier string no vacío es truthy), así que se
  // interpreta explícitamente.
  reportanteAnonimo: z.preprocess(
    (valor) => valor === true || valor === "true",
    z.boolean()
  ),
};

export const reporteSchema = z
  .object({
    tipo: z.enum(["PERDIDA", "ENCONTRADA"]),
    ...camposComunes,
  })
  .superRefine((datos, ctx) => {
    // Margen de 5 minutos por diferencias de reloj entre dispositivos.
    const instante = instanteColombia(datos.fecha, datos.hora).getTime();
    if (instante > Date.now() + 5 * 60 * 1000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hora"],
        message: "La fecha y hora no pueden estar en el futuro.",
      });
    }

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

// HU-8: perfil digital de la mascota. El teléfono es obligatorio porque el
// objetivo del QR es que quien la encuentre pueda llamar a su familia.
export const mascotaSchema = z.object({
  nombre: z
    .string({ required_error: "El nombre es obligatorio." })
    .trim()
    .min(1, "El nombre es obligatorio.")
    .max(60, "Máximo 60 caracteres."),
  especie: camposComunes.especie,
  raza: camposComunes.raza,
  color: camposComunes.color,
  tamano: camposComunes.tamano,
  senasParticulares: camposComunes.senasParticulares,
  patronPelaje: camposComunes.patronPelaje,
  largoPelaje: camposComunes.largoPelaje,
  colorOjos: camposComunes.colorOjos,
  esDeInterior: camposComunes.esDeInterior,
  contactoNombre: z
    .string({ required_error: "Tu nombre es obligatorio." })
    .trim()
    .min(1, "Tu nombre es obligatorio.")
    .max(80, "Máximo 80 caracteres."),
  contactoTelefono: z
    .string({ required_error: "El teléfono es obligatorio." })
    .trim()
    .min(7, "Escribe un teléfono válido.")
    .max(30, "Máximo 30 caracteres.")
    .regex(/^[+\d\s()-]+$/, "Escribe un teléfono válido."),
  contactoEmail: camposComunes.contactoEmail,
});

export type MascotaFormData = z.infer<typeof mascotaSchema>;
