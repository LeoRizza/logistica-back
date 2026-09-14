import express, { Express } from 'express';
import dotenv from 'dotenv';
import { configureServer } from './config/server';
import { disconnectDatabase, prisma } from './config/database';
import apiRoutes from './routes/index';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';

/**
 * Configura la aplicación Express
 */
const startServer = async (): Promise<void> => {
  try {
    // Configurar servidor con middleware global
    configureServer(app);

    // Verificar conexión con la base de datos
    await prisma.$queryRaw`SELECT 1`;
    console.info('✓ Database connection successful');

    // Registrar rutas de API
    /*app.use(`/api/${API_VERSION}`, apiRoutes);*/

    // Iniciar servidor
    app.listen(PORT, (): void => {
      console.info(`
╔════════════════════════════════════════════════════════╗
║   Logistica API Server Started Successfully            ║
║   Environment: ${process.env.NODE_ENV || 'development'}
║   Port: ${PORT}
║   API Version: ${API_VERSION}
║   Timestamp: ${new Date().toISOString()}
╚════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

/**
 * Manejo de señales para cierre graceful
 */
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.info(`\nReceived ${signal}. Shutting down gracefully...`);
  try {
    await disconnectDatabase();
    console.info('✓ Database disconnected');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error during shutdown:', error);
    process.exit(1);
  }
};

// Manejo de señales
process.on('SIGTERM', () => {
  gracefulShutdown('SIGTERM').catch(console.error);
});
process.on('SIGINT', () => {
  gracefulShutdown('SIGINT').catch(console.error);
});

// Manejo de excepciones no capturadas
process.on('uncaughtException', (error: Error): void => {
  console.error('✗ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown): void => {
  console.error('✗ Unhandled Rejection:', reason);
  process.exit(1);
});

// Iniciar servidor
startServer().catch(console.error);

export default app;

