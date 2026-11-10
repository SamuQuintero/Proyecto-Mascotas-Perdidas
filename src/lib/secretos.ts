// Secretos de firma de las sesiones. En producción son obligatorios y deben
// ser largos y aleatorios: si faltan, la aplicación se niega a firmar sesiones
// en vez de caer en una clave conocida (que permitiría falsificar cookies).
// En desarrollo se usa una clave fija y se avisa una vez.

export const LARGO_MINIMO_SECRETO = 32;

const avisados = new Set<string>();

export function leerSecreto(nombre: string, respaldoDesarrollo: string | null): string {
  const valor = process.env[nombre];
  if (process.env.NODE_ENV === "production") {
    if (!valor || valor.length < LARGO_MINIMO_SECRETO) {
      throw new Error(
        `${nombre} debe estar definido en producción con al menos ${LARGO_MINIMO_SECRETO} caracteres aleatorios.`
      );
    }
    return valor;
  }
  if (valor) return valor;
  if (respaldoDesarrollo === null) {
    throw new Error(`${nombre} no está definido.`);
  }
  if (!avisados.has(nombre)) {
    avisados.add(nombre);
    console.warn(
      `[seguridad] ${nombre} no está definido en .env; usando una clave de desarrollo. ` +
        "Genera una con: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return respaldoDesarrollo;
}
