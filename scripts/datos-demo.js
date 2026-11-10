// Crea datos de demostración realistas para mostrar el aplicativo: reportes de
// pérdida y hallazgo en Pasto (con coincidencias entre ellos), un caso cerrado,
// recordatorio de renovación, placas con carnet de vacunas, animales en
// resguardo y mensajes de chat. Las fotos son ilustraciones propias
// (prisma/demo-fotos), no imágenes de terceros.
//
// Uso:   npm run cuentas:prueba   (primero: crea las cuentas)
//        npm run demo             (crea los datos; se puede repetir)
// Borrar: npm run demo -- --borrar
//
// Los datos de demostración se reconocen por una marca invisible al final del nombre de contacto.

const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const { exigirBaseLocal } = require("./_guardia");
exigirBaseLocal("datos-demo");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const FOTOS = path.join(__dirname, "..", "prisma", "demo-fotos");
const UPLOADS = path.join(__dirname, "..", "public", "uploads");
// Marca invisible (separador invisible U+2063) al final del nombre de contacto:
// permite reconocer y borrar los datos de demostración sin que se vea en pantalla.
const MARCA = "⁣";
const horas = (h) => new Date(Date.now() - h * 3600 * 1000);

function subirFoto(nombre) {
  fs.mkdirSync(UPLOADS, { recursive: true });
  const archivo = `${randomUUID()}.jpg`;
  fs.copyFileSync(path.join(FOTOS, `${nombre}.jpg`), path.join(UPLOADS, archivo));
  return `/uploads/${archivo}`;
}

function quitarFoto(url) {
  const m = /^\/uploads\/([\w-]+\.jpg)$/.exec(url || "");
  if (m) fs.rmSync(path.join(UPLOADS, m[1]), { force: true });
}

async function borrarDemo() {
  const reportes = await prisma.reporte.findMany({ where: { contactoNombre: { endsWith: MARCA } } });
  const mascotas = await prisma.mascota.findMany({ where: { contactoNombre: { endsWith: MARCA } } });
  const animales = await prisma.animalResguardo.findMany({ where: { refugio: { email: "refugio@petmatch.test" }, nombre: { endsWith: MARCA } } });
  [...reportes, ...mascotas, ...animales].forEach((x) => quitarFoto(x.fotoUrl));
  await prisma.reporte.deleteMany({ where: { id: { in: reportes.map((r) => r.id) } } });
  await prisma.mascota.deleteMany({ where: { id: { in: mascotas.map((r) => r.id) } } });
  await prisma.animalResguardo.deleteMany({ where: { id: { in: animales.map((r) => r.id) } } });
}

async function main() {
  const [ciudadano, refugio] = await Promise.all([
    prisma.usuario.findUnique({ where: { email: "ciudadano@petmatch.test" } }),
    prisma.usuario.findUnique({ where: { email: "refugio@petmatch.test" } }),
  ]);
  if (!ciudadano || !refugio) {
    console.error("Faltan las cuentas de prueba. Ejecuta primero: npm run cuentas:prueba");
    process.exit(1);
  }

  await borrarDemo();
  if (process.argv.includes("--borrar")) {
    console.log("Datos de demostración eliminados.");
    return;
  }

  // Coordenadas aproximadas de barrios de Pasto.
  const ZONAS = {
    centro: [1.2136, -77.2811], fatima: [1.2012, -77.2705], lorenzo: [1.2194, -77.2898],
    torobajo: [1.2251, -77.2645], idema: [1.2062, -77.2734], chambu: [1.2142, -77.2564],
    villaflor: [1.2268, -77.2847], tamasagra: [1.2207, -77.2617],
  };
  const contacto = { contactoNombre: "Camila Rodríguez" + MARCA, contactoTelefono: "3001234567", contactoEmail: "camila@correo.com" };

  const crear = (datos) => prisma.reporte.create({ data: datos });
  const base = (zona, foto) => ({ zona: zona[0], latitud: zona[1][0], longitud: zona[1][1], fotoUrl: subirFoto(foto) });

  // 1 y 3: pérdida y hallazgo muy parecidos (coincidencia + cercanía)
  const toby = await crear({ tipo: "PERDIDA", especie: "Perro", raza: "Criollo", nombre: "Toby", color: "Café", tamano: "MEDIANO", tieneCollar: true,
    senasParticulares: "Collar rojo con placa dorada. Mancha blanca en el pecho.", fecha: horas(52), creadoEn: horas(50), renovadoEn: horas(50),
    ...base(["Fátima", ZONAS.fatima], "perro-cafe"), ...contacto, usuarioId: ciudadano.id });
  await crear({ tipo: "ENCONTRADA", especie: "Perro", color: "Café con blanco", tamano: "MEDIANO", tieneCollar: true,
    senasParticulares: "Muy cariñoso, tiene collar rojo.", fecha: horas(20), creadoEn: horas(19), renovadoEn: horas(19),
    ...base(["Fátima", [1.2031, -77.2722]], "perro-cafe"), contactoNombre: "Andrés Mora" + MARCA, contactoTelefono: "3115550101" });

  // 2: gato con señas felinas
  await crear({ tipo: "PERDIDA", especie: "Gato", raza: "Doméstico", nombre: "Luna", color: "Gris atigrado", tamano: "PEQUENO", tieneCollar: false,
    patronPelaje: "Atigrado", largoPelaje: "Corto", colorOjos: "Verde", esDeInterior: true,
    senasParticulares: "Se escapó por la ventana. Es muy tímida.", fecha: horas(30), creadoEn: horas(28), renovadoEn: horas(28),
    ...base(["Centro", ZONAS.centro], "gato-gris"), ...contacto, usuarioId: ciudadano.id });

  // 4: perro negro
  await crear({ tipo: "PERDIDA", especie: "Perro", raza: "Labrador mestizo", nombre: "Max", color: "Negro", tamano: "GRANDE", tieneCollar: true,
    fecha: horas(100), creadoEn: horas(98), renovadoEn: horas(98), senasParticulares: "Cola larga y orejas caídas.",
    ...base(["Torobajo", ZONAS.torobajo], "perro-negro"), contactoNombre: "Luis Ortega" + MARCA, contactoTelefono: "3207778899" });

  // 5 y 6: hallazgo y pérdida de gato naranja
  await crear({ tipo: "ENCONTRADA", especie: "Gato", color: "Naranja", tamano: "PEQUENO", tieneCollar: false,
    patronPelaje: "Atigrado", colorOjos: "Amarillo", senasParticulares: "Lo encontré en el patio del colegio.",
    fecha: horas(12), creadoEn: horas(11), renovadoEn: horas(11),
    ...base(["Lorenzo de Aldana", ZONAS.lorenzo], "gato-naranja"), contactoNombre: "Marta Cuaical" + MARCA, contactoTelefono: "3128889900" });
  const mandarina = await crear({ tipo: "PERDIDA", especie: "Gato", nombre: "Mandarina", color: "Naranja", tamano: "PEQUENO", tieneCollar: false,
    patronPelaje: "Atigrado", colorOjos: "Amarillo", esDeInterior: false,
    fecha: horas(40), creadoEn: horas(38), renovadoEn: horas(38), ...base(["Lorenzo de Aldana", [1.2201, -77.2889]], "gato-naranja"), ...contacto });

  // 7: caso cerrado (banner de celebración)
  await crear({ tipo: "PERDIDA", especie: "Perro", nombre: "Rocky", color: "Dorado", tamano: "MEDIANO", tieneCollar: true,
    fecha: horas(240), creadoEn: horas(238), renovadoEn: horas(238), estado: "REENCONTRADA", reencontradaEn: horas(60),
    ...base(["Avenida Idema", ZONAS.idema], "perro-dorado"), contactoNombre: "Sandra Bravo" + MARCA, contactoTelefono: "3003332211" });

  // 8: hallazgo anónimo
  await crear({ tipo: "ENCONTRADA", especie: "Gato", color: "Blanco con manchas naranjas", tamano: "PEQUENO", tieneCollar: false,
    colorOjos: "Azul", fecha: horas(6), creadoEn: horas(5), renovadoEn: horas(5), reportanteAnonimo: true,
    ...base(["Chambú", ZONAS.chambu], "gato-carey") });

  // 9: pérdida sin renovar hace 9 días (recordatorio «¿Sigue perdida?»)
  await crear({ tipo: "PERDIDA", especie: "Perro", nombre: "Pinta", color: "Blanco con café", tamano: "PEQUENO", tieneCollar: true,
    fecha: horas(24 * 10), creadoEn: horas(24 * 9.5), renovadoEn: horas(24 * 9), renovaciones: 0,
    ...base(["Villa Flor", ZONAS.villaflor], "perro-manchado"), ...contacto, usuarioId: ciudadano.id });

  // 10: gato negro renovado dos veces
  await crear({ tipo: "PERDIDA", especie: "Gato", nombre: "Sombra", color: "Negro", tamano: "MEDIANO", tieneCollar: false,
    patronPelaje: "Sólido", colorOjos: "Amarillo", fecha: horas(24 * 6), creadoEn: horas(24 * 5.8), renovadoEn: horas(10), renovaciones: 2,
    ...base(["Tamasagra", ZONAS.tamasagra], "gato-negro"), ...contacto, usuarioId: ciudadano.id });

  // Chat
  await prisma.mensaje.createMany({
    data: [
      { reporteId: toby.id, autor: "Andrés", texto: "Creo que lo encontré cerca del parque de Fátima, tiene el collar rojo.", creadoEn: horas(18) },
      { reporteId: toby.id, autor: "Camila (dueña)", texto: "¡Gracias! ¿Podemos vernos en la tienda de la esquina? Llego en 15 minutos.", creadoEn: horas(17) },
      { reporteId: mandarina.id, autor: "Marta", texto: "Hay un gato naranja en el colegio, ¿es el suyo?", creadoEn: horas(9) },
    ],
  });

  // Placas con QR + carnet de vacunas
  const placa = (datos, foto) => prisma.mascota.create({ data: { ...datos, fotoUrl: subirFoto(foto), contactoNombre: "Camila Rodríguez" + MARCA, contactoTelefono: "3001234567", contactoEmail: "camila@correo.com", usuarioId: ciudadano.id } });
  const m1 = await placa({ nombre: "Toby", especie: "Perro", raza: "Criollo", color: "Café", tamano: "MEDIANO", senasParticulares: "Alérgico al pollo." }, "perro-cafe");
  await placa({ nombre: "Luna", especie: "Gato", color: "Gris atigrado", tamano: "PEQUENO", patronPelaje: "Atigrado", largoPelaje: "Corto", colorOjos: "Verde", esDeInterior: true }, "gato-gris");
  await prisma.vacuna.createMany({
    data: [
      { mascotaId: m1.id, nombre: "Rabia", fecha: new Date("2026-08-12T12:00:00Z"), veterinaria: "Veterinaria Patitas (prueba)" },
      { mascotaId: m1.id, nombre: "Parvovirus", fecha: new Date("2026-06-03T12:00:00Z"), veterinaria: "Veterinaria Patitas (prueba)" },
      { mascotaId: m1.id, nombre: "Moquillo", fecha: new Date("2026-06-03T12:00:00Z"), veterinaria: "Veterinaria Patitas (prueba)" },
    ],
  });

  // Animales en resguardo (el primero se parece a «Toby»: genera el aviso «Podría estar en un refugio»)
  const animal = (datos, foto) => prisma.animalResguardo.create({ data: { refugioId: refugio.id, ...datos, nombre: datos.nombre + MARCA, fotoUrl: subirFoto(foto) } });
  await animal({ especie: "Perro", nombre: "Canelo", raza: "Criollo", color: "Café", tamano: "MEDIANO", senasParticulares: "Llegó con un collar rojo, muy dócil.", desde: horas(30) }, "perro-cafe");
  await animal({ especie: "Gato", nombre: "Tigre", color: "Naranja", tamano: "PEQUENO", senasParticulares: "Rescatado de la calle, ya vacunado.", desde: horas(24 * 12) }, "gato-naranja");
  await animal({ especie: "Perro", nombre: "Oso", raza: "Mestizo", color: "Negro", tamano: "GRANDE", senasParticulares: "Tranquilo con niños.", desde: horas(24 * 20) }, "perro-negro");

  console.log("Datos de demostración creados:");
  console.log("  10 reportes (con coincidencias, un caso cerrado y un recordatorio de renovación)");
  console.log("  2 placas con QR y 3 vacunas · 3 animales en resguardo · 3 mensajes de chat");
}

main()
  .catch((e) => {
    console.error("No se pudieron crear los datos de demostración:", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
