// Protección de los scripts que crean datos de prueba, cuentas con contraseñas
// conocidas o que borran datos: solo corren contra una base local, salvo que
// se pida expresamente con PERMITIR_BD_REAL=si. Así un `npm run demo` o
// `npm run cuentas:prueba` lanzado por descuido no deja cuentas conocidas en
// la base real con datos de clientes.

const fs = require("fs");
const path = require("path");

function urlBaseDeDatos() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const linea = fs
      .readFileSync(path.join(__dirname, "..", ".env"), "utf8")
      .split(/\r?\n/)
      .find((l) => l.startsWith("DATABASE_URL="));
    return linea ? linea.slice("DATABASE_URL=".length).replace(/^"|"$/g, "") : "";
  } catch {
    return "";
  }
}

function exigirBaseLocal(nombreScript) {
  const url = urlBaseDeDatos();
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  if (local || process.env.PERMITIR_BD_REAL === "si") return;
  console.error(
    `Se cancela ${nombreScript}: DATABASE_URL apunta a una base que no es local.\n` +
      "Este script crea o borra datos de prueba. Úsalo con una base de desarrollo, o, si de verdad\n" +
      "quieres ejecutarlo contra la base real, repite el comando con PERMITIR_BD_REAL=si."
  );
  process.exit(1);
}

module.exports = { exigirBaseLocal };
