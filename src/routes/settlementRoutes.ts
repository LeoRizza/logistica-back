/**
 * Settlement Routes
 * Rutas para el módulo de liquidaciones
 */

import { Router } from 'express';
import settlementController from '../controllers/settlementController';
import asyncHandler from '../middleware/asyncHandler';

const router = Router();

/**
 * GET /settlements/calculate
 * Calcula una liquidación basada en chofer y rango de fechas
 * Query params: driver_id, start_date, end_date
 */
router.get('/calculate', asyncHandler((req, res) => settlementController.calculateSettlement(req, res)));

/**
 * GET /settlements/driver/:driver_id
 * Obtiene todas las liquidaciones de un chofer específico
 */
router.get(
  '/driver/:driver_id',
  asyncHandler((req, res) => settlementController.getSettlementsByDriver(req, res))
);

/**
 * POST /settlements
 * Crea una nueva liquidación
 */
router.post('/', asyncHandler((req, res) => settlementController.createSettlement(req, res)));

/**
 * GET /settlements/:id
 * Obtiene una liquidación por ID
 */
router.get('/:id', asyncHandler((req, res) => settlementController.getSettlement(req, res)));

/**
 * PUT /settlements/:id
 * Actualiza una liquidación
 */
router.put('/:id', asyncHandler((req, res) => settlementController.updateSettlement(req, res)));

/**
 * PATCH /settlements/:id/mark-paid
 * Marca una liquidación como pagada
 */
router.patch(
  '/:id/mark-paid',
  asyncHandler((req, res) => settlementController.markAsPaid(req, res))
);

/**
 * DELETE /settlements/:id
 * Elimina una liquidación
 */
router.delete('/:id', asyncHandler((req, res) => settlementController.deleteSettlement(req, res)));

/**
 * GET /settlements
 * Obtiene todas las liquidaciones
 */
router.get('/', asyncHandler((req, res) => settlementController.getAllSettlements(req, res)));

export default router;
