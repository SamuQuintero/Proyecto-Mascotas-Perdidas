// Activa Row Level Security (RLS) en todas las tablas del esquema `public`.
//
// Por qué: Supabase expone cada tabla de `public` por su API REST (PostgREST)
// con la clave pública `anon`. Sin RLS, cualquiera con esa clave podría leer
// o modificar los datos (incluidos los hashes de contraseña de `Usuario`).
// PetMatch NO usa esa API: todo el acceso va por Prisma con el rol `postgres`,
// que se salta RLS. Activar RLS sin políticas bloquea la API pública y no
// afecta a la aplicación.
//
// Uso:  npm run db:rls
// Corre esto después de cada `prisma db push` que cree tablas nuevas: las
// tablas nuevas nacen sin RLS. Es idempotente.

const { PrismaClient } = require("@prisma/client");

// Conexión directa (puerto 5432): el pooler en modo transacción no es
// necesario aquí, pero DIRECT_URL es la que Prisma ya usa para db push.
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

async function main() {
  const tablas = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;

  for (const { tablename } of tablas) {
    // El nombre sale del catálogo de Postgres, no de entrada de usuario;
    // aun así se cita como identificador.
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "public"."${tablename.replace(/"/g, '""')}" ENABLE ROW LEVEL SECURITY`
    );
  }

  const estado = await prisma.$queryRaw`
    SELECT c.relname AS tabla, c.relrowsecurity AS rls
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' ORDER BY c.relname`;
  for (const { tabla, rls } of estado) {
    console.log(`${rls ? "RLS activo " : "SIN RLS    "} public.${tabla}`);
  }
  if (estado.some((e) => !e.rls)) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("No se pudo activar RLS:", error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
