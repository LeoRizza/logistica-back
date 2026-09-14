import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index';
import { BaseController } from './baseController';
import VehicleService from '../services/vehicleService';

/**
 * VehicleController
 * Maneja las operaciones CRUD de vehículos con Prisma
 * Todos los métodos interactúan con la base de datos a través del VehicleService
 */
export class VehicleController extends BaseController {
  private vehicleService = new VehicleService();

  /**
   * POST /api/vehicles
   * Crear un nuevo vehículo
   * ✅ REGLA CRÍTICA: Extrae el userId del token JWT e inyecta en created_by_id
   */
  async createVehicle(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        this.sendError(res, 'User not authenticated', 401, undefined, req);
        return;
      }

      const {
        plate,
        vehicle_type,
        brand,
        model,
        year,
        capacity_tons,
        capacity_m3,
        is_owned,
        truck_rto_exp_date,
        trailer_plate,
        trailer_rto_exp_date,
        truck_insurance_exp_date,
        trailer_insurance_exp_date,
        registration_number,
      } = req.body;

      // Validación básica de campos requeridos
      if (!plate || !vehicle_type) {
        this.sendError(
          res,
          'Missing required fields: plate and vehicle_type',
          400,
          { plate: ['Required'], vehicle_type: ['Required'] },
          req
        );
        return;
      }

      const result = await this.vehicleService.createVehicle({
        plate,
        vehicle_type,
        brand,
        model,
        year,
        capacity_tons,
        capacity_m3,
        is_owned,
        truck_rto_exp_date: truck_rto_exp_date
          ? new Date(truck_rto_exp_date)
          : undefined,
        trailer_plate,
        trailer_rto_exp_date: trailer_rto_exp_date
          ? new Date(trailer_rto_exp_date)
          : undefined,
        truck_insurance_exp_date: truck_insurance_exp_date
          ? new Date(truck_insurance_exp_date)
          : undefined,
        trailer_insurance_exp_date: trailer_insurance_exp_date
          ? new Date(trailer_insurance_exp_date)
          : undefined,
        registration_number,
        created_by_id: userId, // ✅ Inyectado desde req.user?.id
      });

      if (!result.success) {
        this.sendError(res, result.message, 400, undefined, req);
        return;
      }

      this.sendSuccess(res, result.data, result.message, 201, req);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error creating vehicle';
      this.sendError(res, message, 500, undefined, req);
    }
  }

  /**
   * GET /api/vehicles
   * Obtener lista paginada de vehículos activos
   * Query params: page=1 (default), limit=10 (default)
   * ✅ CRUD Real: Consulta directa a Prisma a través del VehicleService
   */
  async getVehicles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page, limit } = this.getPaginationParams(req);

      const result = await this.vehicleService.getVehicles(page, limit);

      if (!result.success) {
        this.sendError(res, result.message, 400, undefined, req);
        return;
      }

      const { vehicles, total } = result.data as any;
      this.sendPaginatedSuccess(
        res,
        vehicles,
        total,
        page,
        limit,
        result.message,
        200,
        req
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error retrieving vehicles';
      this.sendError(res, message, 500, undefined, req);
    }
  }

  /**
   * GET /api/vehicles/:id
   * Obtener un vehículo por ID con sus drivers asociados y últimos viajes
   */
  async getVehicleById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { vehicleId: id } = req.params;

      if (!id) {
        this.sendError(res, 'Vehicle ID is required', 400, undefined, req);
        return;
      }

      const result = await this.vehicleService.getVehicleById(id);

      if (!result.success) {
        this.sendError(res, result.message, 404, undefined, req);
        return;
      }

      this.sendSuccess(res, result.data, result.message, 200, req);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error retrieving vehicle';
      this.sendError(res, message, 500, undefined, req);
    }
  }

  /**
   * PUT /api/vehicles/:id
   * Actualizar un vehículo existente
   */
  async updateVehicle(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { vehicleId: id } = req.params;

      if (!id) {
        this.sendError(res, 'Vehicle ID is required', 400, undefined, req);
        return;
      }

      const {
        plate,
        vehicle_type,
        brand,
        model,
        year,
        capacity_tons,
        capacity_m3,
        is_owned,
        is_active,
        truck_rto_exp_date,
        trailer_plate,
        trailer_rto_exp_date,
        truck_insurance_exp_date,
        trailer_insurance_exp_date,
        registration_number,
      } = req.body;

      // Helper para parsear y validar fechas
      const parseDate = (dateStr: string | undefined): { date: Date | undefined; error: string | null } => {
        if (!dateStr) return { date: undefined, error: null };
        if (typeof dateStr !== 'string' || dateStr.trim() === '') return { date: undefined, error: null };
        
        const parsedDate = new Date(dateStr);
        if (isNaN(parsedDate.getTime())) {
          return { date: undefined, error: 'Invalid date format. Use YYYY-MM-DD format.' };
        }
        return { date: parsedDate, error: null };
      };

      // Validar y parsear todas las fechas
      const validationErrors: Record<string, string[]> = {};
      
      const { date: parsedTruckRtoDate, error: truckRtoError } = parseDate(truck_rto_exp_date);
      if (truckRtoError) validationErrors.truck_rto_exp_date = [truckRtoError];
      
      const { date: parsedTrailerRtoDate, error: trailerRtoError } = parseDate(trailer_rto_exp_date);
      if (trailerRtoError) validationErrors.trailer_rto_exp_date = [trailerRtoError];
      
      const { date: parsedTruckInsuranceDate, error: truckInsuranceError } = parseDate(truck_insurance_exp_date);
      if (truckInsuranceError) validationErrors.truck_insurance_exp_date = [truckInsuranceError];
      
      const { date: parsedTrailerInsuranceDate, error: trailerInsuranceError } = parseDate(trailer_insurance_exp_date);
      if (trailerInsuranceError) validationErrors.trailer_insurance_exp_date = [trailerInsuranceError];

      // Si hay errores de validacion, retornar
      if (Object.keys(validationErrors).length > 0) {
        this.sendError(res, 'Validation failed', 400, validationErrors, req);
        return;
      }

      const result = await this.vehicleService.updateVehicle(id, {
        plate,
        vehicle_type,
        brand,
        model,
        year,
        capacity_tons,
        capacity_m3,
        is_owned,
        is_active,
        truck_rto_exp_date: parsedTruckRtoDate,
        trailer_plate,
        trailer_rto_exp_date: parsedTrailerRtoDate,
        truck_insurance_exp_date: parsedTruckInsuranceDate,
        trailer_insurance_exp_date: parsedTrailerInsuranceDate,
        registration_number,
      });

      if (!result.success) {
        this.sendError(res, result.message, 400, undefined, req);
        return;
      }

      this.sendSuccess(res, result.data, result.message, 200, req);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error updating vehicle';
      this.sendError(res, message, 500, undefined, req);
    }
  }

  /**
   * DELETE /api/vehicles/:id
   * Eliminar (soft-delete) un vehículo
   */
  async deleteVehicle(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { vehicleId: id } = req.params;

      if (!id) {
        this.sendError(res, 'Vehicle ID is required', 400, undefined, req);
        return;
      }

      const result = await this.vehicleService.deleteVehicle(id);

      if (!result.success) {
        this.sendError(res, result.message, 404, undefined, req);
        return;
      }

      this.sendSuccess(res, result.data, result.message, 200, req);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error deleting vehicle';
      this.sendError(res, message, 500, undefined, req);
    }
  }

  /**
   * GET /api/vehicles/:id/drivers
   * Obtener todos los drivers asignados a un vehículo
   */
  async getVehicleDrivers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { vehicleId: id } = req.params;

      if (!id) {
        this.sendError(res, 'Vehicle ID is required', 400, undefined, req);
        return;
      }

      const result = await this.vehicleService.getVehicleDrivers(id);

      if (!result.success) {
        this.sendError(res, result.message, 404, undefined, req);
        return;
      }

      this.sendSuccess(res, result.data, result.message, 200, req);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error retrieving vehicle drivers';
      this.sendError(res, message, 500, undefined, req);
    }
  }

  /**
   * PATCH /api/vehicles/:id/rto-expiration
   * Actualizar la fecha de vencimiento del RTO de un vehículo
   */
  async updateRTOExpiration(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { vehicleId: id } = req.params;
      const { truck_rto_exp_date } = req.body;

      if (!id) {
        this.sendError(res, 'Vehicle ID is required', 400, undefined, req);
        return;
      }

      if (!truck_rto_exp_date) {
        this.sendError(
          res,
          'truck_rto_exp_date is required',
          400,
          { truck_rto_exp_date: ['This field is required'] },
          req
        );
        return;
      }

      const result = await this.vehicleService.updateRTOExpiration(
        id,
        new Date(truck_rto_exp_date)
      );

      if (!result.success) {
        this.sendError(res, result.message, 400, undefined, req);
        return;
      }

      this.sendSuccess(res, result.data, result.message, 200, req);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error updating RTO expiration';
      this.sendError(res, message, 500, undefined, req);
    }
  }
}

export default VehicleController;
