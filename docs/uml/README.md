# Diagramas UML (PlantUML)

Cada archivo `.puml` es un diagrama independiente. Se mantienen en el
repositorio como texto para que se versionen junto al código.

| # | Archivo | Tipo | Qué muestra |
|---|---|---|---|
| 01 | `01-casos-de-uso.puml` | Casos de uso | Actores, roles y las 24 historias de usuario agrupadas |
| 02 | `02-clases-dominio.puml` | Clases | Modelo de datos (`prisma/schema.prisma`) |
| 03 | `03-arquitectura-capas.puml` | Componentes | Capas y dirección de las dependencias |
| 04 | `04-solid-dip-puertos.puml` | Clases | **D** — servicios, puertos, adaptadores y dobles de prueba |
| 05 | `05-solid-ocp-criterios.puml` | Clases | **O** — criterios de puntuación intercambiables (Strategy) |
| 06 | `06-solid-isp-lsp-perfiles.puml` | Clases | **I** y **L** — interfaces pequeñas y sustitución |
| 07 | `07-solid-srp-modulos.puml` | Componentes | **S** — antes y después de dividir responsabilidades |
| 08 | `08-secuencia-publicar-reporte.puml` | Secuencia | Publicar un reporte, capa por capa |
| 09 | `09-secuencia-renovar-y-cerrar.puml` | Secuencia | Renovar (HU-19) y "¡Ya apareció!" (HU-12) con sus fallas |
| 10 | `10-secuencia-alertas-coincidencia.puml` | Secuencia | Cómo la campana calcula las alertas |
| 11 | `11-secuencia-login.puml` | Secuencia | Inicio de sesión y redirección por rol |
| 12 | `12-estados-reporte-y-resguardo.puml` | Estados | Ciclo de vida del reporte y del animal en resguardo |
| 13 | `13-actividad-puntuacion.puml` | Actividad | Flujo de decisión de una coincidencia |
| 14 | `14-despliegue.puml` | Despliegue | Navegador, servidor Next.js, Supabase y disco |

El análisis de cada principio SOLID está en [`../SOLID.md`](../SOLID.md).

## Cómo verlos

**Opción 1 — VS Code (recomendada).** Instala la extensión *PlantUML*
(`jebbs.plantuml`), abre un `.puml` y pulsa `Alt + D` para la vista previa.
Necesita Java (ya lo tienes instalado).

**Opción 2 — Línea de comandos.** Descarga `plantuml.jar` desde
<https://plantuml.com/download> y ejecuta:

```bash
java -jar plantuml.jar -tpng docs/uml/*.puml      # imágenes PNG junto a cada .puml
java -jar plantuml.jar -tsvg docs/uml/*.puml      # o SVG
```

**Graphviz no es obligatorio.** Los diagramas de clases, componentes,
casos de uso, estados y despliegue incluyen `!pragma layout smetana`, que
usa el motor de diseño interno de PlantUML. Si instalas Graphviz
(`winget install Graphviz.Graphviz`), puedes borrar esa línea para obtener
un trazado más pulido.

> Nota: estos diagramas se escribieron sin poder renderizarlos en el entorno
> de desarrollo (no había `plantuml.jar` disponible). Si alguno muestra un
> error de sintaxis o se ve desordenado, avísalo y se ajusta.
