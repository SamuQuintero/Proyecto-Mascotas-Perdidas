# PetMatch — Mascotas perdidas y encontradas

Proyecto académico de Ingeniería de Sistemas, desarrollado con metodología
Scrum. Aplicación web (Pasto, Nariño) para que quienes perdieron una mascota
y quienes encontraron o vieron una puedan reencontrarse: reportes con foto y
mapa, alertas de coincidencia, placa con código QR, directorio de refugios y
veterinarias, y cuentas opcionales para quien quiera más funciones.

**Equipo Scrum:** Pedro Josué Caicedo Gomajoa, Samuel Felipe Quintero
Riobamba, Jose Manuelito Cabrera Riobobo, Germán Andrés Tulcan Cifuentes.

Fuente oficial de las historias de usuario: [`Product Backlog.xlsx`](./Product%20Backlog.xlsx)
y [docs/DISENO_PRODUCTO.md](./docs/DISENO_PRODUCTO.md).

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

## Historias de usuario implementadas (24)

### Sprint 1 — Registrar reportes
| ID | Historia |
|---|---|
| HU-1 | Reporte de mascota perdida con foto, fecha, zona y señas |
| HU-2 | Reportar un hallazgo en menos de un minuto y sin cuenta |
| HU-3 | Ubicar en un mapa el punto y la fecha de la última vez vista |
| HU-5 | Reportar una mascota encontrada en el mismo lugar que las pérdidas |
| HU-13 | Formulario con datos mínimos fijos (especie, raza, color, tamaño, collar, zona, fecha) |

### Sprint 2 — Gestión
| ID | Historia |
|---|---|
| HU-6 | Filtrar reportes por zona, especie, color, tamaño y fechas (`/reportes`) |
| HU-12 | Marcar un reporte como "reencontrada" (admin; también su dueño, ver HU-19) |
| HU-25 | Editar un reporte (admin; también su dueño, ver HU-23) |

### Sprint 3 — Alertas y placa QR
| ID | Historia |
|---|---|
| HU-4 | Alerta cuando se publica un reporte que coincide por características |
| HU-7 | Aviso de hallazgos a menos de 2 km de donde se perdió |
| HU-8 | Perfil de mascota con código QR imprimible (`/mascotas`) |

### Sprint 4 — Comunidad y cuentas
| ID | Historia |
|---|---|
| HU-9 | Escanear el QR para ver el contacto (es el perfil público de la mascota) |
| HU-10 | Alerta si se publica un hallazgo con las características de una mascota con placa QR |
| HU-11 | Chat por reporte, sin cuentas |
| HU-14 | Listado global filtrable (cubierto por `/reportes`) |
| HU-15 | Advertir posibles reportes duplicados antes de publicar |
| HU-16 | Cuentas de ciudadano con avisos de cercanía (mapa + radio en km) |
| HU-17 | Cuenta de veterinaria: reportes de solo lectura y carnet de vacunas |

### Sprint 5 — Refugios, difusión e indicadores
| ID | Historia |
|---|---|
| HU-18 | **Dónde acudir** (`/donde-acudir`): veterinarias y refugios que reciben mascotas encontradas, ordenados por cercanía |
| HU-19 | **Renovar** un reporte para volver a difundirlo: sube en el listado, vuelve a avisar por cercanía y a los 7 días la campana pregunta "¿sigue perdida?". El dueño puede cerrarlo con "¡Ya apareció!" |
| HU-20 | **Refugios** (`/refugio`, `/resguardo`): publican animales bajo resguardo y desde cuándo; generan alertas contra pérdidas parecidas |
| HU-21 | **Compartir** un reporte en WhatsApp, Facebook, X o copiando el enlace, con vista previa (Open Graph) |
| HU-22 | **Indicadores** del admin (`/admin/indicadores`): reportes, coincidencias y reunificaciones por especie, zona y mes, y la brecha perros vs gatos |
| HU-23 | El dueño **edita** contacto y foto de sus reportes y placas (solo con la cuenta con la que los creó) |
| HU-24 | **Señas de gato**: patrón y largo del pelaje, color de ojos, interior; afinan la coincidencia entre gatos |

Notas de diseño:

- **Dueño de un reporte:** solo los reportes y placas creados con la sesión
  iniciada tienen dueño. Lo anterior (o lo publicado sin cuenta) solo lo
  gestiona el administrador.
- **Re-difusión (HU-19)** no es automática: no hay tareas programadas, la
  confirma el dueño (o el admin).
- **Campana 🔔:** reúne avisos de los reportes publicados desde ese
  navegador (coincidencias, cercanía, animales en resguardo), de las
  mascotas con placa QR, y, con sesión, los avisos de cercanía y los
  recordatorios de renovación.
- **"Interior" (HU-24)** solo se muestra; no cambia el puntaje de
  coincidencia.

## Tecnologías

- **Next.js 14** (App Router) + **TypeScript** — frontend y backend en un
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

Una sola aplicación Next.js sirve las páginas y la API. Piezas clave:

- `src/lib/coincidencias.ts` — lógica pura de coincidencias (HU-4, 7, 10,
  15, 20, 24): sin acceso a la base de datos, fácil de probar. Agrupa
  colores por familias ("café", "marrón" y "chocolate" son lo mismo).
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

## Pruebas

```bash
npm test
```

179 pruebas unitarias sobre la lógica pura: validación de datos, coincidencias
y duplicados, señas felinas, renovación y permisos, indicadores, directorio,
resguardo, compartir, sesiones, contraseñas y fechas.

## Estructura del proyecto

```
├─ Product Backlog.xlsx          # Fuente oficial de historias de usuario
├─ docs/                         # ARQUITECTURA.md y DISENO_PRODUCTO.md
├─ prisma/
│  ├─ schema.prisma              # Reporte, Mensaje, Usuario, Mascota, Vacuna, AnimalResguardo
│  └─ cuentas-prueba.json        # Datos de las cuentas de prueba
├─ scripts/
│  ├─ crear-cuentas-prueba.js    # npm run cuentas:prueba
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
   └─ lib/                       # Lógica pura, sesiones, caché, validación
```

## Posibles mejoras futuras

Notas del equipo (no son historias del backlog): notificaciones por correo o
push, re-difusión automática con una tarea programada, varias fotos por
mascota, mover Supabase a una región más cercana a Colombia para reducir la
latencia, y paginación del listado de reportes cuando crezca el volumen.

## Estado del proyecto

**24 historias implementadas.** Pasan las 179 pruebas automatizadas
(`npm test`) y el proyecto compila (`npm run build`).
