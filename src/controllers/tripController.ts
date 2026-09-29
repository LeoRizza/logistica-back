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

      // Extracción de campos del frontend
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
        ctg,
        notes,
        actual_start_date,
        actual_end_date,
        actual_cost,
        scheduled_date: scheduled_date_param,
      } = req.body;

      // Mapeo de datos del frontend al formato de Prisma
      // REGLA 1: Fecha única usando scheduled_date o date
      const rawDate = scheduled_date_param || date;
      const scheduled_date = rawDate && rawDate !== '' && rawDate !== null ? new Date(rawDate) : null;
      const parsedActualStartDate = actual_start_date && actual_start_date !== '' && actual_start_date !== null ? new Date(actual_start_date) : null;
      const parsedActualEndDate = actual_end_date && actual_end_date !== '' && actual_end_date !== null ? new Date(actual_end_date) : null;

      // Parsear campos numéricos - pasar null si vienen vacíos
      const parseNumericField = (value: any): number | null => {
        if (value === undefined || value === null || value === '') return null;
        const parsed = typeof value === 'string' ? parseFloat(value) : value;
        return isNaN(parsed) ? null : parsed;
      };

      // REGLA 3: Monto a pagar al chofer (actual_cost) - acepta tanto amount_to_pay como actual_cost
      const rawAmountToPay = amount_to_pay !== undefined ? amount_to_pay : actual_cost;
      const parsedActualCost = rawAmountToPay !== null && rawAmountToPay !== '' && rawAmountToPay !== undefined ? parseNumericField(rawAmountToPay) : null;
      const parsedDistanceKm = parseNumericField(estimated_km);
      const parsedKmStart = parseNumericField(km_start);
      const parsedKmEnd = parseNumericField(km_end);
      const parsedLoadWeightTons = parseNumericField(load_weight_tons);
      const parsedLoadVolume = parseNumericField(load_volume_m3);
      const parsedLoadedWeightKg = parseNumericField(loaded_weight_kg);
      const parsedNetWeightKg = parseNumericField(net_weight_kg);
      const parsedRatePerKg = parseNumericField(rate_per_kg);

      // Parsear unforesee_expenses - convertir a formato esperado
      let parsedUnforeseeExpenses: Array<{ detail: string; amount: number }> | undefined = undefined;
      if (unforesee_expenses && Array.isArray(unforesee_expenses)) {
        parsedUnforeseeExpenses = unforesee_expenses.map((expense: any) => ({
          detail: expense.detail || expense.description || 'Gasto imprevisto',
          amount: parseNumericField(expense.amount) || 0,
        }));
      }

      // Permitir blanquear per_diems_delivered
      const parsedPerDiemsDelivered = per_diems_delivered === null || per_diems_delivered === '' ? null : (per_diems_delivered ?? null);

      const createTripPayload: any = {
        reference_number: bill_of_lading,
        origin,
        destination,
        driver_id,
        vehicle_id,
        client_id,
        scheduled_date,
        actual_start_date: parsedActualStartDate,
        actual_end_date: parsedActualEndDate,
        distance_km: parsedDistanceKm,
        km_start: parsedKmStart,
        km_end: parsedKmEnd,
        actual_cost: parsedActualCost,
        per_diems_delivered: parsedPerDiemsDelivered,
        load_description,
        load_weight_tons: parsedLoadWeightTons,
        load_volume_m3: parsedLoadVolume,
        loaded_weight_kg: parsedLoadedWeightKg,
        net_weight_kg: parsedNetWeightKg,
        rate_per_kg: parsedRatePerKg,
        invoice_number,
        ctg,
        status: 'COMPLETED',
        notes,
        unforesee_expenses: parsedUnforeseeExpenses,
        created_by_id: userId,
      };

      const result = await this.tripService.createTrip(createTripPayload);

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
        tripExpenses: undefined,
      };

      this.sendSuccess(res, transformedTrip, result.message, 201, req);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error creating trip';
      this.sendError(res, message, 500, undefined, req);
    }
  }

  async getTrips(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page, limit } = this.getPaginationParams(req);
      const { status, driver_id, client_id } = req.query;

      const result = await this.tripService.getTrips(page, limit, status as string | undefined, driver_id as string | undefined, client_id as string | undefined);

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
        ctg,
        notes,
        status,
        actual_start_date,
        actual_end_date,
        actual_cost,
        scheduled_date: scheduled_date_param,
      } = req.body;

      // Mapeo de datos del frontend al formato de Prisma
      // REGLA 1: Fecha única usando scheduled_date o date
      const rawDate = scheduled_date_param || date;
      const scheduled_date = rawDate && rawDate !== '' && rawDate !== null ? new Date(rawDate) : null;
      const parsedActualStartDate = actual_start_date && actual_start_date !== '' && actual_start_date !== null ? new Date(actual_start_date) : null;
      const parsedActualEndDate = actual_end_date && actual_end_date !== '' && actual_end_date !== null ? new Date(actual_end_date) : null;

      // Parsear campos numéricos - pasar null si vienen vacíos
      const parseNumericField = (value: any): number | null => {
        if (value === undefined || value === null || value === '') return null;
        const parsed = typeof value === 'string' ? parseFloat(value) : value;
        return isNaN(parsed) ? null : parsed;
      };

      // REGLA 3: Monto a pagar al chofer (actual_cost) - acepta tanto amount_to_pay como actual_cost
      const rawAmountToPay = amount_to_pay !== undefined ? amount_to_pay : actual_cost;
      const parsedActualCost = rawAmountToPay !== null && rawAmountToPay !== '' && rawAmountToPay !== undefined ? parseNumericField(rawAmountToPay) : null;
      const parsedDistanceKm = parseNumericField(estimated_km);
      const parsedKmStart = parseNumericField(km_start);
      const parsedKmEnd = parseNumericField(km_end);
      const parsedLoadWeightTons = parseNumericField(load_weight_tons);
      const parsedLoadVolume = parseNumericField(load_volume_m3);
      const parsedLoadedWeightKg = parseNumericField(loaded_weight_kg);
      const parsedNetWeightKg = parseNumericField(net_weight_kg);
      const parsedRatePerKg = parseNumericField(rate_per_kg);

      // Parsear unforesee_expenses - convertir a formato esperado
      let parsedUnforeseeExpenses: Array<{ detail: string; amount: number }> | undefined = undefined;
      if (unforesee_expenses && Array.isArray(unforesee_expenses)) {
        parsedUnforeseeExpenses = unforesee_expenses.map((expense: any) => ({
          detail: expense.detail || expense.description || 'Gasto imprevisto',
          amount: parseNumericField(expense.amount) || 0,
        }));
      }

      // Permitir blanquear per_diems_delivered
      const parsedPerDiemsDelivered = per_diems_delivered === null || per_diems_delivered === '' ? null : (per_diems_delivered ?? null);

      const updatePayload: any = {
        reference_number: bill_of_lading,
        origin,
        destination,
        driver_id,
        vehicle_id,
        client_id,
        scheduled_date,
        actual_start_date: parsedActualStartDate,
        actual_end_date: parsedActualEndDate,
        distance_km: parsedDistanceKm,
        km_start: parsedKmStart,
        km_end: parsedKmEnd,
        actual_cost: parsedActualCost,
        per_diems_delivered: parsedPerDiemsDelivered,
        load_description,
        load_weight_tons: parsedLoadWeightTons,
        load_volume_m3: parsedLoadVolume,
        loaded_weight_kg: parsedLoadedWeightKg,
        net_weight_kg: parsedNetWeightKg,
        rate_per_kg: parsedRatePerKg,
        invoice_number,
        ctg,
        notes,
        unforesee_expenses: parsedUnforeseeExpenses,
        status,
      };

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
