import datos from "../../prisma/cuentas-prueba.json";

// Cuentas de prueba para las pruebas de usabilidad. La pantalla de login las
// muestra (con relleno de un clic) SOLO si .env define
// MOSTRAR_CUENTAS_PRUEBA=true: en un servidor público no debe estar activo.
// Se crean en la base de datos con `npm run cuentas:prueba`.

export interface CuentaPrueba {
  etiqueta: string;
  usuario: string;
  contrasena: string;
}

const ETIQUETAS = {
  CIUDADANO: "Ciudadano",
  VETERINARIA: "Veterinaria",
  REFUGIO: "Refugio",
} as const;

// Nunca se muestran en producción, aunque la variable esté activa por error.
function visibles(): boolean {
  return process.env.MOSTRAR_CUENTAS_PRUEBA === "true" && process.env.NODE_ENV !== "production";
}

export function cuentasPrueba(): CuentaPrueba[] | null {
  if (!visibles()) return null;
  return datos.cuentas.map((cuenta) => ({
    etiqueta: ETIQUETAS[cuenta.rol as keyof typeof ETIQUETAS],
    usuario: cuenta.email,
    contrasena: datos.contrasena,
  }));
}

// El administrador no vive en la base de datos: sale de .env.
export function cuentaPruebaAdmin(): CuentaPrueba | null {
  if (!visibles()) return null;
  const usuario = process.env.ADMIN_USUARIO;
  const contrasena = process.env.ADMIN_CONTRASENA;
  return usuario && contrasena ? { etiqueta: "Administrador", usuario, contrasena } : null;
}
