// HU-19 / HU-23: quién puede gestionar (renovar, editar) un reporte o un
// perfil de mascota. El dueño es la cuenta con la que se publicó; el admin
// puede gestionar cualquiera. Un reporte publicado sin sesión no tiene dueño
// y solo lo gestiona el admin.

export function puedeGestionar(
  recurso: { usuarioId: string | null },
  sesion: { usuarioId: string | null; esAdmin: boolean }
): boolean {
  if (sesion.esAdmin) return true;
  return recurso.usuarioId !== null && recurso.usuarioId === sesion.usuarioId;
}

// HU-12: el admin abre y cierra casos. El dueño solo puede cerrar el suyo
// ("ya apareció"); reabrirlo, por si se marcó por error, lo decide el admin.
export function puedeCambiarEstado(
  recurso: { usuarioId: string | null },
  sesion: { usuarioId: string | null; esAdmin: boolean },
  nuevoEstado: "ACTIVO" | "REENCONTRADA"
): boolean {
  if (sesion.esAdmin) return true;
  return nuevoEstado === "REENCONTRADA" && puedeGestionar(recurso, sesion);
}
