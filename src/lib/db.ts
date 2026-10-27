import { PrismaClient } from "@prisma/client";

// Evita crear múltiples instancias de PrismaClient en desarrollo,
// donde Next.js recarga módulos con cada cambio de código (hot reload).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const nuevo = !globalForPrisma.prisma;
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// El primer acceso a la base tarda ~1,3 s por abrir la conexión: se abre
// al crear el cliente, no en la primera petición de una persona. Si falla,
// la primera consulta lo reintenta y muestra el error de siempre.
if (nuevo) void prisma.$connect().catch(() => {});
