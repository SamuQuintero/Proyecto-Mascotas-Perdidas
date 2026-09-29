# PetMatch — Mascotas perdidas y encontradas

Proyecto académico de Ingeniería de Sistemas, desarrollado con metodología
Scrum. Aplicación web para facilitar la comunicación entre personas que
perdieron una mascota y personas que encontraron o vieron una.

## Objetivo del Sprint 1

> **Sprint Goal:** Permitir registrar y almacenar reportes de mascotas
> perdidas y encontradas, incluyendo información básica, fotografía y
> ubicación.

Fuente oficial de las historias de usuario: [`Product Backlog.xlsx`](./Product%20Backlog.xlsx).

## Historias implementadas en este Sprint

| ID (backlog) | Historia | Estado |
|---|---|---|
| HU-1 | Registrar un único reporte de mascota perdida con foto, fecha, zona y señas particulares | ✅ Implementada |
| HU-13 | El formulario siempre pide los mismos datos mínimos (especie, raza, color, tamaño, collar, zona, fecha) | ✅ Implementada |
| HU-2 | Registrar un hallazgo en menos de un minuto y sin crear una cuenta | ✅ Implementada |
| HU-5 | Reportar una mascota encontrada en el mismo lugar donde se publican las pérdidas | ✅ Implementada |
| HU-3 | Ubicar en un mapa el punto y la fecha de la última vez vista | ✅ Implementada |

## Sprint 3

> **Sprint Goal:** Avisar al dueño cuando aparece una mascota que puede ser
> la suya y darle una placa con QR para prevenir pérdidas.

El backlog vigente tiene 8 historias (ver
[docs/DISENO_PRODUCTO.md](./docs/DISENO_PRODUCTO.md#5-historias-de-usuario-backlog-vigente)).
Con este sprint quedan **todas implementadas**.

| ID | Historia | Estado |
|---|---|---|
| HU-4 | Alerta cuando se publica un reporte que coincide con las características de la mascota | ✅ Implementada |
| HU-7 | Notificación cuando hay un hallazgo cerca (a menos de 2 km) del lugar donde se perdió | ✅ Implementada |
| HU-8 | Perfil digital de la mascota con código QR imprimible | ✅ Implementada |

Además:
- Cada reporte pide la **fecha y hora** en que se perdió o se encontró la
  mascota, y muestra la fecha y hora de publicación.
- El mapa arranca centrado en **Pasto**.

**Cómo llegan las alertas sin cuentas:** el navegador recuerda los reportes
que se publicaron desde él. La campana 🔔 del navbar revisa cada minuto si
hay coincidencias o hallazgos cercanos, y el detalle de cada reporte muestra
sus alertas.

## Sprint 2

| ID | Historia | Estado |
|---|---|---|
| HU-6 | Filtrar reportes por zona, especie, color, tamaño y rango de fechas | ✅ Implementada |
| — | Editar reporte y marcarlo como "reencontrada" (solo administrador) | ✅ Implementada |

**Acceso de administrador.** La aplicación se sigue usando sin cuenta. El
botón **Admin** del navbar abre `/admin/login`; tras iniciar sesión, el
administrador tiene un panel (`/admin`) con todos los reportes y puede
editarlos y marcarlos como reencontrados. Las credenciales se definen en
`.env` (`ADMIN_USUARIO`, `ADMIN_CONTRASENA`, `ADMIN_SECRETO`; ver
`.env.example`) y nunca se suben al repositorio.

**Correcciones del Sprint 1 incluidas:**
- Todos los reportes se guardaban como anónimos (FormData envía `"false"`
  como texto y `z.coerce.boolean` lo convertía en `true`), así que el
  contacto del dueño no se mostraba. Se corrigió la validación y los
  reportes existentes con teléfono o correo.
- Las fechas se mostraban un día antes por la zona horaria (UTC vs.
  Colombia).

## Tecnologías

- **Next.js 14** (App Router) + **TypeScript** — frontend y backend en un
  solo proyecto.
- **Tailwind CSS** — estilos.
- **Prisma ORM** + **PostgreSQL (Supabase)** — persistencia.
- **React-Leaflet** + **OpenStreetMap** — selección y visualización de
  ubicación en mapa (sin API key).
- **Zod** — validación de datos, compartida entre formulario y API.
- **Vitest** — pruebas unitarias.

## Arquitectura

Ver el detalle completo, con diagramas, en
[docs/ARQUITECTURA.md](./docs/ARQUITECTURA.md).

Resumen: una única aplicación Next.js sirve tanto las páginas (React) como
la API (`/api/reportes`). Los reportes se guardan en PostgreSQL (Supabase)
vía Prisma; las fotografías se guardan en `public/uploads` detrás de un
servicio de almacenamiento aislado (`src/lib/almacenamiento.ts`) para poder
migrar a un proveedor en la nube (o al Storage de Supabase) sin tocar el
resto del código.

## Instalación

Requisitos: Node.js 18 o superior.

```bash
npm install
```

`npm install` ejecuta automáticamente `prisma generate`.

## Configuración

Este proyecto usa una base de datos PostgreSQL alojada en **Supabase**.

1. Crea (o abre) un proyecto en [supabase.com](https://supabase.com).
2. Ve a **Project Settings → Database → Connection string** y copia:
   - La cadena de **Connection pooling** (modo *Transaction*, puerto
     `6543`) → pégala como `DATABASE_URL`.
   - La cadena de **conexión directa** (puerto `5432`) → pégala como
     `DIRECT_URL`.
3. Copia la plantilla y edítala con esos valores:

   ```bash
   cp .env.example .env
   ```

4. Crea las tablas en tu base de datos de Supabase:

   ```bash
   npx prisma db push
   ```

`DATABASE_URL` es la que usa la aplicación en tiempo de ejecución;
`DIRECT_URL` la usa Prisma solo para `db push` / `migrate` (el pooler en
modo transacción no soporta las declaraciones preparadas que estos
comandos necesitan). Ninguna credencial va en el código: ambas viven en
`.env`, que está en `.gitignore`.

## Ejecución

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

Build de producción:

```bash
npm run build
npm run start
```

## Pruebas

```bash
npm test
```

Cubren la validación de datos mínimos obligatorios (HU-13) y el servicio
de almacenamiento de fotografías (formato, tamaño máximo, ruta generada).
Ver la sección "Pruebas" del informe de entrega para el detalle de qué se
verificó manualmente además de estas pruebas automatizadas.

## Estructura del proyecto

```
PetMatch/
├─ Product Backlog.xlsx        # Fuente oficial de historias de usuario
├─ docs/
│  ├─ ARQUITECTURA.md          # Arquitectura, modelo de datos y diagramas (Sprint 1)
│  └─ DISENO_PRODUCTO.md       # Backend, frontend, interfaz y roadmap de historias por sprint
├─ prisma/
│  └─ schema.prisma            # Modelo de datos (Reporte)
├─ public/
│  └─ uploads/                 # Fotografías subidas (contenido en tiempo de ejecución)
├─ src/
│  ├─ app/
│  │  ├─ page.tsx              # Pantalla inicial ("¿Qué necesitas hacer?")
│  │  ├─ perdida/nuevo/        # Formulario de mascota perdida (HU-1, HU-13, HU-3)
│  │  ├─ encontrada/nuevo/     # Formulario de mascota encontrada (HU-2, HU-5)
│  │  ├─ reportes/             # Listado y detalle de reportes
│  │  └─ api/reportes/         # API: crear y consultar reportes
│  ├─ components/              # FormularioReporte, MapaSelector, MapaVisor, etc.
│  └─ lib/                     # Validación (Zod), almacenamiento, acceso a datos
└─ README.md
```

## Posibles mejoras futuras

Notas del equipo (no son historias del backlog): notificaciones por correo
o push además de la campana dentro de la app, cuentas de usuario para que
las alertas lleguen en cualquier dispositivo, y paginación del listado de
reportes cuando crezca el volumen de datos.

## Estado del Sprint

**Sprint 1 completado** (HU-1, HU-13, HU-2, HU-5, HU-3).
**Sprint 2 completado** (HU-6, edición y estado "reencontrada").
**Sprint 3 completado** (HU-4, HU-7, HU-8): el proyecto compila
(`npm run build`) y las 60 pruebas automatizadas pasan (`npm test`).
