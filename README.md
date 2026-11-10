# PetMatch — Mascotas perdidas y encontradas

Proyecto académico de Ingeniería de Sistemas, desarrollado con metodología
Scrum. Aplicación web (Pasto, Nariño) para que quienes perdieron una mascota
y quienes encontraron o vieron una puedan reencontrarse: reportes con foto y
mapa, alertas de coincidencia, placa con código QR, directorio de refugios y
veterinarias, y cuentas opcionales para quien quiera más funciones.

**Equipo Scrum:** Pedro Josué Caicedo Gomajoa, Samuel Felipe Quintero
Riobamba, Jose Manuelito Cabrera Riobobo, Germán Andrés Tulcan Cifuentes.

**Documentación del proceso (entrega):** el informe completo (Scrum, sprints, arquitectura,
base de datos, diagramas, pruebas y manual) está en
[`informe/entrega/`](./informe/entrega) — un Word y un Excel con el Product Backlog, los sprints y
la métrica del equipo. Los diagramas UML están en [`diagramas/`](./diagramas/README.md).

## Qué se puede hacer

**Sin cuenta** (la app se usa completa sin registrarse): publicar una mascota
perdida o encontrada, filtrar reportes, escribir en el chat de un reporte,
crear la placa QR de una mascota, ver el directorio "Dónde acudir" y los
animales en resguardo. **Con cuenta**: renovar, editar y cerrar tus propios
reportes, recibir avisos de cercanía y, según el rol, llevar carnet de
vacunas o publicar animales en resguardo.

| Rol | Cómo entra | Qué hace |
|---|---|---|
| Visitante | — | Publica, busca, filtra, chatea, crea placas QR |
| Ciudadano | `/cuenta/login` | Avisos por zona y radio, renueva/edita/cierra sus reportes, edita sus placas |
| Veterinaria | `/cuenta/login` | Carnet de vacunas, ve todos los reportes (solo lectura), aparece en "Dónde acudir" |
| Refugio | `/cuenta/login` | Publica animales en resguardo, aparece en "Dónde acudir" |
| Administrador | `/admin/login` | Edita y cierra cualquier reporte, ve indicadores |

## Historias de usuario y Sprints (27 de 27 completadas)

Cuatro Sprints de dos semanas (08/09/2026 – 02/11/2026). El detalle
—Sprint Backlog, Sprint Goal, Definition of Done, Review y Retrospective— está en
el informe; las fichas con criterios de aceptación de cada historia, en su Anexo A.

| Sprint | Fechas | Historias |
|---|---|---|
| 1 | 08/09 – 21/09 | HU-1, 2, 3, 5, 13 — registrar pérdidas y hallazgos con foto y mapa |
| 2 | 22/09 – 05/10 | HU-6, 12, 21, 25, 26, 27 — filtrar, ordenar, editar, eliminar, cerrar y compartir reportes |
| 3 | 06/10 – 19/10 | HU-4, 7, 8, 9, 10, 11, 14 — alertas de coincidencia y cercanía, perfil con placa QR, chat y listado único |
| 4 | 20/10 – 02/11 | HU-15 a 20, 22, 23, 24 — cuentas por rol, refugios, duplicados, renovación e indicadores |

Los Sprints 1 y 2 salen del Excel del equipo (`Product Backlog.xlsx`); los Sprints 3 y 4 reparten el resto
por prioridad (valor × urgencia) y dependencias.

| HU | Historia |
|---|---|
| HU-1, 2, 3, 5, 13 | Publicar pérdida o hallazgo con foto, fecha, zona y mapa; datos mínimos fijos; sin cuenta |
| HU-4, 7, 10, 24 | Alertas por coincidencia de características, cercanía (2 km), perfil con QR y señas de gato |
| HU-6, 14, 27 | Filtros del listado, listado único de todas las zonas y orden por fecha |
| HU-8, 9 | Perfil de la mascota con placa QR imprimible y perfil público al escanearlo |
| HU-11, 15 | Chat por reporte sin exponer contacto; advertencia de duplicados |
| HU-12, 19, 23, 25, 26 | Cerrar, renovar, editar y eliminar reportes (el dueño o el administrador) |
| HU-16, 17, 18, 20 | Cuentas: avisos por zona (ciudadano), carnet de vacunas (veterinaria), «Dónde acudir» y animales en resguardo (refugio) |
| HU-21, 22 | Compartir en redes con vista previa; indicadores por especie, zona y tiempo |

Notas de diseño:

- **Dueño de un reporte:** solo los reportes y placas creados con la sesión
  iniciada tienen dueño. Lo anterior (o lo publicado sin cuenta) solo lo
  gestiona el administrador.
- **Re-difusión (HU-19)** no es automática: no hay tareas programadas, la
  confirma el dueño (o el administrador).
- **Campana 🔔:** reúne avisos de los reportes publicados desde ese navegador, de las
  mascotas con placa QR y, con sesión, los avisos de cercanía y los
  recordatorios de renovación.
- **Cambios de alcance** respecto al backlog original: HU-7, HU-10 y HU-17 se
  redefinieron por factibilidad técnica (ver el informe, sección 2.5).

## Tecnologías

- **Next.js 15** (App Router, React 19) + **TypeScript** — frontend y backend en un
  solo proyecto.
- **Tailwind CSS** — estilos.
- **Prisma ORM** + **PostgreSQL (Supabase)** — persistencia.
- **React-Leaflet** + **OpenStreetMap** — mapas (sin API key).
- **Zod** — validación compartida entre formularios y API.
- **Vitest** — pruebas unitarias.
- Sesiones propias por cookie firmada con HMAC (sin librerías de
  autenticación): una para el administrador único (variables de entorno) y
  otra para las cuentas reales (tabla `Usuario`, contraseñas con scrypt).

## Arquitectura

Detalle con diagramas en [docs/ARQUITECTURA.md](./docs/ARQUITECTURA.md).
Los diagramas UML (PlantUML) están en [docs/uml/](./docs/uml/README.md) y el
análisis de los principios SOLID en [docs/SOLID.md](./docs/SOLID.md).

El código sigue una arquitectura de **puertos y adaptadores** en las escrituras
de reportes, mascotas y resguardo:
`rutas → servicios (src/servicios) → puertos (src/lib/puertos.ts) ← adaptadores (src/infraestructura)`,
conectados en `src/composicion.ts`. Los servicios se prueban con dobles en
memoria, sin base de datos.

Una sola aplicación Next.js sirve las páginas y la API. Piezas clave:

- `src/lib/coincidencias/` — lógica pura de coincidencias (HU-4, 7, 10,
  15, 20, 24): sin acceso a la base de datos, fácil de probar. Un motor de
  puntuación genérico suma criterios intercambiables (especie, color, tamaño,
  distancia, señas de gato). Agrupa colores por familias ("café", "marrón" y
  "chocolate" son lo mismo).
- `src/lib/felinos.ts`, `renovacion.ts`, `propiedad.ts`, `indicadores.ts`,
  `establecimientos.ts`, `resguardo.ts`, `compartir.ts` — reglas de cada
  historia, también puras y con pruebas.
- `src/lib/sesion.ts` + `admin.ts` — sesión del administrador;
  `sesionUsuario.ts` + `cuenta.ts` — sesión de ciudadano, veterinaria y
  refugio. El layout usa `usuarioSesionLigera()` (decodifica la cookie sin
  consultar la base) para no gastar una consulta en cada navegación.
- `src/lib/cache.ts` — **caché por etiquetas** de las lecturas comunes
  (listados, portada, resguardo, directorio). Cada escritura llama a
  `invalidar(...)`, así que no muestra datos viejos. Se hizo porque cada
  consulta a Supabase tarda ~0,5 s desde Colombia.
- `src/lib/dispositivo.ts` — el navegador recuerda los reportes y placas
  creados desde él, para que la campana sepa de quién mostrar alertas.
- Fechas siempre en hora de Colombia (`src/lib/formato.ts`, zona
  `America/Bogota`), nunca UTC.
- Fotos: `src/lib/almacenamiento.ts` las guarda en `public/uploads` detrás
  de una interfaz aislada, para migrar a otro proveedor sin tocar el resto.

## Instalación

Requisitos: Node.js 18 o superior.

```bash
npm install
```

`npm install` ejecuta `prisma generate` automáticamente.

## Configuración

La base de datos es PostgreSQL en **Supabase**.

1. Crea (o abre) un proyecto en [supabase.com](https://supabase.com).
2. En **Project Settings → Database → Connection string** copia la cadena
   del **pooler** (modo *Transaction*, puerto `6543`) como `DATABASE_URL`, y
   la de **conexión directa** (puerto `5432`) como `DIRECT_URL`.
3. Copia la plantilla y complétala:

   ```bash
   cp .env.example .env
   ```

4. Crea las tablas y **activa RLS** (ver seguridad abajo):

   ```bash
   npx prisma db push
   npm run db:rls
   ```

### Variables de entorno (`.env`, nunca se sube a git)

| Variable | Para qué |
|---|---|
| `DATABASE_URL`, `DIRECT_URL` | Conexión a Supabase (pooler / directa) |
| `ADMIN_USUARIO`, `ADMIN_CONTRASENA`, `ADMIN_SECRETO` | Administrador único y clave de su cookie |
| `SESION_SECRETO` | Clave para firmar la cookie de las cuentas reales |
| `URL_PUBLICA` | Dominio público (para el QR de las placas y los enlaces al compartir) |
| `MOSTRAR_CUENTAS_PRUEBA` | `true` muestra cuentas de ejemplo en el login. **Solo para pruebas; quítalo en producción** |

### Seguridad: RLS en Supabase

Supabase publica cada tabla de `public` por su API REST con la clave
pública `anon`. PetMatch no usa esa API (todo va por Prisma con el rol
`postgres`, que se salta RLS), así que se activa RLS **sin políticas** para
cerrarla. Las tablas nuevas nacen sin RLS: **corre `npm run db:rls` después
de cada `prisma db push` que cree tablas**. Es idempotente.

## Ejecución

```bash
npm run dev      # desarrollo en http://localhost:3000
npm run build    # build de producción
npm run start
```

Notas para Windows: no corras `next build` mientras `npm run dev` está
activo (se pisan archivos de Prisma y Next) y ten un solo servidor de
desarrollo abierto. `prisma db push` con el servidor activo puede tumbarlo;
reinícialo después.

### Datos de demostración

```bash
npm run cuentas:prueba   # crea las cuentas de ejemplo
npm run demo             # 10 reportes, 2 placas, carnet de vacunas, resguardo y chat
npm run demo -- --borrar # los elimina
```

Las fotos de la demostración son ilustraciones propias (`prisma/demo-fotos`), no
imágenes de terceros.

### Cuentas de prueba (pruebas de usabilidad)

```bash
npm run cuentas:prueba
```

Crea o actualiza una cuenta por rol en la base de datos (datos y
contraseña en [`prisma/cuentas-prueba.json`](./prisma/cuentas-prueba.json)):
`ciudadano@petmatch.test`, `veterinaria@petmatch.test` y
`refugio@petmatch.test`. El administrador usa las credenciales de `.env`.
Con `MOSTRAR_CUENTAS_PRUEBA=true`, el login muestra botones que rellenan el
formulario. **Borra estas cuentas y quita la variable antes de publicar la
app.**

## Seguridad

La aplicación guarda datos personales (nombres, teléfonos, correos, ubicaciones), así
que la seguridad se trata en capas. Ningún sistema es «inhackeable»: estas medidas
reducen la superficie de ataque y limitan el daño si algo falla.

| Capa | Medida |
|---|---|
| Transporte y navegador | Cabeceras `Content-Security-Policy`, `Strict-Transport-Security` (sobre HTTPS), `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `COOP/CORP`; sin `X-Powered-By` |
| Autenticación | Contraseñas con scrypt (N=2^15) y sal propia; política de 10+ caracteres con letras y números, sin contraseñas comunes ni el correo; bloqueo tras 5 fallos por correo e IP (429); igualación de tiempos para no revelar qué correos existen |
| Sesiones | Cookie firmada con HMAC, `httpOnly`, `sameSite=lax`, `secure` en producción; 7 días (ciudadano) y 8 horas (admin); en producción los secretos de firma (≥ 32 caracteres) y la contraseña de admin (≥ 12) son obligatorios |
| Peticiones | `middleware` con verificación de origen (CSRF), límite de tamaño del cuerpo (6 MB) y límite de peticiones por IP (registro, acceso, publicación, escritura, lectura) |
| Archivos | Las fotos se identifican por sus primeros bytes (no por el tipo declarado), se les quitan los metadatos EXIF/GPS (se conserva la orientación) y se sirven con `nosniff` y `sandbox` |
| Datos | Row Level Security activado en las 6 tablas (`npm run db:rls`); Prisma parametriza todas las consultas; Zod valida cada entrada; React escapa toda salida |
| Operación | Los scripts que crean datos de prueba (`demo`, `cuentas:prueba`, `humo`, `capturas`) se niegan a correr contra una base que no sea local; las cuentas de prueba nunca se muestran en producción; `next/image` desactivado |

Limitaciones conocidas (se documentan en el informe): el límite de peticiones vive en la
memoria de cada instancia del servidor (en serverless sería por instancia; para uno
global haría falta Redis); el correo no se verifica al registrarse; los datos de contacto
que la persona decide publicar en un reporte son visibles para cualquiera por diseño del
producto.

## Pruebas

```bash
npm test            # 237 pruebas unitarias y de servicios (vitest)
npm run humo        # prueba de humo: 80 comprobaciones de todos los roles contra el aplicativo en ejecución
npm run capturas    # capturas de pantalla de cada rol (Microsoft Edge)
npm run informe     # regenera el informe Word y el Excel de sprints
npm run diagramas   # regenera los diagramas UML
```

- **237 pruebas unitarias:** la lógica pura (validación, coincidencias y duplicados,
  señas felinas, renovación y permisos, indicadores, directorio, resguardo,
  compartir, sesiones, contraseñas y fechas) y los casos de uso de
  `src/servicios/` con dobles en memoria, sin base de datos. Cobertura de los
  módulos de reglas de negocio superior al 92 % de líneas.
- **Prueba de humo (`npm run humo`):** con el aplicativo en marcha, recorre los flujos de
  visitante, ciudadano, veterinaria, refugio y administrador por HTTP (permisos 401, 403, 404,
  409 y 429, publicar, editar, renovar, cerrar y eliminar reportes, chat, placas, vacunas,
  resguardo y directorio) y limpia lo que crea. Resultado en `informe/datos/prueba_humo.json`.

## Estructura del proyecto

```
├─ Product Backlog.xlsx          # Fuente oficial de historias de usuario
├─ docs/                         # ARQUITECTURA.md, DISENO_PRODUCTO.md, SOLID.md
│  └─ uml/                       # 14 diagramas PlantUML (.puml)
├─ prisma/
│  ├─ schema.prisma              # Reporte, Mensaje, Usuario, Mascota, Vacuna, AnimalResguardo
│  └─ cuentas-prueba.json        # Datos de las cuentas de prueba
├─ informe/                      # Informe de proceso (Word), Excel de sprints y su generador (npm run informe)
├─ scripts/
│  ├─ crear-cuentas-prueba.js    # npm run cuentas:prueba
│  ├─ datos-demo.js              # npm run demo
│  ├─ prueba-humo.js             # npm run humo
│  ├─ capturas.js                # npm run capturas
│  └─ activar-rls.js             # npm run db:rls
├─ public/uploads/               # Fotos subidas (en tiempo de ejecución)
└─ src/
   ├─ app/
   │  ├─ page.tsx                # Inicio
   │  ├─ perdida/nuevo, encontrada/nuevo      # Formularios (HU-1, 2, 3, 5, 13)
   │  ├─ reportes/               # Listado, detalle y edición
   │  ├─ mascotas/               # Placas QR y perfil público (HU-8, 9)
   │  ├─ donde-acudir/, resguardo/            # HU-18, HU-20
   │  ├─ cuenta/, veterinaria/, refugio/      # Paneles por rol
   │  ├─ admin/                  # Panel, login e indicadores (HU-22)
   │  └─ api/                    # Reportes, mascotas, resguardo, cuenta, alertas
   ├─ components/                # Formularios, campana, mapas, ShellAcceso, etc.
   ├─ servicios/                 # Casos de uso (dependen de puertos, no de Prisma)
   ├─ infraestructura/           # Adaptadores: Prisma, disco, caché de Next, HTTP
   ├─ composicion.ts             # Raíz de composición: elige las implementaciones
   └─ lib/                       # Lógica pura, puertos, sesiones, caché, validación
```

## Posibles mejoras futuras

Notas del equipo (no son historias del backlog): notificaciones por correo o
push, re-difusión automática con una tarea programada, varias fotos por
mascota, mover Supabase a una región más cercana a Colombia para reducir la
latencia, y paginación del listado de reportes cuando crezca el volumen.

## Estado del proyecto

**27 de 27 historias implementadas en 4 Sprints.** Pasan las 237 pruebas automatizadas
(`npm test`), la prueba de humo (80/80) y el proyecto compila (`npm run build`). Pendiente: el despliegue.
