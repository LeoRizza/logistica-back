import { Router } from 'express';
import DriverController from '../controllers/driverController';
import { asyncHandler } from '../middleware/asyncHandler';

const router: Router = Router();
const driverController = new DriverController();

/**
 * Driver Routes
 * Gestión de conductores
 */

// Create driver
router.post(
  '/',
  asyncHandler((req, res) => driverController.createDriver(req, res))
);

// Get all drivers
router.get(
  '/',
  asyncHandler((req, res) => driverController.getDrivers(req, res))
);

// Get driver by ID
router.get(
  '/:driverId',
  asyncHandler((req, res) => driverController.getDriverById(req, res))
);

// Get driver vehicles
router.get(
  '/:driverId/vehicles',
  asyncHandler((req, res) => driverController.getDriverVehicles(req, res))
);

// Assign vehicle to driver
router.post(
  '/:driverId/vehicles/:vehicleId',
  asyncHandler((req, res) => driverController.assignVehicle(req, res))
);

// Remove vehicle from driver
router.delete(
  '/:driverId/vehicles/:vehicleId',
  asyncHandler((req, res) => driverController.removeVehicle(req, res))
);

// Update driver
router.put(
  '/:driverId',
  asyncHandler((req, res) => driverController.updateDriver(req, res))
);

// Delete driver
router.delete(
  '/:driverId',
  asyncHandler((req, res) => driverController.deleteDriver(req, res))
);

export default router;
