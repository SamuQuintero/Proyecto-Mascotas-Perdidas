// Memoria local del dispositivo (solo navegador). La aplicación no tiene
// cuentas, así que para "notificar al dueño" (HU-4, HU-7) el navegador
// recuerda qué reportes y perfiles de mascota se crearon desde él, y qué
// alertas ya se vieron. Si el almacenamiento no está disponible (modo
// privado, bloqueado), todo sigue funcionando: simplemente no hay campana.

const CLAVE_REPORTES = "petmatch:mis-reportes";
const CLAVE_MASCOTAS = "petmatch:mis-mascotas";
const CLAVE_VISTAS = "petmatch:alertas-vistas";
export const EVENTO_CAMBIO = "petmatch:dispositivo";

function leer(clave: string): string[] {
  try {
    const valor = JSON.parse(window.localStorage.getItem(clave) ?? "[]");
    return Array.isArray(valor) ? valor.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function guardar(clave: string, valores: string[]) {
  try {
    window.localStorage.setItem(clave, JSON.stringify(valores));
    window.dispatchEvent(new Event(EVENTO_CAMBIO));
  } catch {
    // Sin almacenamiento local: se ignora.
  }
}

function agregar(clave: string, id: string, maximo: number) {
  guardar(clave, [id, ...leer(clave).filter((v) => v !== id)].slice(0, maximo));
}

export const misReportes = () => leer(CLAVE_REPORTES);
export const recordarReporte = (id: string) => agregar(CLAVE_REPORTES, id, 30);

export const misMascotas = () => leer(CLAVE_MASCOTAS);
export const recordarMascota = (id: string) => agregar(CLAVE_MASCOTAS, id, 20);

// Una alerta se identifica por el par (mi reporte, reporte relacionado).
export const claveAlerta = (miReporte: string, otro: string) => `${miReporte}:${otro}`;
export const alertasVistas = () => new Set(leer(CLAVE_VISTAS));
export function marcarAlertasVistas(claves: string[]) {
  const vistas = alertasVistas();
  claves.forEach((clave) => vistas.add(clave));
  guardar(CLAVE_VISTAS, Array.from(vistas).slice(-500));
}
