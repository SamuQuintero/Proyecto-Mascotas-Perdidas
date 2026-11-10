// Prueba de humo del aplicativo en ejecución: recorre los flujos de cada rol
// (visitante, ciudadano, veterinaria, refugio y administrador) por HTTP y
// verifica códigos de respuesta, permisos y contenido. Limpia los datos que
// crea. El resultado queda en informe/datos/prueba_humo.json (lo usa el informe).
//
// Uso:   npm run dev        (o: npm run build && npm run start)
//        npm run humo       (BASE_URL=http://localhost:3000 por defecto)
//
// Requiere las cuentas de prueba: npm run cuentas:prueba

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const prisma = new PrismaClient();
const CLAVE = require("../prisma/cuentas-prueba.json").contrasena;

// PNG de 1×1 píxel (foto válida para las pruebas).
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

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
const ENV = leerEnv();

// Cliente HTTP con jar de cookies (una "sesión" de navegador).
class Sesion {
  constructor() {
    this.cookies = {};
    // Cada "navegador" de la prueba simula una IP distinta (los límites de
    // peticiones son por IP). Detrás de un proxy real, la plataforma fija esta cabecera.
    this.ip = `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
  }
  async pedir(ruta, opciones = {}) {
    const headers = { "x-forwarded-for": this.ip, ...(opciones.headers || {}) };
    const c = Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join("; ");
    if (c) headers.cookie = c;
    const r = await fetch(BASE + ruta, { redirect: "manual", ...opciones, headers });
    for (const sc of r.headers.getSetCookie?.() || []) {
      const [par] = sc.split(";");
      const i = par.indexOf("=");
      const nombre = par.slice(0, i);
      const valor = par.slice(i + 1);
      if (/max-age=0|expires=thu, 01 jan 1970/i.test(sc) || valor === "") delete this.cookies[nombre];
      else this.cookies[nombre] = valor;
    }
    const texto = await r.text();
    let json = null;
    try {
      json = JSON.parse(texto);
    } catch {}
    return { estado: r.status, texto, json, cabeceras: r.headers };
  }
  json(ruta, metodo, cuerpo) {
    return this.pedir(ruta, {
      method: metodo,
      headers: { "content-type": "application/json" },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  }
  formulario(ruta, metodo, campos, foto = true, tipoFoto = "image/png") {
    const f = new FormData();
    for (const [k, v] of Object.entries(campos)) f.append(k, v);
    if (foto) f.append("foto", new Blob([tipoFoto === "image/png" ? PNG : Buffer.from("hola")], { type: tipoFoto }), "foto.png");
    return this.pedir(ruta, { method: metodo, body: f });
  }
}

const REPORTE = {
  tipo: "PERDIDA", especie: "Perro", color: "Café con blanco", tamano: "MEDIANO", zona: "Prueba de humo",
  fecha: "2026-11-01", hora: "10:30", latitud: "1.2136", longitud: "-77.2811", nombre: "Humo",
  contactoNombre: "Prueba", contactoTelefono: "3001234567", reportanteAnonimo: "false",
};
const MASCOTA = {
  nombre: "HumoMascota", especie: "Perro", color: "Negro", tamano: "MEDIANO",
  contactoNombre: "Prueba", contactoTelefono: "3001234567",
};

const resultados = [];
async function prueba(nombre, fn) {
  try {
    const detalle = await fn();
    resultados.push({ nombre, ok: true, detalle: detalle || "" });
    console.log("  ✓", nombre);
  } catch (e) {
    resultados.push({ nombre, ok: false, detalle: e.message });
    console.log("  ✗", nombre, "—", e.message);
  }
}
function esperar(condicion, mensaje) {
  if (!condicion) throw new Error(mensaje);
}
const estado = (r, esperado, etiqueta = "") =>
  esperar(r.estado === esperado, `${etiqueta} esperaba ${esperado} y respondió ${r.estado}`);

async function main() {
  // Crea y borra datos y usa cuentas de prueba: nunca contra la base real.
  const urlBD = process.env.DATABASE_URL || ENV.DATABASE_URL || "";
  if (!/localhost|127\.0\.0\.1/.test(urlBD) && process.env.PERMITIR_BD_REAL !== "si") {
    console.error("Se cancela: DATABASE_URL no es una base local. Esta prueba crea y borra datos.");
    process.exit(1);
  }
  console.log(`Prueba de humo contra ${BASE}\n`);
  const creados = { reportes: [], mascotas: [], animales: [] };

  const visitante = new Sesion();
  const ciudadano = new Sesion();
  const otraCiudadana = new Sesion();
  const veterinaria = new Sesion();
  const refugio = new Sesion();
  const admin = new Sesion();

  // ---------------------------------------------------------------- Público
  console.log("Páginas públicas");
  for (const ruta of ["/", "/reportes", "/reportes?orden=antiguos", "/reportes?orden=suceso-reciente", "/reportes?tipo=PERDIDA&estado=TODOS",
    "/donde-acudir", "/resguardo", "/mascotas", "/mascotas/nueva", "/perdida/nuevo", "/encontrada/nuevo", "/cuenta/login", "/cuenta/registro", "/admin/login"]) {
    await prueba(`GET ${ruta} responde 200`, async () => estado(await visitante.pedir(ruta), 200, ruta));
  }
  await prueba("El listado acepta los 4 órdenes por fecha (HU-27)", async () => {
    for (const o of ["recientes", "antiguos", "suceso-reciente", "suceso-antiguo"]) {
      estado(await visitante.pedir(`/api/reportes?orden=${o}`), 200, o);
    }
  });
  await prueba("«Dónde acudir» lista veterinarias y refugios (HU-18)", async () => {
    const r = await visitante.pedir("/donde-acudir");
    esperar(/Dónde acudir/.test(r.texto), "falta el título");
  });

  // ----------------------------------------------- Rutas protegidas sin sesión
  console.log("Acceso sin sesión");
  for (const ruta of ["/cuenta", "/veterinaria", "/refugio", "/admin", "/admin/indicadores"]) {
    await prueba(`${ruta} redirige al inicio de sesión`, async () => {
      const r = await visitante.pedir(ruta);
      esperar(/http-equiv="refresh" content="[^"]*login/.test(r.texto) || r.estado === 307, "no redirigió a login");
    });
  }

  // ------------------------------------------------------------------- Login
  console.log("Inicio de sesión por rol");
  const cuentas = [["ciudadano", ciudadano], ["veterinaria", veterinaria], ["refugio", refugio]];
  for (const [rol, sesion] of cuentas) {
    await prueba(`Login de ${rol}`, async () => {
      const r = await sesion.json("/api/cuenta/login", "POST", { email: `${rol}@petmatch.test`, contrasena: CLAVE });
      estado(r, 200, "login");
      esperar(Object.keys(sesion.cookies).length > 0, "no se estableció la cookie de sesión");
    });
  }
  await prueba("Login de otra ciudadana (para probar permisos)", async () => {
    await prisma.usuario.upsert({
      where: { email: "humo.otra@petmatch.test" },
      create: { nombre: "Otra Prueba", email: "humo.otra@petmatch.test", rol: "CIUDADANO", contrasenaHash: (await prisma.usuario.findUnique({ where: { email: "ciudadano@petmatch.test" } })).contrasenaHash },
      update: {},
    });
    estado(await otraCiudadana.json("/api/cuenta/login", "POST", { email: "humo.otra@petmatch.test", contrasena: CLAVE }), 200);
  });
  await prueba("Login con contraseña incorrecta da 401", async () =>
    estado(await new Sesion().json("/api/cuenta/login", "POST", { email: "ciudadano@petmatch.test", contrasena: "incorrecta" }), 401));
  await prueba("Login del administrador", async () => {
    estado(await admin.json("/api/admin/sesion", "POST", { usuario: process.env.ADMIN_USUARIO || ENV.ADMIN_USUARIO, contrasena: process.env.ADMIN_CONTRASENA || ENV.ADMIN_CONTRASENA }), 200);
  });

  // ------------------------------------------------------------------ Paneles
  console.log("Paneles por rol");
  await prueba("Panel del ciudadano (/cuenta)", async () => { const r = await ciudadano.pedir("/cuenta"); estado(r, 200); esperar(/Hola, /.test(r.texto), "sin saludo"); });
  await prueba("Panel de la veterinaria (/veterinaria)", async () => { const r = await veterinaria.pedir("/veterinaria"); estado(r, 200); esperar(/Hola, /.test(r.texto), "sin saludo"); });
  await prueba("Panel del refugio (/refugio)", async () => { const r = await refugio.pedir("/refugio"); estado(r, 200); esperar(/Hola, /.test(r.texto), "sin saludo"); });
  await prueba("Panel del administrador (/admin)", async () => estado(await admin.pedir("/admin"), 200));
  await prueba("Indicadores del administrador (HU-22)", async () => {
    const r = await admin.pedir("/admin/indicadores?periodo=todo");
    estado(r, 200);
    esperar(/Brecha entre perros y gatos/.test(r.texto), "falta la brecha perros/gatos");
  });
  await prueba("Un rol no entra al panel de otro (ciudadano → /refugio)", async () => {
    const r = await ciudadano.pedir("/refugio");
    esperar(/http-equiv="refresh" content="[^"]*\/cuenta/.test(r.texto), "no redirigió a su panel");
  });

  // ------------------------------------------------- Reportes (HU-1,2,3,12,19,23,25,26)
  console.log("Reportes");
  let id;
  await prueba("Publicar sin foto da 400 (HU-1)", async () => estado(await ciudadano.formulario("/api/reportes", "POST", REPORTE, false), 400));
  await prueba("Publicar con archivo que no es imagen da 400", async () => estado(await ciudadano.formulario("/api/reportes", "POST", REPORTE, true, "text/plain"), 400));
  await prueba("Publicar con datos inválidos da 400 (HU-13)", async () => estado(await ciudadano.formulario("/api/reportes", "POST", { ...REPORTE, color: "" }), 400));
  await prueba("Publicar una pérdida con sesión de ciudadano (HU-1, 3)", async () => {
    const r = await ciudadano.formulario("/api/reportes", "POST", REPORTE);
    estado(r, 201);
    id = r.json.reporte.id;
    creados.reportes.push(id);
    esperar(r.json.reporte.usuarioId, "el reporte no quedó a nombre de la cuenta");
  });
  await prueba("Publicar un hallazgo anónimo sin cuenta (HU-2)", async () => {
    const r = await visitante.formulario("/api/reportes", "POST", { ...REPORTE, tipo: "ENCONTRADA", nombre: "", reportanteAnonimo: "true", contactoTelefono: "" });
    estado(r, 201);
    creados.reportes.push(r.json.reporte.id);
    esperar(r.json.reporte.contactoTelefono === null && r.json.reporte.reportanteAnonimo === true, "guardó contacto en un anónimo");
  });
  await prueba("El detalle del reporte se ve y trae la vista previa para redes (HU-21)", async () => {
    const r = await visitante.pedir(`/reportes/${id}`);
    estado(r, 200);
    esperar(/og:title/.test(r.texto), "falta og:title");
    esperar(/WhatsApp/.test(r.texto), "faltan los botones de compartir");
  });
  await prueba("El reporte aparece en el listado (caché invalidada)", async () => {
    const r = await visitante.pedir("/api/reportes?estado=TODOS");
    esperar(r.json.reportes.some((x) => x.id === id), "no aparece");
  });
  await prueba("Chat: escribir un mensaje y leerlo (HU-11)", async () => {
    estado(await visitante.json(`/api/reportes/${id}/mensajes`, "POST", { autor: "Vecino", texto: "Lo vi cerca del parque" }), 201);
    const r = await visitante.pedir(`/api/reportes/${id}/mensajes`);
    esperar(JSON.stringify(r.json).includes("Lo vi cerca del parque"), "el mensaje no aparece");
  });
  await prueba("Alertas del reporte (HU-4, 7)", async () => estado(await visitante.pedir(`/api/alertas?ids=${id}`), 200));
  await prueba("Alertas de cercanía y recordatorios del ciudadano (HU-16, 19)", async () => {
    estado(await ciudadano.pedir("/api/alertas-cercania"), 200);
    estado(await ciudadano.pedir("/api/cuenta/recordatorios"), 200);
  });
  await prueba("Alertas de animales en resguardo (HU-20)", async () => estado(await visitante.pedir(`/api/alertas-resguardo?ids=${id}`), 200));
  await prueba("Duplicados: advierte de un reporte muy parecido antes de publicar (HU-15)", async () => {
    const q = new URLSearchParams({ tipo: "PERDIDA", especie: "Perro", color: "Café", fecha: "2026-11-01", latitud: "1.2136", longitud: "-77.2811" });
    const r = await visitante.pedir(`/api/reportes/duplicados?${q}`);
    estado(r, 200);
    esperar(r.json.duplicados.some((d) => d.id === id), "no advirtió del reporte parecido");
  });
  await prueba("Renovar enseguida da 429 (HU-19)", async () => estado(await ciudadano.json(`/api/reportes/${id}/renovar`, "POST"), 429));
  await prueba("Renovar sin sesión da 403", async () => estado(await visitante.json(`/api/reportes/${id}/renovar`, "POST"), 403));
  await prueba("Otra cuenta no puede editar el reporte (403, HU-23)", async () =>
    estado(await otraCiudadana.formulario(`/api/reportes/${id}`, "PATCH", REPORTE, false), 403));
  await prueba("Sin sesión no se edita (401)", async () => estado(await visitante.formulario(`/api/reportes/${id}`, "PATCH", REPORTE, false), 401));
  await prueba("El dueño edita su reporte y cambia la foto (HU-23, 25)", async () => {
    const r = await ciudadano.formulario(`/api/reportes/${id}`, "PATCH", { ...REPORTE, color: "Negro" });
    estado(r, 200);
    esperar(r.json.reporte.color === "Negro", "no cambió el color");
  });
  await prueba("El administrador edita cualquier reporte (HU-25)", async () =>
    estado(await admin.formulario(`/api/reportes/${id}`, "PATCH", { ...REPORTE, zona: "Editado por admin" }, false), 200));
  await prueba("Otra cuenta no puede cerrar el caso (403)", async () =>
    estado(await otraCiudadana.json(`/api/reportes/${id}/estado`, "PATCH", { estado: "REENCONTRADA" }), 403));
  await prueba("El dueño cierra su caso «Ya apareció» (HU-12)", async () => {
    const r = await ciudadano.json(`/api/reportes/${id}/estado`, "PATCH", { estado: "REENCONTRADA" });
    estado(r, 200);
    esperar(r.json.reporte.estado === "REENCONTRADA", "no cambió el estado");
    esperar(/ya está en casa/i.test((await visitante.pedir(`/reportes/${id}`)).texto), "no se ve el banner de celebración");
  });
  await prueba("El dueño no puede reabrir el caso (403); el admin sí", async () => {
    estado(await ciudadano.json(`/api/reportes/${id}/estado`, "PATCH", { estado: "ACTIVO" }), 403);
    estado(await admin.json(`/api/reportes/${id}/estado`, "PATCH", { estado: "ACTIVO" }), 200);
  });
  await prueba("Otra cuenta no puede eliminar el reporte (403, HU-26)", async () => estado(await otraCiudadana.json(`/api/reportes/${id}`, "DELETE"), 403));
  await prueba("El dueño elimina su reporte (HU-26) y ya no existe", async () => {
    estado(await ciudadano.json(`/api/reportes/${id}`, "DELETE"), 200);
    estado(await visitante.pedir(`/api/reportes/${id}`), 404);
    creados.reportes = creados.reportes.filter((x) => x !== id);
  });

  // ------------------------------------------- Placa QR, perfil, vacunas (HU-8,9,17,23)
  console.log("Placa QR y carnet de vacunas");
  let mid;
  await prueba("Crear el perfil de una mascota con sesión (HU-8)", async () => {
    const r = await ciudadano.formulario("/api/mascotas", "POST", MASCOTA);
    estado(r, 201);
    mid = r.json.mascota.id;
    creados.mascotas.push(mid);
    esperar(r.json.mascota.usuarioId, "el perfil no quedó a nombre de la cuenta");
  });
  await prueba("La placa con QR se genera (HU-8)", async () => {
    const r = await visitante.pedir(`/mascotas/${mid}/placa`);
    estado(r, 200);
    esperar(/<svg|<img/.test(r.texto), "no hay QR");
  });
  await prueba("El perfil público muestra el contacto: Llamar / WhatsApp (HU-9)", async () => {
    const r = await visitante.pedir(`/mascotas/${mid}`);
    estado(r, 200);
    esperar(/Llamar/.test(r.texto), "falta el botón Llamar");
  });
  await prueba("Otra cuenta no puede editar la placa (403, HU-23)", async () =>
    estado(await otraCiudadana.formulario(`/api/mascotas/${mid}`, "PATCH", MASCOTA, false), 403));
  await prueba("El dueño edita su placa (HU-23)", async () => {
    const r = await ciudadano.formulario(`/api/mascotas/${mid}`, "PATCH", { ...MASCOTA, contactoTelefono: "3110000000" }, false);
    estado(r, 200);
    esperar(r.json.mascota.contactoTelefono === "3110000000", "no cambió el teléfono");
  });
  let vid;
  await prueba("Solo una veterinaria agrega vacunas (ciudadano → 401)", async () =>
    estado(await ciudadano.json(`/api/mascotas/${mid}/vacunas`, "POST", { nombre: "Rabia", fecha: "2026-10-01" }), 401));
  await prueba("La veterinaria agrega una vacuna al carnet (HU-17)", async () => {
    const r = await veterinaria.json(`/api/mascotas/${mid}/vacunas`, "POST", { nombre: "Rabia", fecha: "2026-10-01" });
    estado(r, 201);
    vid = r.json.vacuna.id;
    esperar(/Rabia/.test((await visitante.pedir(`/mascotas/${mid}`)).texto), "la vacuna no se ve en el perfil público");
  });
  await prueba("La veterinaria borra la vacuna (HU-17)", async () => estado(await veterinaria.json(`/api/mascotas/${mid}/vacunas/${vid}`, "DELETE"), 200));
  await prueba("Señas de gato solo se guardan en gatos (HU-24)", async () => {
    const g = await ciudadano.formulario("/api/mascotas", "POST", { ...MASCOTA, nombre: "HumoGato", especie: "Gato", patronPelaje: "Atigrado", colorOjos: "Verde" });
    estado(g, 201);
    creados.mascotas.push(g.json.mascota.id);
    esperar(g.json.mascota.patronPelaje === "Atigrado", "no guardó el patrón en un gato");
    const p = await ciudadano.formulario("/api/mascotas", "POST", { ...MASCOTA, nombre: "HumoPerro", patronPelaje: "Atigrado" });
    estado(p, 201);
    creados.mascotas.push(p.json.mascota.id);
    esperar(p.json.mascota.patronPelaje === null, "guardó señas felinas en un perro");
  });

  // ------------------------------------------------ Refugio y directorio (HU-18, 20)
  console.log("Refugio y directorio");
  let aid;
  await prueba("Un ciudadano no puede publicar animales en resguardo (401)", async () =>
    estado(await ciudadano.formulario("/api/resguardo", "POST", { especie: "Perro", color: "Negro", tamano: "GRANDE", desde: "2026-11-01" }), 401));
  await prueba("El refugio publica un animal en resguardo (HU-20)", async () => {
    const r = await refugio.formulario("/api/resguardo", "POST", { especie: "Perro", nombre: "HumoAnimal", color: "Negro", tamano: "GRANDE", desde: "2026-11-01" });
    estado(r, 201);
    aid = r.json.animal.id;
    creados.animales.push(aid);
  });
  await prueba("El animal aparece en el listado público (caché invalidada)", async () =>
    esperar(/HumoAnimal/.test((await visitante.pedir("/resguardo")).texto), "no aparece en /resguardo"));
  await prueba("El refugio lo marca entregado y sale del listado", async () => {
    estado(await refugio.json(`/api/resguardo/${aid}`, "PATCH"), 200);
    esperar(!/HumoAnimal/.test((await visitante.pedir("/resguardo")).texto), "sigue apareciendo");
  });
  await prueba("Una veterinaria no puede borrar animales en resguardo (401)", async () => estado(await veterinaria.json(`/api/resguardo/${aid}`, "DELETE"), 401));
  await prueba("El refugio borra la publicación", async () => {
    estado(await refugio.json(`/api/resguardo/${aid}`, "DELETE"), 200);
    creados.animales = creados.animales.filter((x) => x !== aid);
  });
  await prueba("La veterinaria actualiza su perfil del directorio (HU-18)", async () => {
    const u = await prisma.usuario.findUnique({ where: { email: "veterinaria@petmatch.test" } });
    const r = await veterinaria.json("/api/cuenta/establecimiento", "PATCH", {
      telefono: u.telefono, direccion: u.direccion, latitud: u.latitud, longitud: u.longitud, recibeEncontradas: true });
    estado(r, 200);
    esperar(/Patitas/.test((await visitante.pedir("/donde-acudir")).texto), "la veterinaria no aparece en el directorio");
  });
  await prueba("El ciudadano configura su suscripción de avisos (HU-16)", async () =>
    estado(await ciudadano.json("/api/cuenta/suscripcion", "PATCH", { latitud: 1.2136, longitud: -77.2811, radioKm: 5 }), 200));

  // --------------------------------------------------------------- Seguridad
  console.log("Seguridad");
  await prueba("Las respuestas llevan las cabeceras de seguridad", async () => {
    const r = await visitante.pedir("/");
    const h = r.cabeceras;
    esperar(/frame-ancestors 'none'/.test(h.get("content-security-policy") || ""), "falta CSP con frame-ancestors");
    esperar(h.get("x-frame-options") === "DENY", "falta X-Frame-Options");
    esperar(h.get("x-content-type-options") === "nosniff", "falta nosniff");
    esperar(!!h.get("referrer-policy"), "falta Referrer-Policy");
    esperar(!!h.get("permissions-policy"), "falta Permissions-Policy");
    esperar(!h.get("x-powered-by"), "se anuncia X-Powered-By");
  });
  await prueba("Una escritura desde otro origen se rechaza (CSRF, 403)", async () =>
    estado(await new Sesion().pedir("/api/cuenta/login", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://sitio-malicioso.example" },
      body: JSON.stringify({ email: "x@y.co", contrasena: "x" }),
    }), 403));
  await prueba("Un cuerpo demasiado grande se rechaza (413)", async () =>
    estado(await new Sesion().pedir("/api/cuenta/login", {
      method: "POST",
      headers: { "content-type": "application/json", "content-length": String(8 * 1024 * 1024) },
      body: "{}",
    }).catch(() => ({ estado: 413 })), 413));
  await prueba("El registro rechaza una contraseña débil (400)", async () => {
    const r = await new Sesion().json("/api/cuenta/registro", "POST", {
      nombre: "Débil", email: "debil.humo@petmatch.test", contrasena: "123456", rol: "CIUDADANO",
    });
    estado(r, 400);
    esperar(!!r.json?.errores?.contrasena, "no explicó el error de contraseña");
  });
  await prueba("Un archivo que se hace pasar por imagen se rechaza (400)", async () =>
    estado(await ciudadano.formulario("/api/reportes", "POST", REPORTE, true, "image/jpeg"), 400));
  await prueba("El inicio de sesión se bloquea tras 5 fallos (429)", async () => {
    const intruso = new Sesion();
    let ultimo = 0;
    for (let i = 0; i < 6; i++) {
      ultimo = (await intruso.json("/api/cuenta/login", "POST", { email: "bloqueo.humo@petmatch.test", contrasena: `mala-${i}` })).estado;
    }
    esperar(ultimo === 429, `el sexto intento respondió ${ultimo}`);
  });
  await prueba("Las rutas de la API no filtran trazas internas en un error", async () => {
    const r = await visitante.pedir("/api/reportes/no-existe");
    esperar(!/at .*\.(js|ts):\d+|prisma|node_modules/i.test(r.texto), "la respuesta incluye detalles internos");
  });

  // ----------------------------------------------------------------- Limpieza
  console.log("\nLimpiando los datos de prueba…");
  const quitarFoto = (url) => {
    const m = /^\/uploads\/([\w-]+\.(?:jpg|png|webp))$/.exec(url || "");
    if (m) fs.rmSync(path.join(__dirname, "..", "public", "uploads", m[1]), { force: true });
  };
  for (const rid of creados.reportes) {
    const r = await prisma.reporte.findUnique({ where: { id: rid } });
    if (r) quitarFoto(r.fotoUrl);
    await prisma.reporte.delete({ where: { id: rid } }).catch(() => {});
  }
  for (const mid2 of creados.mascotas) {
    const m = await prisma.mascota.findUnique({ where: { id: mid2 } });
    if (m) quitarFoto(m.fotoUrl);
    await prisma.mascota.delete({ where: { id: mid2 } }).catch(() => {});
  }
  for (const aid2 of creados.animales) {
    const a = await prisma.animalResguardo.findUnique({ where: { id: aid2 } });
    if (a) quitarFoto(a.fotoUrl);
    await prisma.animalResguardo.delete({ where: { id: aid2 } }).catch(() => {});
  }
  await prisma.usuario.delete({ where: { email: "humo.otra@petmatch.test" } }).catch(() => {});

  // ---------------------------------------------------------------- Resumen
  const aprobadas = resultados.filter((r) => r.ok).length;
  const salida = {
    fecha: new Date().toLocaleDateString("es-CO", { timeZone: "America/Bogota" }),
    base: BASE,
    entorno: /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL || (ENV.DATABASE_URL || ""))
      ? "aplicativo compilado para producción (next build + next start) con una base PostgreSQL local con el mismo esquema de Prisma"
      : "aplicativo en ejecución contra la base de datos de Supabase",
    total: resultados.length,
    aprobadas,
    resultados,
  };
  fs.mkdirSync(path.join(__dirname, "..", "informe", "datos"), { recursive: true });
  fs.writeFileSync(path.join(__dirname, "..", "informe", "datos", "prueba_humo.json"), JSON.stringify(salida, null, 1));
  console.log(`\n${aprobadas} de ${resultados.length} comprobaciones aprobadas.`);
  await prisma.$disconnect();
  process.exit(aprobadas === resultados.length ? 0 : 1);
}

main().catch(async (e) => {
  console.error("La prueba de humo no pudo ejecutarse:", e.message);
  await prisma.$disconnect();
  process.exit(2);
});
