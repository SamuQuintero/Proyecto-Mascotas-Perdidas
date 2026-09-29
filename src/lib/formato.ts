// Fechas y horas de la aplicación. Todo se interpreta y se muestra en hora
// de Colombia (Pasto, UTC-5, sin horario de verano), sin importar la zona
// horaria del servidor o del navegador: así la hora que alguien escribe en
// el formulario es exactamente la que ven los demás.

export const ZONA_HORARIA = "America/Bogota";
const DESFASE_COLOMBIA = "-05:00";
const SOLO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

// Convierte la fecha ("YYYY-MM-DD") y hora ("HH:mm") de un formulario, dadas
// en hora de Colombia, al instante exacto que se guarda en la base.
export function instanteColombia(fecha: string, hora = "00:00"): Date {
  return new Date(`${fecha}T${hora}:00${DESFASE_COLOMBIA}`);
}

// Una fecha sin hora ("YYYY-MM-DD", p. ej. de un filtro) se interpreta como
// ese día en Colombia; si no, `new Date` la tomaría como medianoche UTC y
// la mostraría un día antes.
function aFecha(valor: string | Date): Date {
  if (typeof valor === "string" && SOLO_FECHA.test(valor)) {
    return instanteColombia(valor, "12:00");
  }
  return new Date(valor);
}

export function formatearFecha(
  valor: string | Date,
  estilo: "corta" | "larga" = "corta"
): string {
  return aFecha(valor).toLocaleDateString("es-CO", {
    timeZone: ZONA_HORARIA,
    day: "numeric",
    month: estilo === "larga" ? "long" : "short",
    year: "numeric",
  });
}

export function formatearHora(valor: string | Date): string {
  return aFecha(valor).toLocaleTimeString("es-CO", {
    timeZone: ZONA_HORARIA,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// "8 de septiembre de 2026 · 3:30 p. m."
export function formatearFechaHora(
  valor: string | Date,
  estilo: "corta" | "larga" = "larga"
): string {
  return `${formatearFecha(valor, estilo)} · ${formatearHora(valor)}`;
}

// Valor "YYYY-MM-DD" (en Colombia) para un <input type="date">.
export function fechaParaInput(valor: string | Date): string {
  return aFecha(valor).toLocaleDateString("en-CA", { timeZone: ZONA_HORARIA });
}

// Valor "HH:mm" (en Colombia) para un <input type="time">.
export function horaParaInput(valor: string | Date): string {
  return aFecha(valor).toLocaleTimeString("en-GB", {
    timeZone: ZONA_HORARIA,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

export function haceCuanto(valor: string | Date, ahora = new Date()): string {
  const minutos = Math.floor((ahora.getTime() - aFecha(valor).getTime()) / 60000);
  if (minutos < 1) return "Justo ahora";
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return horas === 1 ? "Hace 1 hora" : `Hace ${horas} horas`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return "Ayer";
  if (dias < 30) return `Hace ${dias} días`;
  const meses = Math.floor(dias / 30);
  return meses === 1 ? "Hace 1 mes" : `Hace ${meses} meses`;
}
