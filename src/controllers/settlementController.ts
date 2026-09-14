/**
 * Settlement Controller
 * Controlador para manejar las peticiones de liquidaciones
 */

import { Response } from 'express';
import { BaseController } from './baseController';
import { AuthenticatedRequest, ApiResponse } from '../types/index';
import settlementService from '../services/settlementService';
import {
  SettlementCalculationInput,
  SettlementData,
  CreateSettlementInput,
  UpdateSettlementInput,
} from '../types/settlement';

class SettlementController extends BaseController {
  /**
   * Calcula una liquidación basada en los parámetros de entrada
   * GET /settlements/calculate
   */
  async calculateSettlement(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { driver_id, start_date, end_date } = req.query;

      // Validar parámetros
      if (!driver_id || typeof driver_id !== 'string') {
        this.sendError(res, 'driver_id is required and must be a string', 400, undefined, req);
        return;
      }

      if (!start_date || typeof start_date !== 'string') {
        this.sendError(res, 'start_date is required and must be a string (YYYY-MM-DD)', 400, undefined, req);
        return;
      }

      if (!end_date || typeof end_date !== 'string') {
        this.sendError(res, 'end_date is required and must be a string (YYYY-MM-DD)', 400, undefined, req);
        return;
      }

      // Validar formato de fechas
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
        this.sendError(res, 'Dates must be in YYYY-MM-DD format', 400, undefined, req);
        return;
      }

      const input: SettlementCalculationInput = {
        driver_id,
        start_date,
        end_date,
      };

      const settlementData = await settlementService.calculateSettlement(input);

      this.sendSuccess(res, settlementData, 'Settlement calculated successfully', 200, req);
    } catch (error: any) {
      this.sendError(res, error.message || 'Error calculating settlement', 400, undefined, req);
    }
  }

  /**
   * Crea una nueva liquidación
   * POST /settlements
   */
  async createSettlement(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        driver_id,
        driver_name,
        start_date,
        end_date,
        total_amount_earned,
        total_per_diems_delivered,
        total_unforesee_expenses,
        total_to_pay,
        total_deductions,
        extra_discounts,
        bonifications,
        payment_method,
        notes,
      } = req.body;

      // Validar campos requeridos
      const requiredFields = [
        'driver_id',
        'driver_name',
        'start_date',
        'end_date',
        'total_amount_earned',
        'total_per_diems_delivered',
        'total_unforesee_expenses',
        'total_to_pay',
        'total_deductions',
        'extra_discounts',
        'bonifications',
      ];

      for (const field of requiredFields) {
        if (!(field in req.body)) {
          this.sendError(res, `Missing required field: ${field}`, 400, undefined, req);
          return;
        }
      }

      const input: CreateSettlementInput = {
        driver_id,
        driver_name,
        start_date,
        end_date,
        trips: [],
        total_amount_earned,
        total_per_diems_delivered,
        total_unforesee_expenses,
        total_to_pay,
        total_deductions,
        extra_discounts: extra_discounts || 0,
        bonifications: bonifications || 0,
        payment_method,
        notes,
      };

      const userId = req.user?.id || 'system';
      const settlement = await settlementService.createSettlement(input, userId);

      this.sendSuccess(res, settlement, 'Settlement created successfully', 201, req);
    } catch (error: any) {
      this.sendError(res, error.message || 'Error creating settlement', 400, undefined, req);
    }
  }

  /**
   * Obtiene una liquidación por ID
   * GET /settlements/:id
   */
  async getSettlement(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const settlement = await settlementService.getSettlementById(id);

      this.sendSuccess(res, settlement, 'Settlement retrieved successfully', 200, req);
    } catch (error: any) {
      this.sendError(res, error.message || 'Error retrieving settlement', 400, undefined, req);
    }
  }

  /**
   * Obtiene liquidaciones de un chofer
   * GET /settlements/driver/:driver_id
   */
  async getSettlementsByDriver(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { driver_id } = req.params;
      const { limit = '10', offset = '0' } = req.query;

      const settlements = await settlementService.getSettlementsByDriver(
        driver_id,
        parseInt(limit as string),
        parseInt(offset as string)
      );

      this.sendSuccess(res, settlements, 'Settlements retrieved successfully', 200, req);
    } catch (error: any) {
      this.sendError(res, error.message || 'Error retrieving settlements', 400, undefined, req);
    }
  }

  /**
   * Obtiene todas las liquidaciones
   * GET /settlements
   */
  async getAllSettlements(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { limit = '10', offset = '0' } = req.query;

      const settlements = await settlementService.getAllSettlements(
        parseInt(limit as string),
        parseInt(offset as string)
      );

      this.sendSuccess(res, settlements, 'Settlements retrieved successfully', 200, req);
    } catch (error: any) {
      this.sendError(res, error.message || 'Error retrieving settlements', 400, undefined, req);
    }
  }

  /**
   * Actualiza una liquidación
   * PUT /settlements/:id
   */
  async updateSettlement(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        extra_discounts,
        bonifications,
        payment_method,
        notes,
        is_paid,
        payment_date,
      } = req.body;

      const input: UpdateSettlementInput = {
        extra_discounts,
        bonifications,
        payment_method,
        notes,
        is_paid,
        payment_date: payment_date ? new Date(payment_date) : undefined,
      };

      const settlement = await settlementService.updateSettlement(id, input);

      this.sendSuccess(res, settlement, 'Settlement updated successfully', 200, req);
    } catch (error: any) {
      this.sendError(res, error.message || 'Error updating settlement', 400, undefined, req);
    }
  }

  /**
   * Marca una liquidación como pagada
   * PATCH /settlements/:id/mark-paid
   */
  async markAsPaid(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const settlement = await settlementService.markAsPaid(id);

      this.sendSuccess(res, settlement, 'Settlement marked as paid', 200, req);
    } catch (error: any) {
      this.sendError(res, error.message || 'Error marking settlement as paid', 400, undefined, req);
    }
  }

  /**
   * Elimina una liquidación
   * DELETE /settlements/:id
   */
  async deleteSettlement(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await settlementService.deleteSettlement(id);

      this.sendSuccess(res, null, 'Settlement deleted successfully', 200, req);
    } catch (error: any) {
      this.sendError(res, error.message || 'Error deleting settlement', 400, undefined, req);
    }
  }
}

export default new SettlementController();
