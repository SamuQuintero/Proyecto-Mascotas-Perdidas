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
