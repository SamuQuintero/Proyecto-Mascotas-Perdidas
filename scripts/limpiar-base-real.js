// Deja la base de datos lista para recibir registros reales.
//
// Es destructivo e irreversible: por defecto solo MUESTRA lo que hay.
//
// Uso:  node scripts/limpiar-base-real.js                      (solo muestra)
//       node scripts/limpiar-base-real.js --confirmar          (borra las CUENTAS)
//       node scripts/limpiar-base-real.js --confirmar --todo   (borra además reportes,
//             perfiles de mascotas, vacunas, animales en resguardo, mensajes y fotos)
//
// Úsalo antes de abrir la aplicación al público.

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const CARPETA_FOTOS = path.join(__dirname, "..", "public", "uploads");
const confirmar = process.argv.includes("--confirmar");

async function main() {
  const antes = {
    mensajes: await prisma.mensaje.count(),
    vacunas: await prisma.vacuna.count(),
    animalesResguardo: await prisma.animalResguardo.count(),
    mascotas: await prisma.mascota.count(),
    reportes: await prisma.reporte.count(),
    usuarios: await prisma.usuario.count(),
  };
  console.log("En la base hay:", antes);
  const correos = (await prisma.usuario.findMany({ select: { email: true, rol: true } })).map((u) => `${u.email} (${u.rol})`);
  console.log("Cuentas:", correos);

  if (!confirmar) {
    console.log("\nNo se borró nada. Con --confirmar se borran las cuentas; con --confirmar --todo, también todos los datos.");
    return;
  }

  const todo = process.argv.includes("--todo");
  // Orden: primero lo que depende de otras tablas.
  if (todo) {
    await prisma.mensaje.deleteMany();
    await prisma.vacuna.deleteMany();
    await prisma.animalResguardo.deleteMany();
    await prisma.mascota.deleteMany();
    await prisma.reporte.deleteMany();
  }
  await prisma.usuario.deleteMany();

  let fotos = 0;
  if (todo && fs.existsSync(CARPETA_FOTOS)) {
    for (const f of fs.readdirSync(CARPETA_FOTOS)) {
      if (/^[\w-]+\.(jpg|png|webp)$/.test(f)) {
        fs.rmSync(path.join(CARPETA_FOTOS, f), { force: true });
        fotos++;
      }
    }
  }

  const despues = {
    mensajes: await prisma.mensaje.count(),
    vacunas: await prisma.vacuna.count(),
    animalesResguardo: await prisma.animalResguardo.count(),
    mascotas: await prisma.mascota.count(),
    reportes: await prisma.reporte.count(),
    usuarios: await prisma.usuario.count(),
  };
  console.log(`\nBorrado ${todo ? "completo" : "de cuentas"} (${fotos} fotos eliminadas). Ahora hay:`, despues);
}

main()
  .catch((e) => {
    console.error("Error:", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
