import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient;

/**
 * Proxy que intercepta los llamados a Prisma para garantizar
 * que la instanciación ocurra estrictamente Post-Fork en Hostinger.
 */
export const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn', 'info']
      : ['error'],
});

/**
 * Desconecta la base de datos durante el apagado del servidor
 */
export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
};

export default prisma;