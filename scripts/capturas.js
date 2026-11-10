// Genera las capturas de pantalla del aplicativo (para el informe y el manual
// de uso) con el navegador Edge ya instalado, sin descargar nada.
//
// Uso:   npm run dev   (en otra terminal)  →  npm run capturas
// Salida: informe/capturas/*.jpg
// Requiere las cuentas de prueba: npm run cuentas:prueba

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");
const { PrismaClient } = require("@prisma/client");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const SALIDA = path.join(__dirname, "..", "informe", "capturas");
const CLAVE = require("../prisma/cuentas-prueba.json").contrasena;
const ALTO_MAXIMO = 1700;

function leerEnv() {
  const env = {};
  try {
    for (const l of fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8").split(/\r?\n/)) {
      const m = l.match(/^([A-Z_]+)=(.*)$/);
      if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
    }
  } catch {}
  return env;
}

async function nuevoContexto(browser, movil = false) {
  return browser.newContext(
    movil
      ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, locale: "es-CO", timezoneId: "America/Bogota" }
      : { viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1.5, locale: "es-CO", timezoneId: "America/Bogota" }
  );
}

async function capturar(contexto, ruta, nombre, { espera = 1800 } = {}) {
  const pagina = await contexto.newPage();
  try {
    await pagina.goto(BASE + ruta, { waitUntil: "networkidle", timeout: 60000 });
    await pagina.waitForTimeout(espera);
    // Recorre la página para que se activen las animaciones que aparecen al hacer scroll.
    await pagina.evaluate(async () => {
      const paso = Math.max(300, window.innerHeight * 0.7);
      for (let y = 0; y < document.documentElement.scrollHeight; y += paso) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 220));
      }
      window.scrollTo(0, 0);
    });
    await pagina.waitForTimeout(900);
    const alto = await pagina.evaluate(() => document.documentElement.scrollHeight);
    const ancho = pagina.viewportSize().width;
    await pagina.screenshot({
      path: path.join(SALIDA, nombre + ".jpg"),
      type: "jpeg",
      quality: 88,
      fullPage: true,
      clip: { x: 0, y: 0, width: ancho, height: Math.min(alto, ALTO_MAXIMO) },
    });
    console.log("  ✓", nombre);
  } catch (e) {
    console.log("  ✗", nombre, "—", e.message.split("\n")[0]);
  } finally {
    await pagina.close();
  }
}

// La portada anima sus secciones según el scroll: se captura por tramos del tamaño de la ventana.
async function capturarTramos(contexto, ruta, nombre, tramos) {
  const pagina = await contexto.newPage();
  try {
    await pagina.goto(BASE + ruta, { waitUntil: "networkidle", timeout: 60000 });
    await pagina.waitForTimeout(2200);
    for (let i = 0; i < tramos.length; i++) {
      await pagina.evaluate(async (y) => {
        const pasos = 6;
        const desde = window.scrollY;
        for (let k = 1; k <= pasos; k++) {
          window.scrollTo(0, desde + ((y - desde) * k) / pasos);
          await new Promise((r) => setTimeout(r, 140));
        }
      }, tramos[i]);
      await pagina.waitForTimeout(1500);
      const archivo = i === 0 ? nombre : `${nombre}-${i + 1}`;
      await pagina.screenshot({ path: path.join(SALIDA, archivo + ".jpg"), type: "jpeg", quality: 88 });
      console.log("  ✓", archivo);
    }
  } catch (e) {
    console.log("  ✗", nombre, "—", e.message.split("\n")[0]);
  } finally {
    await pagina.close();
  }
}

async function iniciarSesion(contexto, correo) {
  const r = await contexto.request.post(BASE + "/api/cuenta/login", { data: { email: correo, contrasena: CLAVE } });
  if (!r.ok()) throw new Error(`No se pudo iniciar sesión con ${correo} (${r.status()})`);
}

(async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  const prisma = new PrismaClient();
  const env = leerEnv();
  const reporte = await prisma.reporte.findFirst({ where: { tipo: "PERDIDA", estado: "ACTIVO" }, orderBy: { creadoEn: "desc" } });
  const mascota = await prisma.mascota.findFirst({ orderBy: { creadoEn: "desc" } });
  await prisma.$disconnect();
  if (!reporte) throw new Error("No hay reportes de pérdida abiertos para capturar.");

  const browser = await chromium.launch({ channel: "msedge", headless: true });
  console.log(`Capturando ${BASE}\n`);

  // Público (sin sesión)
  const anonimo = await nuevoContexto(browser);
  for (const [ruta, nombre] of [
    ["/perdida/nuevo", "perdida-formulario"], ["/encontrada/nuevo", "encontrada-formulario"],
    ["/reportes", "reportes-listado"], [`/reportes/${reporte.id}`, "reporte-detalle"], ["/donde-acudir", "donde-acudir"],
    ["/resguardo", "resguardo"], ["/mascotas", "mascotas-inicio"], ["/cuenta/login", "login"], ["/cuenta/registro", "registro"],
    ["/admin/login", "admin-login"],
  ]) await capturar(anonimo, ruta, nombre);
  await capturarTramos(anonimo, "/", "inicio", [0, 850, 1700]);
  if (mascota) {
    await capturar(anonimo, `/mascotas/${mascota.id}`, "perfil-mascota");
    await capturar(anonimo, `/mascotas/${mascota.id}/placa`, "placa");
  }
  await anonimo.close();

  // Móvil
  const movil = await nuevoContexto(browser, true);
  await capturar(movil, "/", "movil-inicio");
  await capturar(movil, `/reportes/${reporte.id}`, "movil-reporte");
  await capturar(movil, "/cuenta/login", "movil-login");
  await movil.close();

  // Paneles por rol
  for (const [rol, correo, ruta, nombre] of [
    ["ciudadano", "ciudadano@petmatch.test", "/cuenta", "panel-ciudadano"],
    ["veterinaria", "veterinaria@petmatch.test", "/veterinaria", "panel-veterinaria"],
    ["refugio", "refugio@petmatch.test", "/refugio", "panel-refugio"],
  ]) {
    const ctx = await nuevoContexto(browser);
    try {
      await iniciarSesion(ctx, correo);
      await capturar(ctx, ruta, nombre);
    } catch (e) {
      console.log("  ✗", nombre, "—", e.message);
    }
    await ctx.close();
  }

  // Administrador
  const adm = await nuevoContexto(browser);
  const r = await adm.request.post(BASE + "/api/admin/sesion", { data: { usuario: env.ADMIN_USUARIO, contrasena: env.ADMIN_CONTRASENA } });
  if (r.ok()) {
    await capturar(adm, "/admin", "admin-panel");
    await capturar(adm, "/admin/indicadores?periodo=todo", "admin-indicadores");
  } else console.log("  ✗ admin — no se pudo iniciar sesión");
  await adm.close();

  await browser.close();
  console.log(`\nListo: ${SALIDA}`);
})().catch((e) => {
  console.error("No se pudieron generar las capturas:", e.message);
  process.exit(1);
});
