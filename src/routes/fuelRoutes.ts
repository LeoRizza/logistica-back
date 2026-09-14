import { Router } from 'express';
import FuelController from '../controllers/fuelController';
import { asyncHandler } from '../middleware/asyncHandler';

const router: Router = Router();
const fuelController = new FuelController();

/**
 * FuelLog Routes
 * Gestión de registros de carga de combustible para vehículos
 * 
 * IMPORTANTE: Las rutas más específicas deben ir ANTES que las más genéricas
 * para evitar conflictos de coincidencia de rutas
 */

// Create fuel log
router.post(
  '/',
  asyncHandler((req, res) => fuelController.createFuelLog(req, res))
);

// Get average fuel consumption (DEBE ir ANTES de /vehicle/:vehicleId y /:id)
router.get(
  '/vehicle/:vehicleId/average-consumption',
  asyncHandler((req, res) => fuelController.getAverageFuelConsumption(req, res))
);

// Get fuel statistics by period (DEBE ir ANTES de /vehicle/:vehicleId y /:id)
router.get(
  '/vehicle/:vehicleId/statistics',
  asyncHandler((req, res) => fuelController.getFuelStatisticsByPeriod(req, res))
);

// Get fuel logs by vehicle (DEBE ir ANTES de /:id)
router.get(
  '/vehicle/:vehicleId',
  asyncHandler((req, res) => fuelController.getFuelLogsByVehicle(req, res))
);

// Get fuel log by ID (genérica, va última)
router.get(
  '/:id',
  asyncHandler((req, res) => fuelController.getFuelLogById(req, res))
);

// Update fuel log
router.put(
  '/:id',
  asyncHandler((req, res) => fuelController.updateFuelLog(req, res))
);

// Delete fuel log
router.delete(
  '/:id',
  asyncHandler((req, res) => fuelController.deleteFuelLog(req, res))
);

export default router;
