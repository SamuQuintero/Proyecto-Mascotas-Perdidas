// Crea (o actualiza) las cuentas de prueba para pruebas de usabilidad:
// una de cada rol (ciudadano, veterinaria, refugio). El administrador no
// está en la base de datos: sus credenciales salen de .env.
//
// Uso:  npm run cuentas:prueba
//
// Es idempotente: se puede correr varias veces. Los datos salen de
// prisma/cuentas-prueba.json (el mismo archivo que usa la pantalla de login
// cuando MOSTRAR_CUENTAS_PRUEBA=true). El hash de contraseña usa el mismo
// formato que src/lib/contrasenas.ts: "<salt-hex>:<hash-hex>" con scrypt.

const { randomBytes, scryptSync } = require("crypto");
const { PrismaClient } = require("@prisma/client");
const { contrasena, cuentas } = require("../prisma/cuentas-prueba.json");

function hash(clave) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(clave, salt, 64).toString("hex")}`;
}

const prisma = new PrismaClient();

async function main() {
  for (const cuenta of cuentas) {
    const datos = {
      nombre: cuenta.nombre,
      rol: cuenta.rol,
      nombreClinica: cuenta.nombreClinica ?? null,
      nombreRefugio: cuenta.nombreRefugio ?? null,
      telefono: cuenta.telefono ?? null,
      direccion: cuenta.direccion ?? null,
      latitud: cuenta.latitud ?? null,
      longitud: cuenta.longitud ?? null,
      // Veterinaria y refugio aparecen en "Dónde acudir" para poder probarlo.
      recibeEncontradas: cuenta.rol !== "CIUDADANO",
      // El ciudadano ya viene suscrito a avisos en el centro de Pasto, 5 km.
      ...(cuenta.rol === "CIUDADANO"
        ? { avisoLatitud: 1.2136, avisoLongitud: -77.2811, avisoRadioKm: 5 }
        : {}),
    };
    await prisma.usuario.upsert({
      where: { email: cuenta.email },
      create: { email: cuenta.email, contrasenaHash: hash(contrasena), ...datos },
      update: { contrasenaHash: hash(contrasena), ...datos },
    });
    console.log(`OK  ${cuenta.rol.padEnd(11)} ${cuenta.email}`);
  }
}

main()
  .catch((error) => {
    console.error("No se pudieron crear las cuentas:", error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
