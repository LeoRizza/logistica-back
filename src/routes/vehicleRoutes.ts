import { Router } from 'express';
import VehicleController from '../controllers/vehicleController';
import { asyncHandler } from '../middleware/asyncHandler';

const router: Router = Router();
const vehicleController = new VehicleController();

/**
 * Vehicle Routes
 * Gestión de vehículos
 */

// Create vehicle
router.post(
  '/',
  asyncHandler((req, res) => vehicleController.createVehicle(req, res))
);

// Get all vehicles
router.get(
  '/',
  asyncHandler((req, res) => vehicleController.getVehicles(req, res))
);

// Get vehicle by ID
router.get(
  '/:vehicleId',
  asyncHandler((req, res) => vehicleController.getVehicleById(req, res))
);

// Get vehicle drivers
router.get(
  '/:vehicleId/drivers',
  asyncHandler((req, res) => vehicleController.getVehicleDrivers(req, res))
);

// Update vehicle
router.put(
  '/:vehicleId',
  asyncHandler((req, res) => vehicleController.updateVehicle(req, res))
);

// Update RTO expiration
router.patch(
  '/:vehicleId/rto',
  asyncHandler((req, res) => vehicleController.updateRTOExpiration(req, res))
);

// Delete vehicle
router.delete(
  '/:vehicleId',
  asyncHandler((req, res) => vehicleController.deleteVehicle(req, res))
);

export default router;
