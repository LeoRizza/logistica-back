import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index';
import { BaseController } from './baseController';
import DashboardService from '../services/dashboardService';

/**
 * DashboardController
 * Maneja operaciones HTTP para reportes gerenciales y análisis financiero
 */
export class DashboardController extends BaseController {
  private dashboardService: DashboardService;

  constructor() {
    super();
    this.dashboardService = new DashboardService();
  }

  /**
   * GET /api/v1/dashboard/pnl
   * Obtiene el reporte de Estado de Resultados (Profit and Loss)
   * Query params: startDate (ISO 8601), endDate (ISO 8601)
   */
  async getProfitAndLoss(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        this.sendError(res, 'Unauthorized: User not authenticated', 401, undefined, req);
        return;
      }

      const { startDate, endDate } = req.query;

      // Validar que las fechas están presentes
      if (!startDate || typeof startDate !== 'string') {
        this.sendError(res, 'Start date is required and must be a valid date string', 400, undefined, req);
        return;
      }

      if (!endDate || typeof endDate !== 'string') {
        this.sendError(res, 'End date is required and must be a valid date string', 400, undefined, req);
        return;
      }

      // Validar formato de fechas
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        this.sendError(res, 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)', 400, undefined, req);
        return;
      }

      // Estirar el endDate hasta el final del día (23:59:59.999)
      endDateObj.setUTCHours(23, 59, 59, 999);

      // Validar que startDate no sea estrictamente mayor que endDate
      if (startDateObj > endDateObj) {
        this.sendError(res, 'Start date must be before or equal to end date', 400, undefined, req);
        return;
      }

      // Llamar al servicio
      const result = await this.dashboardService.getProfitAndLossReport(startDateObj, endDateObj);

      if (!result.success) {
        this.sendError(res, result.message, 400, undefined, req);
        return;
      }

      this.sendSuccess(res, result.data, 'Profit and Loss report retrieved successfully', 200, req);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.sendError(res, `Failed to retrieve P&L report: ${errorMessage}`, 500, undefined, req);
    }
  }
}

export default DashboardController;
