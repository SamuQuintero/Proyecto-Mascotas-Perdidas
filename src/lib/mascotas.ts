import type { MascotaFormData } from "@/lib/validacion";

// Convierte los datos ya validados del perfil de mascota en los campos que
// se guardan. Lo comparten la creación (POST) y la edición (PATCH, HU-23)
// para que ambos guarden exactamente igual.
export function camposMascotaParaGuardar(datos: MascotaFormData) {
  return {
    nombre: datos.nombre,
    especie: datos.especie,
    raza: datos.raza || null,
    color: datos.color,
    tamano: datos.tamano,
    senasParticulares: datos.senasParticulares || null,
    contactoNombre: datos.contactoNombre,
    contactoTelefono: datos.contactoTelefono,
    contactoEmail: datos.contactoEmail || null,
  };
}
