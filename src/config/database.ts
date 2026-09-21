import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient;

/**
 * Proxy que intercepta los llamados a Prisma para garantizar
 * que la instanciación ocurra estrictamente Post-Fork en Hostinger.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get: (_target, prop: keyof PrismaClient) => {
    // Si no existe la instancia, la creamos acá (Lazy Load seguro)
    if (!prismaInstance) {
      prismaInstance = new PrismaClient({
        log:
          process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn', 'info']
            : ['error'],
      });
      console.log('Instancia de Prisma creada de forma segura (Post-Fork)');
    }

    // Devolvemos la propiedad asegurando el contexto
    const value = prismaInstance[prop];
    return typeof value === 'function' ? value.bind(prismaInstance) : value;
  }
});

/**
 * Desconecta la base de datos durante el apagado del servidor
 */
export const disconnectDatabase = async (): Promise<void> => {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
  }
};

export default prisma;