import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { errorHandler } from '../middleware/errorHandler';
import { requestLogger } from '../middleware/requestLogger';
import { ApiResponse } from '../types/index';
import apiRoutes from '../routes/index';

export const configureServer = (app: Express): void => {
  // 1. Logger de solicitudes global (ANTES DE CORS para poder auditar el OPTIONS)
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[REQ IN] ${req.method} ${req.originalUrl} - Origin: ${req.headers.origin || 'Ninguno'}`);
    next();
  });

  // 2. CORS Configuration - Flexible y seguro
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    (process.env.FRONTEND_URL || '').trim(),
    'https://logistica-front-steel.vercel.app'
  ].filter(Boolean);

  app.use(cors({
    origin: function (origin, callback) {
      // Permitimos peticiones locales/backend (sin origen) o si el origen está en la lista
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.error(`[CORS RECHAZADO] Origen no permitido: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    // Al omitir 'allowedHeaders', la librería automáticamente refleja y permite
    // cualquier header que el frontend pida en el Access-Control-Request-Headers.
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

  // Registrar rutas de API
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

  // Global Error Handler
  app.use(errorHandler);
};

export default configureServer;