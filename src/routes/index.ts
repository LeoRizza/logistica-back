import { Router, Request, Response } from 'express';
import { ApiResponse } from '../types/index';
import { authenticateUser } from '../middleware/auth';

// Import route modules
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import driverRoutes from './driverRoutes';
import vehicleRoutes from './vehicleRoutes';
import tripRoutes from './tripRoutes';
import expenseRoutes from './expenseRoutes';
import fuelRoutes from './fuelRoutes';
import settlementRoutes from './settlementRoutes';
import clientRoutes from './clientRoutes';
import dashboardRoutes from './dashboardRoutes';

const router = Router();

/**
 * Rutas principales de la API v1
 * Agrupa todas las rutas de los diferentes módulos
 */

// Health check
router.get('/', (req: Request, res: Response): void => {
  const response: ApiResponse<{ message: string; version: string; timestamp: string }> = {
    success: true,
    message: 'Welcome to Logistica API - Backend v1',
    data: {
      message: 'API is running successfully',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  };
  res.status(200).json(response);
});

// Authentication routes (sin middleware de autenticación)
router.use('/auth', authRoutes);

// API v1 routes (con middleware de autenticación)
router.use('/users', authenticateUser, userRoutes);
router.use('/drivers', authenticateUser, driverRoutes);
router.use('/vehicles', authenticateUser, vehicleRoutes);
router.use('/trips', authenticateUser, tripRoutes);
router.use('/expenses', authenticateUser, expenseRoutes);
router.use('/fuel', authenticateUser, fuelRoutes);
router.use('/settlements', authenticateUser, settlementRoutes);
router.use('/clients', authenticateUser, clientRoutes);
router.use('/dashboard', authenticateUser, dashboardRoutes);

// Health check endpoint
router.get('/health', (req: Request, res: Response): void => {
  const response: ApiResponse<{ status: string }> = {
    success: true,
    message: 'API Health Check',
    data: {
      status: 'healthy',
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  };
  res.status(200).json(response);
});

export default router;
