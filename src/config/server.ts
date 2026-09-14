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
  // CORS Configuration - Strict mode
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001', // <-- El puerto actual de tu frontend
    'http://localhost:5173', // <-- Por si en el futuro migramos a Vite
    process.env.FRONTEND_URL // <-- Para cuando lo subas a producción
  ].filter(Boolean); // Filtramos undefined

  app.use(cors({
    origin: function (origin, callback) {
      // Permitimos peticiones sin origen (ej. Postman, cURL) o las que estén en la lista blanca
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed for this origin'));
      }
    },
    credentials: true, // Importante si después manejás cookies o sesiones
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

