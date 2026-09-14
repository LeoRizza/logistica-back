import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index';
import { BaseController } from './baseController';
import TripService from '../services/tripService';

/**
 * TripController
 * Maneja las operaciones relacionadas con viajes
 */
export class TripController extends BaseController {
  private tripService = new TripService();

  async createTrip(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        this.sendError(res, 'User not authenticated', 401, undefined, req);
        return;
      }

      // Validación inicial de campos requeridos del frontend
      const {
        bill_of_lading,
        amount_to_pay,
        date,
        estimated_km,
        origin,
        destination,
        driver_id,
        vehicle_id,
        client_id,
        km_start,
        km_end,
        per_diems_delivered,
        unforesee_expenses,
        load_description,
        load_weight_tons,
        load_volume_m3,
        loaded_weight_kg,
        net_weight_kg,
        rate_per_kg,
        invoice_number,
        status,
        notes,
      } = req.body;

      // Validar campos requeridos
      const validationErrors: Record<string, string[]> = {};
      
      if (!bill_of_lading || typeof bill_of_lading !== 'string' || bill_of_lading.trim() === '') {
        validationErrors.bill_of_lading = ['Bill of lading is required'];
      }
      if (amount_to_pay === undefined || amount_to_pay === null || typeof amount_to_pay !== 'number' || amount_to_pay < 0) {
        validationErrors.amount_to_pay = ['Amount to pay is required and must be a positive number'];
      }
      if (!date || typeof date !== 'string') {
        validationErrors.date = ['Date is required and must be a valid ISO string'];
      } else {
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          validationErrors.date = ['Date must be a valid ISO format (YYYY-MM-DD)'];
        }
      }
      if (estimated_km === undefined || estimated_km === null || typeof estimated_km !== 'number' || estimated_km < 0) {
        validationErrors.estimated_km = ['Estimated km is required and must be a positive number'];
      }
      if (!driver_id || typeof driver_id !== 'string' || driver_id.trim() === '') {
        validationErrors.driver_id = ['Driver ID is required'];
      }
      if (!vehicle_id || typeof vehicle_id !== 'string' || vehicle_id.trim() === '') {
        validationErrors.vehicle_id = ['Vehicle ID is required'];
      }

      if (Object.keys(validationErrors).length > 0) {
        this.sendError(res, 'Validation failed', 400, validationErrors, req);
        return;
      }

      // Mapeo de datos del frontend al formato de Prisma
      // bill_of_lading -> reference_number, amount_to_pay -> estimated_cost, date -> scheduled_date
      const reference_number = bill_of_lading!.trim();
      const estimated_cost = amount_to_pay!;
      const scheduled_date = new Date(date!);
      const distance_km = estimated_km!;

      // Parsear campos numéricos opcionales
      const parsedLoadedWeightKg = typeof loaded_weight_kg === 'string' ? parseFloat(loaded_weight_kg) : loaded_weight_kg;
      const parsedNetWeightKg = typeof net_weight_kg === 'string' ? parseFloat(net_weight_kg) : net_weight_kg;
      const parsedRatePerKg = typeof rate_per_kg === 'string' ? parseFloat(rate_per_kg) : rate_per_kg;

      const createTripPayload: any = {
        reference_number,
        origin,
        destination,
        driver_id,
        vehicle_id,
        scheduled_date,
        distance_km,
        km_start,
        km_end,
        estimated_cost,
        per_diems_delivered,
        load_description,
        load_weight_tons,
        load_volume_m3,
        loaded_weight_kg: parsedLoadedWeightKg,
        net_weight_kg: parsedNetWeightKg,
        rate_per_kg: parsedRatePerKg,
        invoice_number,
        status: status || 'PENDING',
        notes,
        unforesee_expenses,
        created_by_id: userId,
      };

      if (client_id) {
        createTripPayload.client_id = client_id;
      }

      const result = await this.tripService.createTrip(createTripPayload);

      if (!result.success) {
        this.sendError(res, result.message, 400, undefined, req);
        return;
      }

      this.sendSuccess(res, result.data, result.message, 201, req);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error creating trip';
      this.sendError(res, message, 500, undefined, req);
    }
  }

  async getTrips(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page, limit } = this.getPaginationParams(req);

      const result = await this.tripService.getTrips(page, limit);

      if (!result.success) {
        this.sendError(res, result.message, 400, undefined, req);
        return;
      }

      const { trips, total } = result.data as any;
      
      // Transformar tripExpenses a unforesee_expenses para el frontend
      const transformedTrips = trips.map((trip: any) => ({
        ...trip,
        unforesee_expenses: trip.tripExpenses?.map((expense: any) => ({
          id: expense.id,
          detail: expense.description,
          amount: expense.amount,
        })) || [],
        tripExpenses: undefined, // Remover la propiedad original
      }));

      this.sendPaginatedSuccess(res, transformedTrips, total, page, limit, result.message, 200, req);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error retrieving trips';
      this.sendError(res, message, 500, undefined, req);
    }
  }

  async getTripById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await this.tripService.getTripById(id);

      if (!result.success) {
        this.sendError(res, result.message, 404, undefined, req);
        return;
      }

      // Transformar tripExpenses a unforesee_expenses para el frontend
      const trip = result.data as any;
      const transformedTrip = {
        ...trip,
        unforesee_expenses: trip.tripExpenses?.map((expense: any) => ({
          id: expense.id,
          detail: expense.description,
          amount: expense.amount,
        })) || [],
        tripExpenses: undefined, // Remover la propiedad original
      };

      this.sendSuccess(res, transformedTrip, result.message, 200, req);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error retrieving trip';
      this.sendError(res, message, 500, undefined, req);
    }
  }

  async updateTrip(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Extracción segura del ID con múltiples variantes posibles
      const id = req.params.id || req.params.tripId || req.params.trip_id;
      if (!id) {
        this.sendError(
          res,
          'Trip ID is required',
          400,
          { id: ['Trip ID is required'] },
          req
        );
        return;
      }

      // Extracción de campos del frontend
      const {
        amount_to_pay,
        date,
        estimated_km,
        origin,
        destination,
        driver_id,
        vehicle_id,
        client_id,
        km_start,
        km_end,
        per_diems_delivered,
        unforesee_expenses,
        load_description,
        load_weight_tons,
        load_volume_m3,
        loaded_weight_kg,
        net_weight_kg,
        rate_per_kg,
        invoice_number,
        notes,
        status,
      } = req.body;

      // Mapeo de datos del frontend al formato de Prisma
      // amount_to_pay -> estimated_cost, date -> scheduled_date, estimated_km -> distance_km
      // Nota: reference_number NO puede ser actualizado (es inmutable en el servicio)
      const estimated_cost = amount_to_pay;
      const scheduled_date = date ? new Date(date) : undefined;
      const distance_km = estimated_km;

      // Parsear campos numéricos opcionales
      const parsedLoadedWeightKg = typeof loaded_weight_kg === 'string' ? parseFloat(loaded_weight_kg) : loaded_weight_kg;
      const parsedNetWeightKg = typeof net_weight_kg === 'string' ? parseFloat(net_weight_kg) : net_weight_kg;
      const parsedRatePerKg = typeof rate_per_kg === 'string' ? parseFloat(rate_per_kg) : rate_per_kg;

      const updatePayload: any = {
        origin,
        destination,
        driver_id,
        vehicle_id,
        scheduled_date,
        distance_km,
        km_start,
        km_end,
        estimated_cost,
        per_diems_delivered,
        load_description,
        load_weight_tons,
        load_volume_m3,
        loaded_weight_kg: parsedLoadedWeightKg,
        net_weight_kg: parsedNetWeightKg,
        rate_per_kg: parsedRatePerKg,
        invoice_number,
        notes,
        unforesee_expenses,
        status,
      };

      if (client_id !== undefined) {
        updatePayload.client_id = client_id;
      }

      const result = await this.tripService.updateTrip(id, updatePayload);

      if (!result.success) {
        this.sendError(res, result.message, 400, undefined, req);
        return;
      }

      // Transformar tripExpenses a unforesee_expenses para el frontend
      const trip = result.data as any;
      const transformedTrip = {
        ...trip,
        unforesee_expenses: trip.tripExpenses?.map((expense: any) => ({
          id: expense.id,
          detail: expense.description,
          amount: expense.amount,
        })) || [],
        tripExpenses: undefined, // Remover la propiedad original
      };

      this.sendSuccess(res, transformedTrip, result.message, 200, req);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error updating trip';
      this.sendError(res, message, 500, undefined, req);
    }
  }

  async deleteTrip(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await this.tripService.deleteTrip(id);

      if (!result.success) {
        this.sendError(res, result.message, 404, undefined, req);
        return;
      }

      this.sendSuccess(res, result.data, result.message, 200, req);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error deleting trip';
      this.sendError(res, message, 500, undefined, req);
    }
  }

  async updateTripStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const result = await this.tripService.updateTripStatus(id, status);

      if (!result.success) {
        this.sendError(res, result.message, 400, undefined, req);
        return;
      }

      this.sendSuccess(res, result.data, result.message, 200, req);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error updating trip status';
      this.sendError(res, message, 500, undefined, req);
    }
  }

  async getTripsByDriver(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { driverId } = req.params;
      const { page, limit } = this.getPaginationParams(req);

      const result = await this.tripService.getTripsByDriver(driverId, page, limit);

      if (!result.success) {
        this.sendError(res, result.message, 400, undefined, req);
        return;
      }

      const { trips, total } = result.data as any;
      this.sendPaginatedSuccess(res, trips, total, page, limit, result.message, 200, req);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error retrieving driver trips';
      this.sendError(res, message, 500, undefined, req);
    }
  }

  async getTripsByVehicle(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const { page, limit } = this.getPaginationParams(req);

      const result = await this.tripService.getTripsByVehicle(vehicleId, page, limit);

      if (!result.success) {
        this.sendError(res, result.message, 400, undefined, req);
        return;
      }

      const { trips, total } = result.data as any;
      this.sendPaginatedSuccess(res, trips, total, page, limit, result.message, 200, req);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error retrieving vehicle trips';
      this.sendError(res, message, 500, undefined, req);
    }
  }

  /**
   * GET /trips/:driverId/settlement
   * Endpoint del motor de liquidaciones
   * Retorna preview de liquidación para un conductor en un rango de fechas
   * 
   * Query params:
   * - start_date: ISO string (ej: 2024-01-01)
   * - end_date: ISO string (ej: 2024-01-31)
   */
  async getSettlementPreview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const driverId = Array.isArray(req.params.driverId)
        ? req.params.driverId[0]
        : req.params.driverId;
      const { start_date, end_date } = req.query;

      if (!driverId) {
        this.sendError(
          res,
          'Driver ID is required',
          400,
          { driverId: ['Driver ID is required'] },
          req
        );
        return;
      }

      if (!start_date || !end_date) {
        this.sendError(
          res,
          'Start date and end date are required',
          400,
          {
            start_date: !start_date ? ['Start date is required'] : [],
            end_date: !end_date ? ['End date is required'] : [],
          },
          req
        );
        return;
      }

      // Convertir strings a Date
      const startDate = new Date(String(start_date));
      const endDate = new Date(String(end_date));

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        this.sendError(
          res,
          'Invalid date format. Use ISO format (YYYY-MM-DD)',
          400,
          {
            dates: ['Invalid date format. Use ISO format (YYYY-MM-DD)'],
          },
          req
        );
        return;
      }

      // Llamar al servicio
      const response = await this.tripService.getSettlementPreview(
        driverId,
        startDate,
        endDate
      );

      if (!response.success) {
        this.sendError(res, response.message, 400, undefined, req);
        return;
      }

      this.sendSuccess(res, response.data, response.message, 200, req);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      this.sendError(res, message, 500, undefined, req);
    }
  }
}

export default TripController;
