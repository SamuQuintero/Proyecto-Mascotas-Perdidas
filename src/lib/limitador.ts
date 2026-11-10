// Limitador de peticiones de ventana fija, en memoria. No depende de Node
// (corre también en el middleware). Frena la fuerza bruta de contraseñas, el
// spam de registros y mensajes y el abuso de las subidas.
//
// Limitación conocida: el contador vive en la memoria de cada instancia del
// servidor. En un despliegue con varias instancias (serverless) el límite
// efectivo es por instancia; para un límite global habría que llevarlo a un
// almacén compartido (Redis/Upstash). Se documenta en el informe.

export interface ResultadoLimite {
  permitido: boolean;
  /** Segundos que faltan para poder reintentar (0 si está permitido). */
  reintentarEnSeg: number;
}

interface Ventana {
  inicio: number;
  cuenta: number;
}

const MAXIMO_CLAVES = 20_000;

export class Limitador {
  private ventanas = new Map<string, Ventana>();

  /** Registra un intento y dice si cabe dentro del límite. */
  intentar(clave: string, limite: number, ventanaMs: number, ahora = Date.now()): ResultadoLimite {
    const v = this.vigente(clave, ventanaMs, ahora);
    v.cuenta += 1;
    if (v.cuenta <= limite) return { permitido: true, reintentarEnSeg: 0 };
    return { permitido: false, reintentarEnSeg: Math.max(1, Math.ceil((v.inicio + ventanaMs - ahora) / 1000)) };
  }

  /** Consulta sin sumar (para bloquear tras N fallos ya contados). */
  bloqueado(clave: string, limite: number, ventanaMs: number, ahora = Date.now()): ResultadoLimite {
    const v = this.ventanas.get(clave);
    if (!v || ahora - v.inicio >= ventanaMs || v.cuenta < limite) {
      return { permitido: true, reintentarEnSeg: 0 };
    }
    return { permitido: false, reintentarEnSeg: Math.max(1, Math.ceil((v.inicio + ventanaMs - ahora) / 1000)) };
  }

  /** Suma un fallo sin evaluar el límite. */
  registrar(clave: string, ventanaMs: number, ahora = Date.now()): void {
    this.vigente(clave, ventanaMs, ahora).cuenta += 1;
  }

  olvidar(clave: string): void {
    this.ventanas.delete(clave);
  }

  private vigente(clave: string, ventanaMs: number, ahora: number): Ventana {
    let v = this.ventanas.get(clave);
    if (!v || ahora - v.inicio >= ventanaMs) {
      if (this.ventanas.size >= MAXIMO_CLAVES) this.limpiar(ahora, ventanaMs);
      v = { inicio: ahora, cuenta: 0 };
      this.ventanas.set(clave, v);
    }
    return v;
  }

  // Evita que un atacante llene la memoria con claves distintas.
  private limpiar(ahora: number, ventanaMs: number) {
    this.ventanas.forEach((v, clave) => {
      if (ahora - v.inicio >= ventanaMs) this.ventanas.delete(clave);
    });
    if (this.ventanas.size >= MAXIMO_CLAVES) this.ventanas.clear();
  }
}

/** IP del cliente. Detrás de Vercel/proxy, la plataforma fija x-forwarded-for. */
export function ipCliente(cabeceras: { get(nombre: string): string | null }): string {
  const reenviada = cabeceras.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (reenviada || cabeceras.get("x-real-ip") || "desconocida").slice(0, 64);
}
