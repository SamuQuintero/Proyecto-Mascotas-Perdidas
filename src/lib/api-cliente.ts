import type { EstadoReporte } from "@/lib/tipos";

// Llamadas a la API usadas desde componentes cliente del administrador.
// Devuelve null si todo salió bien, o el mensaje de error a mostrar.
export async function cambiarEstadoReporte(
  id: string,
  estado: EstadoReporte
): Promise<string | null> {
  try {
    const respuesta = await fetch(`/api/reportes/${id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    if (respuesta.ok) return null;
    const datos = await respuesta.json().catch(() => ({}));
    return datos.error ?? "No se pudo actualizar el estado.";
  } catch {
    return "No se pudo conectar con el servidor.";
  }
}
