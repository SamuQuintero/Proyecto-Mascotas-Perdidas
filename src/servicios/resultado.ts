// Resultado de un caso de uso. Los servicios no conocen HTTP: devuelven un
// valor o una "falla" con un tipo de negocio, y la capa web (rutas) decide
// qué código HTTP corresponde (ver src/infraestructura/respuestasHttp.ts).
// Así la misma regla serviría igual desde una ruta, una tarea programada o
// una prueba.

export type Falla =
  | { tipo: "NO_ENCONTRADO"; mensaje: string }
  | { tipo: "SIN_SESION"; mensaje: string }
  | { tipo: "PROHIBIDO"; mensaje: string }
  | { tipo: "INVALIDO"; errores: Record<string, string> }
  | { tipo: "CONFLICTO"; mensaje: string }
  | { tipo: "DEMASIADO_PRONTO"; mensaje: string };

export type Resultado<T> = { ok: true; valor: T } | { ok: false; falla: Falla };

export const ok = <T>(valor: T): Resultado<T> => ({ ok: true, valor });
export const falla = (f: Falla): Resultado<never> => ({ ok: false, falla: f });

export const noEncontrado = (mensaje: string) => falla({ tipo: "NO_ENCONTRADO", mensaje });
export const invalido = (errores: Record<string, string>) => falla({ tipo: "INVALIDO", errores });

// Quién hace la petición, para decidir permisos (ver propiedad.ts).
export interface Sesion {
  usuarioId: string | null;
  esAdmin: boolean;
}

// Sin permiso: 401 si ni siquiera hay una sesión iniciada; 403 si la hay
// pero no es la dueña del recurso.
export function sinPermiso(
  sesion: Sesion,
  mensajes: { sinSesion: string; prohibido: string }
): Resultado<never> {
  const haySesion = sesion.esAdmin || sesion.usuarioId !== null;
  return haySesion
    ? falla({ tipo: "PROHIBIDO", mensaje: mensajes.prohibido })
    : falla({ tipo: "SIN_SESION", mensaje: mensajes.sinSesion });
}
