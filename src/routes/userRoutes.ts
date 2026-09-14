import { Router } from 'express';
import UserController from '../controllers/userController';
import { asyncHandler } from '../middleware/asyncHandler';

const router: Router = Router();
const userController = new UserController();

/**
 * User Routes
 * Autenticación y gestión de usuarios
 */

// Create user
router.post(
  '/',
  asyncHandler((req, res) => userController.createUser(req, res))
);

// Get all users
router.get(
  '/',
  asyncHandler((req, res) => userController.getUsers(req, res))
);

// Get user by ID
router.get(
  '/:userId',
  asyncHandler((req, res) => userController.getUserById(req, res))
);

// Update user
router.put(
  '/:userId',
  asyncHandler((req, res) => userController.updateUser(req, res))
);

// Delete user
router.delete(
  '/:userId',
  asyncHandler((req, res) => userController.deleteUser(req, res))
);

// Change password
router.patch(
  '/:userId/change-password',
  asyncHandler((req, res) => userController.changePassword(req, res))
);

export default router;
