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

Todas las demás historias del backlog (HU-4, HU-6 a HU-24) quedan **fuera
de alcance** de este Sprint. Ver detalle en
[docs/ARQUITECTURA.md](./docs/ARQUITECTURA.md) y en la sección
"Historias futuras" más abajo.

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

## Historias futuras (explícitamente fuera de este Sprint)

No implementadas — quedan en el backlog para sprints posteriores:

- HU-4 — Alertas automáticas de coincidencia.
- HU-6 — Filtros avanzados (zona, especie, color, tamaño, fechas).
- HU-7 / HU-10 — Comparación e IA sobre fotografías.
- HU-8 / HU-9 — Perfil digital con código QR.
- HU-11 — Chat interno entre dueño y hallador.
- HU-12 — Marcar reporte como "reencontrada".
- HU-14 a HU-24 — Refugios, veterinarias, microchip, redes sociales,
  reactivación de reportes, dashboard administrativo, señas específicas de
  felinos, etc.

**Posible mejora futura** (no es una historia del Excel, es una nota del
equipo): agregar paginación al listado de reportes cuando el volumen de
datos crezca.

## Estado del Sprint

**Completado.** Las 5 historias planeadas (HU-1, HU-13, HU-2, HU-5, HU-3)
están implementadas, el proyecto compila (`npm run build`), corre
(`npm run dev`) y las pruebas automatizadas pasan (`npm test`).
