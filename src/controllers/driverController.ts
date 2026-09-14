import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index';
import { BaseController } from './baseController';
import { DriverService } from '../services/driverService';

/**
 * DriverController
 * Maneja las operaciones relacionadas con conductores
 */
export class DriverController extends BaseController {
  private driverService: DriverService;

  constructor() {
    super();
    this.driverService = new DriverService();
  }
  async createDriver(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { full_name, license_number, license_exp_date, type, phone, cuit_cuil } = req.body;

      // Validar campos requeridos
      if (!full_name || !license_number || !license_exp_date) {
        this.sendError(
          res,
          'Missing required fields: full_name, license_number, license_exp_date',
          400,
          undefined,
          req
        );
        return;
      }

      // Validar que el usuario autenticado exista
      const userId = req.user?.id;
      if (!userId) {
        this.sendError(res, 'User not authenticated', 401, undefined, req);
        return;
      }

      const result = await this.driverService.createDriver({
        full_name: full_name.trim(),
        license_number: license_number.trim(),
        license_exp_date,
        type,
        phone: phone?.trim(),
        cuit_cuil: cuit_cuil?.trim(),
        user_id: userId,
      });

      if (result.success && result.data) {
        this.sendSuccess(res, result.data, result.message, 201, req);
      } else {
        this.sendError(res, result.message || 'Failed to create driver', 400, undefined, req);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      this.sendError(res, `Error creating driver: ${message}`, 500, undefined, req);
    }
  }

  async getDrivers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page, limit } = this.getPaginationParams(req);
      const result = await this.driverService.getDrivers(page, limit);

      if (result.success && result.data) {
        const { data, total, page: currentPage, limit: currentLimit, totalPages } = result.data;
        this.sendPaginatedSuccess(res, data, total, currentPage, currentLimit, result.message, 200, req);
      } else {
        this.sendError(res, result.message || 'Failed to retrieve drivers', 500, undefined, req);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      this.sendError(res, `Error retrieving drivers: ${message}`, 500, undefined, req);
    }
  }

  async getDriverById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id || req.params.driverId || req.params.driver_id;

      if (!id) {
        this.sendError(res, 'Driver ID is required', 400, undefined, req);
        return;
      }

      const result = await this.driverService.getDriverById(id);

      if (result.success && result.data) {
        this.sendSuccess(res, result.data, result.message, 200, req);
      } else {
        this.sendError(res, result.message || 'Driver not found', 404, undefined, req);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      this.sendError(res, `Error retrieving driver: ${message}`, 500, undefined, req);
    }
  }

  async updateDriver(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id || req.params.driverId || req.params.driver_id;
      const updateData = req.body;

      if (!id) {
        this.sendError(res, 'Driver ID is required', 400, undefined, req);
        return;
      }

      if (Object.keys(updateData).length === 0) {
        this.sendError(res, 'No fields to update', 400, undefined, req);
        return;
      }

      const result = await this.driverService.updateDriver(id, updateData);

      if (result.success && result.data) {
        this.sendSuccess(res, result.data, result.message, 200, req);
      } else {
        this.sendError(res, result.message || 'Failed to update driver', 400, undefined, req);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      this.sendError(res, `Error updating driver: ${message}`, 500, undefined, req);
    }
  }

  async deleteDriver(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id || req.params.driverId || req.params.driver_id;

      if (!id) {
        this.sendError(res, 'Driver ID is required', 400, undefined, req);
        return;
      }

      const result = await this.driverService.deleteDriver(id);

      if (result.success && result.data) {
        this.sendSuccess(res, result.data, result.message, 200, req);
      } else {
        this.sendError(res, result.message || 'Failed to delete driver', 400, undefined, req);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      this.sendError(res, `Error deleting driver: ${message}`, 500, undefined, req);
    }
  }

  async assignVehicle(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { driverId } = req.params;
      const { vehicleId } = req.body;

      if (!driverId || !vehicleId) {
        this.sendError(res, 'Missing required fields: driverId, vehicleId', 400, undefined, req);
        return;
      }

      const result = await this.driverService.assignVehicle(driverId, vehicleId);

      if (result.success && result.data) {
        this.sendSuccess(res, result.data, result.message, 201, req);
      } else {
        this.sendError(res, result.message || 'Failed to assign vehicle', 400, undefined, req);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      this.sendError(res, `Error assigning vehicle: ${message}`, 500, undefined, req);
    }
  }

  async getDriverVehicles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { driverId } = req.params;

      if (!driverId) {
        this.sendError(res, 'Driver ID is required', 400, undefined, req);
        return;
      }

      const result = await this.driverService.getDriverVehicles(driverId);

      if (result.success && result.data) {
        this.sendSuccess(res, result.data, result.message, 200, req);
      } else {
        this.sendError(res, result.message || 'Failed to retrieve driver vehicles', 400, undefined, req);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      this.sendError(res, `Error retrieving driver vehicles: ${message}`, 500, undefined, req);
    }
  }

  async removeVehicle(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { driverId, vehicleId } = req.params;

      if (!driverId || !vehicleId) {
        this.sendError(res, 'Missing required parameters: driverId, vehicleId', 400, undefined, req);
        return;
      }

      const result = await this.driverService.removeVehicle(driverId, vehicleId);

      if (result.success && result.data) {
        this.sendSuccess(res, result.data, result.message, 200, req);
      } else {
        this.sendError(res, result.message || 'Failed to remove vehicle', 400, undefined, req);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      this.sendError(res, `Error removing vehicle: ${message}`, 500, undefined, req);
    }
  }
}

export default DriverController;

