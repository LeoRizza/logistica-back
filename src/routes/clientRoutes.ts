import { Router } from 'express';
import ClientController from '../controllers/clientController';
import { asyncHandler } from '../middleware/asyncHandler';

const router: Router = Router();
const clientController = new ClientController();

/**
 * Client Routes
 * Gestión de clientes
 */

// Create client
router.post(
  '/',
  asyncHandler((req, res) => clientController.createClient(req, res))
);

// Get all clients
router.get(
  '/',
  asyncHandler((req, res) => clientController.getClients(req, res))
);

// Search clients
router.get(
  '/search',
  asyncHandler((req, res) => clientController.searchClients(req, res))
);

// Get client by ID
router.get(
  '/:id',
  asyncHandler((req, res) => clientController.getClientById(req, res))
);

// Update client
router.put(
  '/:id',
  asyncHandler((req, res) => clientController.updateClient(req, res))
);

// Delete client
router.delete(
  '/:id',
  asyncHandler((req, res) => clientController.deleteClient(req, res))
);

export default router;
