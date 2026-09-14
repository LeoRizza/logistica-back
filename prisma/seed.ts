import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de usuarios...');

  try {
    // Limpiar tabla de usuarios
    await prisma.user.deleteMany();
    console.log('✓ Tabla de usuarios limpiada');

    const SALT_ROUNDS = 10;
    const basePassword = process.env.SEED_DEFAULT_PASSWORD;
    
    if (!basePassword) {
      throw new Error('SEED_DEFAULT_PASSWORD environment variable is required for seeding');
    }
    
    const passwordHash = await bcrypt.hash(basePassword, SALT_ROUNDS);

    // Crear 4 usuarios administrativos iniciales
    const users = await prisma.user.createMany({
      data: [
        {
          name: 'Administrador Principal',
          email: 'admin@logistica.com',
          password_hash: passwordHash,
          role: 'ADMIN',
        },
        {
          name: 'Gerente de Operaciones',
          email: 'manager@logistica.com',
          password_hash: passwordHash,
          role: 'MANAGER',
        },
        {
          name: 'Despachador',
          email: 'dispatcher@logistica.com',
          password_hash: passwordHash,
          role: 'DISPATCHER',
        },
        {
          name: 'Contador',
          email: 'accountant@logistica.com',
          password_hash: passwordHash,
          role: 'ACCOUNTANT',
        },
      ],
    });

    console.log(`✓ ${users.count} usuarios creados exitosamente`);
    console.log('');
    console.log('📋 Credenciales de acceso:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email: admin@logistica.com');
    console.log('Email: manager@logistica.com');
    console.log('Email: dispatcher@logistica.com');
    console.log('Email: accountant@logistica.com');
    console.log('');
    console.log('Contraseña: (definida en variable de entorno SEED_DEFAULT_PASSWORD)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
