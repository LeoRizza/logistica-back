import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { errorHandler } from '../middleware/errorHandler';
import { requestLogger } from '../middleware/requestLogger';
import { ApiResponse } from '../types/index';
import apiRoutes from '../routes/index';

/**
 * Configura la instancia de Express con middleware global
 * @param app - Instancia de Express
 */
export const configureServer = (app: Express): void => {
  // 1. MIDDLEWARE DE AUDITORÍA DE REDIRECCIONES (Antes que cualquier otra cosa)
  app.use((req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    console.log(`[REQ IN] ${req.method} ${req.originalUrl}`);

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      if (res.statusCode === 307 || res.statusCode === 301 || res.statusCode === 302) {
        console.error(`[ALERTA REDIRECT] Status: ${res.statusCode} | Método: ${req.method} | Endpoint: ${req.originalUrl} | Destino (Location): ${res.getHeader('Location')} | Tiempo: ${duration}ms`);
      } else {
        // Podés comentar esta línea si te ensucia mucho el log, pero sirve para confirmar que pasa el request
        console.log(`[REQ OUT] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - ${duration}ms`);
      }
    });

    next();
  });
  // CORS Configuration - Strict mode
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001', // <-- El puerto actual de tu frontend
    'http://localhost:5173', // <-- Por si en el futuro migramos a Vite
    (process.env.FRONTEND_URL || '').trim(), // Limpia espacios y saltos de línea de Hostinger
    'https://logistica-front-steel.vercel.app' // Fallback duro de seguridad
  ].filter(Boolean); // Filtramos undefined o strings vacíos

  app.use(cors({
    origin: function (origin, callback) {
      // 1. Logueamos exactamente qué está pidiendo acceso
      console.log(`[CORS DEBUG] Origin entrante: '${origin}'`);

      // 2. Logueamos cómo quedó armado el array final en el servidor
      console.log(`[CORS DEBUG] Lista de orígenes permitidos:`, allowedOrigins);

      if (!origin) {
        console.log('[CORS DEBUG] Petición sin origin (Postman/cURL). Permitido.');
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        console.log(`[CORS DEBUG] Match exitoso para: '${origin}'. Permitido.`);
        return callback(null, true);
      } else {
        console.error(`[CORS DEBUG] ERROR FATAL: El origin '${origin}' fue rechazado porque no coincide exactamente con los orígenes permitidos.`);
        return callback(new Error('CORS not allowed for this origin'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Middleware para parsear JSON y URL-encoded data
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Request Logger Middleware
  app.use(requestLogger);

  // Health Check Endpoint
  app.get('/health', (_req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
    });
  });

  // API Version Endpoint
  app.get('/api/version', (_req: Request, res: Response): void => {
    const response: ApiResponse<{ version: string; environment: string }> = {
      success: true,
      message: 'API Version',
      data: {
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
      timestamp: new Date().toISOString(),
      path: '/api/version',
    };
    res.status(200).json(response);
  });

  // Registrar rutas de API (ESTO DEBE IR ESTRICTAMENTE ANTES DEL 404)
  const API_VERSION = process.env.API_VERSION || 'v1';
  app.use(`/api/${API_VERSION}`, apiRoutes);

  // 404 Handler
  app.use((_req: Request, res: Response): void => {

    res.status(404).json({
      success: false,
      message: 'Route not found',
      statusCode: 404,
      timestamp: new Date().toISOString(),
      path: _req.path,
    });
  });

  // Global Error Handler (debe estar al final)
  app.use(errorHandler);
};

export default configureServer;

