# Principios SOLID en PetMatch

Qué cumplía el proyecto antes, qué se cambió, dónde está y qué falta. Todo
cambio de comportamiento se verificó con las pruebas existentes (que no se
modificaron) y con pruebas nuevas. Los diagramas están en
[`uml/`](./uml/README.md).

**Resultado de la refactorización:** el comportamiento de la aplicación no
cambió. Las 179 pruebas anteriores siguen pasando sin tocarlas, se agregaron
**30 pruebas nuevas** (209 en total) y las rutas HTTP responden con los mismos
códigos y mensajes (se comprobó contra el servidor real).

## Resumen

| Principio | Antes | Ahora |
|---|---|---|
| **S** Responsabilidad única | Parcial: lógica pura bien separada, pero `coincidencias.ts` mezclaba 5 temas y las rutas hacían de todo | Cumple en el módulo de coincidencias y en las escrituras de reportes, mascotas y resguardo |
| **O** Abierto/cerrado | No: 3 funciones repetían el mismo bloque de puntuación | Cumple: criterios intercambiables, registro de redes sociales y tabla de paneles por rol |
| **L** Sustitución de Liskov | No aplicaba (casi no hay herencia) | Cumple donde importa: los criterios aceptan cualquier tipo que cumpla su contrato |
| **I** Segregación de interfaces | Parcial | Cumple en `perfiles.ts`: interfaces pequeñas compuestas |
| **D** Inversión de dependencias | No: las rutas importaban Prisma y el disco directamente | Cumple en escrituras de reportes, mascotas y resguardo; **pendiente** el resto (ver abajo) |

## S — Responsabilidad única

> Un módulo debe tener una sola razón para cambiar.

**Lo que ya estaba bien:** la lógica de negocio vivía en archivos puros por
historia (`felinos.ts`, `renovacion.ts`, `propiedad.ts`, `indicadores.ts`,
`establecimientos.ts`, `resguardo.ts`, `compartir.ts`), sin base de datos y con
pruebas.

**Lo que se cambió**

- `src/lib/coincidencias.ts` (389 líneas con distancias, colores, cuatro
  comparaciones y tres bloques de puntuación repetidos) se dividió en
  `src/lib/coincidencias/`: `geo`, `colores`, `perfiles`, `reglas`,
  `puntuacion`, `criterios`, `reportes`, `duplicados`, `mascotas`, `resguardo`
  e `index` (fachada: el resto de la app sigue importando
  `@/lib/coincidencias`).
- Las rutas `POST/PATCH /api/reportes`, `/api/mascotas` y `/api/resguardo`
  leían el formulario, validaban, guardaban fotos, escribían en la base,
  invalidaban la caché y elegían el código HTTP. Ahora cada una solo traduce
  HTTP ⇄ servicio; las reglas viven en `src/servicios/`.
- La traducción "falla de negocio → código HTTP" quedó en un solo lugar:
  `src/infraestructura/respuestasHttp.ts`.

Diagrama: [`07-solid-srp-modulos.puml`](./uml/07-solid-srp-modulos.puml).

## O — Abierto/cerrado

> Abierto a extensión, cerrado a modificación.

**Problema:** `compararReportes`, `compararMascotaConReporte` y
`compararResguardoConPerdida` repetían "suma puntos por especie, color,
tamaño…" con pesos distintos. Agregar una característica (p. ej. edad) obligaba
a editar las tres.

**Solución (patrón Strategy):** `src/lib/coincidencias/puntuacion.ts` es un
motor genérico que suma los aportes de una lista de `Criterio`. Los criterios
(`criterios.ts`: especie, color, tamaño, distancia, señas felinas) son objetos
pequeños y las tres comparaciones son **listas de criterios con sus pesos**.
Para sumar una característica se escribe un criterio y se agrega a la lista;
el motor y las otras comparaciones no se tocan. Lo demuestra
`puntuacion.test.ts` (un criterio de edad nuevo convive con los existentes).

Otros dos puntos de extensión sin modificar código existente:

- `REDES_SOCIALES` en `lib/compartir.ts`: el botón de compartir recorre el
  registro. Agregar Telegram = agregar una entrada.
- `PANEL_POR_ROL` en `lib/roles.ts`: un `Record<RolCuenta, string>`; si se
  agrega un rol, TypeScript exige su panel.

Diagrama: [`05-solid-ocp-criterios.puml`](./uml/05-solid-ocp-criterios.puml),
[`13-actividad-puntuacion.puml`](./uml/13-actividad-puntuacion.puml).

## L — Sustitución de Liskov

> Un subtipo debe poder usarse donde se espera su supertipo.

El proyecto casi no usa herencia de clases, así que el principio se aplica a
los **contratos**: un criterio escrito para `PerfilFisico` funciona con un
reporte, un perfil de mascota o un animal en resguardo, sin saber cuál es.
`Criterio.evaluar` se declaró como método (no propiedad) para que TypeScript
acepte esa sustitución. Los puertos también lo cumplen: los dobles en memoria
y los adaptadores de Prisma son intercambiables ante los servicios, y
`ErrorArchivoInvalido` extiende `ErrorFotoInvalida`, así que el servicio
reconoce el error de cualquier almacén.

Diagrama: [`06-solid-isp-lsp-perfiles.puml`](./uml/06-solid-isp-lsp-perfiles.puml).

## I — Segregación de interfaces

> Nadie debe depender de métodos que no usa.

`src/lib/coincidencias/perfiles.ts` define capacidades mínimas
(`Identificable`, `Geolocalizable`, `ConFecha`, `PerfilFisico`,
`SenasFelinasComparables`) y las compone: `ReporteComparable` tiene todas,
`MascotaComparable` no tiene ubicación, `AnimalResguardoComparable` no tiene
señas de gato. `criterioDistancia` pide solo `Geolocalizable`;
`criterioColor`, solo `PerfilFisico`. Ningún tipo tuvo que inventar campos para
entrar a una comparación.

Los puertos también son pequeños y específicos: `AlmacenFotos` (2 métodos),
`NotificadorCambios` (2) y un repositorio por entidad, en lugar de un
"acceso a datos" gigante.

## D — Inversión de dependencias

> Depender de abstracciones, no de implementaciones concretas.

**Problema:** las rutas importaban `prisma` y `guardarFotoReporte` (disco)
directamente. No se podían probar sin base de datos y cambiar de proveedor
obligaba a editar rutas.

**Solución (puertos y adaptadores):**

```
Rutas HTTP ──► Servicios ──► Puertos (interfaces) ◄── Adaptadores
               src/servicios  src/lib/puertos.ts      src/infraestructura
```

- **Puertos** (`src/lib/puertos.ts`): `AlmacenFotos`, `NotificadorCambios`,
  `RepositorioReportes`, `RepositorioMascotas`, `RepositorioResguardo`.
- **Servicios** (`src/servicios/`): `ServicioReportes`, `ServicioMascotas`,
  `ServicioResguardo`. Reciben los puertos por el constructor (el reloj
  también, para probar "no renovar dos veces al día"). No conocen HTTP: devuelven
  `Resultado` (`ok` o una `Falla` con tipo de negocio).
- **Adaptadores** (`src/infraestructura/`): `AlmacenFotosDisco`,
  `NotificadorCacheNext`, `Repositorio*Prisma`.
- **Raíz de composición** (`src/composicion.ts`): el único lugar que elige las
  implementaciones. Pasar las fotos a Supabase Storage = escribir otra clase
  que implemente `AlmacenFotos` y cambiar una línea.

**Beneficio comprobado:** 24 pruebas de los casos de uso
(`servicioReportes.test.ts`, `servicioMascotasResguardo.test.ts`) corren con
dobles en memoria (`src/servicios/dobles.ts`) en milisegundos, sin base de datos
ni disco, y cubren permisos, fotos inválidas, renovación y reglas de
propiedad.

Diagramas: [`04-solid-dip-puertos.puml`](./uml/04-solid-dip-puertos.puml),
[`03-arquitectura-capas.puml`](./uml/03-arquitectura-capas.puml),
[`08`](./uml/08-secuencia-publicar-reporte.puml) y
[`09`](./uml/09-secuencia-renovar-y-cerrar.puml) (secuencias).

## Pendiente (honestidad sobre el alcance)

La migración al patrón de puertos se hizo en las **escrituras de reportes,
mascotas y resguardo** (el flujo con más reglas y más efectos secundarios). Aún
dependen directamente de Prisma:

| Dónde | Qué falta |
|---|---|
| `lib/cache.ts` (lecturas con caché) | Definir puertos de consulta (`ConsultaReportes`, etc.) y mover las consultas a adaptadores |
| Rutas de cuenta: `login`, `registro`, `suscripcion`, `establecimiento`, `recordatorios` | `ServicioCuentas` + `RepositorioUsuarios` |
| Rutas `vacunas`, `mensajes`, `duplicados`, `alertas*` | Servicios y repositorios análogos |
| Páginas de servidor (`/cuenta`, `/refugio`, `/veterinaria`, paneles admin) | Leer a través de consultas, no de Prisma |
| `lib/almacenamiento.ts` | Sigue siendo el detalle del adaptador de disco (es correcto que esté en infraestructura; podría moverse a `src/infraestructura/`) |
| `components/FormularioReporte.tsx` (853 líneas) y `CampanaAlertas.tsx` (526) | Dividir en componentes por sección y un hook por fuente de avisos (S) |
| `puertos.ts` | Usa los tipos de fila de `@prisma/client` como entidades; para un aislamiento total se definirían entidades propias |

El patrón ya está establecido y probado, así que cada punto es una repetición
mecánica del mismo molde.
