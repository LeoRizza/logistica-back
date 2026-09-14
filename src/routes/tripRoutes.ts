import { Router } from 'express';
import TripController from '../controllers/tripController';
import { asyncHandler } from '../middleware/asyncHandler';

const router: Router = Router();
const tripController = new TripController();

/**
 * Trip Routes
 * Gestión de viajes y liquidaciones
 */

// Create trip
router.post(
  '/',
  asyncHandler((req, res) => tripController.createTrip(req, res))
);

// Get all trips
router.get(
  '/',
  asyncHandler((req, res) => tripController.getTrips(req, res))
);

// Get trip by ID
router.get(
  '/:tripId',
  asyncHandler((req, res) => tripController.getTripById(req, res))
);

// Get settlement preview for driver
router.get(
  '/:driverId/settlement',
  asyncHandler((req, res) => tripController.getSettlementPreview(req, res))
);

// Get trips by driver
router.get(
  '/driver/:driverId',
  asyncHandler((req, res) => tripController.getTripsByDriver(req, res))
);

// Get trips by vehicle
router.get(
  '/vehicle/:vehicleId',
  asyncHandler((req, res) => tripController.getTripsByVehicle(req, res))
);

// Update trip
router.put(
  '/:tripId',
  asyncHandler((req, res) => tripController.updateTrip(req, res))
);

// Update trip status
router.patch(
  '/:tripId/status',
  asyncHandler((req, res) => tripController.updateTripStatus(req, res))
);

// Delete trip
router.delete(
  '/:tripId',
  asyncHandler((req, res) => tripController.deleteTrip(req, res))
);

export default router;
