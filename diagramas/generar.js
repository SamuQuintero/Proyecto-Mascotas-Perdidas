// Genera las imágenes (PNG y SVG) de todos los diagramas PlantUML de esta
// carpeta. Descarga lo necesario la primera vez (PlantUML y, en Windows,
// Graphviz portátil) dentro de diagramas/herramientas/, que está en .gitignore.
//
// Uso:   npm run diagramas
//
// Requisitos: Node 18+ y Java 11+ (java -version).

const { spawnSync } = require("child_process");
const fs = require("fs");
const https = require("https");
const path = require("path");

const CARPETA = __dirname;
const HERRAMIENTAS = path.join(CARPETA, "herramientas");
const JAR = path.join(HERRAMIENTAS, "plantuml.jar");
const URL_JAR =
  "https://github.com/plantuml/plantuml/releases/download/v1.2024.7/plantuml-1.2024.7.jar";
const URL_GRAPHVIZ_WIN =
  "https://gitlab.com/api/v4/projects/4207231/packages/generic/graphviz-releases/12.2.1/windows_10_cmake_Release_Graphviz-12.2.1-win64.zip";
const ES_WINDOWS = process.platform === "win32";

function descargar(url, destino, redirecciones = 5) {
  return new Promise((resolver, rechazar) => {
    https
      .get(url, (respuesta) => {
        if ([301, 302, 303, 307, 308].includes(respuesta.statusCode) && respuesta.headers.location) {
          respuesta.resume();
          if (redirecciones === 0) return rechazar(new Error("Demasiadas redirecciones"));
          return resolver(descargar(respuesta.headers.location, destino, redirecciones - 1));
        }
        if (respuesta.statusCode !== 200) {
          respuesta.resume();
          return rechazar(new Error(`HTTP ${respuesta.statusCode} al descargar ${url}`));
        }
        const archivo = fs.createWriteStream(destino);
        respuesta.pipe(archivo);
        archivo.on("finish", () => archivo.close(resolver));
        archivo.on("error", rechazar);
      })
      .on("error", rechazar);
  });
}

function ejecutable(nombre) {
  const r = spawnSync(ES_WINDOWS ? "where" : "which", [nombre], { encoding: "utf8" });
  return r.status === 0 ? r.stdout.split(/\r?\n/)[0].trim() : null;
}

async function asegurarPlantUml() {
  if (fs.existsSync(JAR)) return;
  console.log("Descargando PlantUML (una sola vez)…");
  fs.mkdirSync(HERRAMIENTAS, { recursive: true });
  await descargar(URL_JAR, JAR);
}

// Devuelve la ruta de dot (Graphviz) o null si no hay.
async function asegurarGraphviz() {
  if (process.env.GRAPHVIZ_DOT && fs.existsSync(process.env.GRAPHVIZ_DOT)) {
    return process.env.GRAPHVIZ_DOT;
  }
  const local = path.join(HERRAMIENTAS, "graphviz", "bin", ES_WINDOWS ? "dot.exe" : "dot");
  if (fs.existsSync(local)) return local;
  const delSistema = ejecutable("dot");
  if (delSistema) return delSistema;

  if (!ES_WINDOWS) {
    console.warn(
      "No se encontró Graphviz. Instálalo (p. ej. `sudo apt install graphviz` o `brew install graphviz`) y vuelve a ejecutar."
    );
    return null;
  }

  console.log("Descargando Graphviz portátil (una sola vez)…");
  fs.mkdirSync(HERRAMIENTAS, { recursive: true });
  const zip = path.join(HERRAMIENTAS, "graphviz.zip");
  const temporal = path.join(HERRAMIENTAS, "graphviz-tmp");
  await descargar(URL_GRAPHVIZ_WIN, zip);
  const comando = [
    `Expand-Archive -Path '${zip}' -DestinationPath '${temporal}' -Force`,
    `$raiz = (Get-ChildItem '${temporal}' -Recurse -Filter dot.exe | Select-Object -First 1).Directory.Parent.FullName`,
    `Move-Item $raiz '${path.join(HERRAMIENTAS, "graphviz")}'`,
    `Remove-Item '${temporal}' -Recurse -Force`,
    `Remove-Item '${zip}'`,
  ].join("; ");
  const r = spawnSync("powershell", ["-NoProfile", "-Command", comando], { stdio: "inherit" });
  if (r.status !== 0 || !fs.existsSync(local)) throw new Error("No se pudo preparar Graphviz.");
  return local;
}

async function main() {
  if (spawnSync("java", ["-version"], { stdio: "ignore" }).status !== 0) {
    console.error("Java no está instalado o no está en el PATH. Instálalo desde https://adoptium.net");
    process.exit(1);
  }

  await asegurarPlantUml();
  const dot = await asegurarGraphviz();

  const salida = path.join(CARPETA, "imagenes");
  fs.mkdirSync(salida, { recursive: true });
  const fuentes = fs
    .readdirSync(CARPETA)
    .filter((f) => /^\d{2}-.*\.puml$/.test(f))
    .sort();

  console.log(`Generando ${fuentes.length} diagramas (PNG y SVG)…`);
  // PlantUML solo respeta un formato por ejecución: una pasada por formato.
  for (const formato of ["-tpng", "-tsvg"]) {
    const r = spawnSync(
      "java",
      ["-DPLANTUML_LIMIT_SIZE=8192", "-jar", JAR, formato, "-o", "imagenes", ...fuentes],
      {
        cwd: CARPETA,
        stdio: "inherit",
        env: { ...process.env, ...(dot ? { GRAPHVIZ_DOT: dot } : {}) },
      }
    );
    if (r.status !== 0) process.exit(r.status ?? 1);
  }
  console.log(`Listo: ${path.join("diagramas", "imagenes")}`);
}

main().catch((error) => {
  console.error("No se pudieron generar los diagramas:", error.message);
  process.exit(1);
});
