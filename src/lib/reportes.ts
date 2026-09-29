import { instanteColombia } from "@/lib/formato";
import type { ReporteFormData } from "@/lib/validacion";

// Convierte los datos ya validados del formulario en los campos que se
// guardan en la base. Lo comparten la creación (POST) y la edición
// (PATCH, HU-25) para que ambos guarden exactamente igual.
export function camposParaGuardar(datos: ReporteFormData) {
  const anonimo = datos.tipo === "ENCONTRADA" && datos.reportanteAnonimo;

  return {
    especie: datos.especie,
    color: datos.color,
    tamano: datos.tamano,
    zona: datos.zona,
    fecha: instanteColombia(datos.fecha, datos.hora),
    raza: datos.raza || null,
    nombre: datos.tipo === "PERDIDA" ? datos.nombre || null : null,
    tieneCollar:
      datos.tieneCollar === "SI"
        ? true
        : datos.tieneCollar === "NO"
          ? false
          : null,
    senasParticulares: datos.senasParticulares || null,
    latitud: datos.latitud,
    longitud: datos.longitud,
    // Un reporte anónimo no guarda contacto aunque el formulario lo traiga
    // (p. ej. si se escribió y luego se marcó la casilla de anónimo).
    contactoNombre: anonimo ? null : datos.contactoNombre || null,
    contactoTelefono: anonimo ? null : datos.contactoTelefono || null,
    contactoEmail: anonimo ? null : datos.contactoEmail || null,
    reportanteAnonimo: anonimo,
  };
}
