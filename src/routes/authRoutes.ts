import { Router } from 'express';
import UserController from '../controllers/userController';
import { asyncHandler } from '../middleware/asyncHandler';

const router: Router = Router();
const userController = new UserController();

/**
 * Auth Routes
 * Autenticación de usuarios
 */

// Login
router.post(
  '/login',
  asyncHandler((req, res) => userController.login(req, res))
);

export default router;
