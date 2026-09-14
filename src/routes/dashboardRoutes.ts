import { Router } from 'express';
import DashboardController from '../controllers/dashboardController';
import { asyncHandler } from '../middleware/asyncHandler';

const router: Router = Router();
const dashboardController = new DashboardController();

/**
 * Dashboard Routes
 * Reportes gerenciales y análisis financiero
 */

/**
 * GET /api/v1/dashboard/pnl
 * Obtiene el reporte de Estado de Resultados (Profit and Loss)
 * Query params: startDate, endDate (ISO 8601)
 */
router.get(
  '/pnl',
  asyncHandler((req, res) => dashboardController.getProfitAndLoss(req, res))
);

export default router;
