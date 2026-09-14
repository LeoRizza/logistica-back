import { Response } from 'express';
import { AuthenticatedRequest, CreateFuelLogInput, FuelTypeEnum } from '../types/index';
import { BaseController } from './baseController';
import FuelService from '../services/fuelService';

/**
 * FuelController
 * Maneja las operaciones HTTP relacionadas con registros de combustible (FuelLog)
 * 
 * Separa la lógica de negocio (en FuelService) de la presentación HTTP
 */
export class FuelController extends BaseController {
  private fuelService: FuelService;

  constructor() {
    super();
    this.fuelService = new FuelService();
  }

  /**
   * POST /fuel
   * Crea un nuevo registro de carga de combustible
   * REGLA CRÍTICA: Automáticamente calcula liters_per_km basado en el registro anterior
   * OBLIGATORIO: Inyecta created_by_id desde req.user.id
   */
  async createFuelLog(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Validar que el usuario está autenticado
      if (!req.user?.id) {
        this.sendError(res, 'Unauthorized: User not authenticated', 401, undefined, req);
        return;
      }

      const { vehicle_id, trip_id, liters_loaded, fuel_price_per_liter, total_cost, odometer_reading, fuel_type, station_name, location, notes, date } = req.body;

      // Convertir strings a números si es necesario
      const parsedLitersLoaded = typeof liters_loaded === 'string' ? parseFloat(liters_loaded) : liters_loaded;
      const parsedFuelPrice = typeof fuel_price_per_liter === 'string' ? parseFloat(fuel_price_per_liter) : fuel_price_per_liter;
      const parsedTotalCost = typeof total_cost === 'string' ? parseFloat(total_cost) : total_cost;
      const parsedOdometer = typeof odometer_reading === 'string' ? parseFloat(odometer_reading) : odometer_reading;

      // Validación de campos requeridos
      const errors: Record<string, string[]> = {};

      if (!vehicle_id || typeof vehicle_id !== 'string') {
        errors.vehicle_id = ['Vehicle ID is required and must be a string'];
      }

      if (liters_loaded === undefined || liters_loaded === null || isNaN(parsedLitersLoaded) || parsedLitersLoaded <= 0) {
        errors.liters_loaded = ['Liters loaded is required, must be a number greater than 0'];
      }

      // Aceptar EITHER fuel_price_per_liter OR total_cost, pero no ambos
      if ((parsedFuelPrice === undefined || parsedFuelPrice === null) && (parsedTotalCost === undefined || parsedTotalCost === null)) {
        errors.fuel_price = ['Either fuel price per liter or total cost must be provided'];
      }

      if (parsedFuelPrice !== undefined && parsedFuelPrice !== null && (isNaN(parsedFuelPrice) || parsedFuelPrice <= 0)) {
        errors.fuel_price_per_liter = ['Fuel price per liter must be a number greater than 0'];
      }

      if (parsedTotalCost !== undefined && parsedTotalCost !== null && (isNaN(parsedTotalCost) || parsedTotalCost <= 0)) {
        errors.total_cost = ['Total cost must be a number greater than 0'];
      }

      if (odometer_reading === undefined || odometer_reading === null || isNaN(parsedOdometer) || parsedOdometer < 0) {
        errors.odometer_reading = ['Odometer reading is required and must be a non-negative number'];
      }

      if (fuel_type && !Object.values(FuelTypeEnum).includes(fuel_type)) {
        errors.fuel_type = [`Fuel type must be one of: ${Object.values(FuelTypeEnum).join(', ')}`];
      }

      // trip_id es opcional
      if (trip_id !== undefined && trip_id !== null && typeof trip_id !== 'string') {
        errors.trip_id = ['Trip ID must be a string'];
      }

      if (Object.keys(errors).length > 0) {
        this.sendError(res, 'Validation failed', 400, errors, req);
        return;
      }

      // Construir input de servicio con created_by_id inyectado
      // Usar valores parseados para asegurar que son números
      const input: CreateFuelLogInput = {
        vehicle_id,
        liters_loaded: parsedLitersLoaded,
        fuel_price_per_liter: parsedFuelPrice,
        total_cost: parsedTotalCost,
        odometer_reading: parsedOdometer,
        fuel_type: fuel_type ?? FuelTypeEnum.DIESEL,
        station_name: station_name ? station_name.trim() : undefined,
        location: location ? location.trim() : undefined,
        notes: notes ? notes.trim() : undefined,
        trip_id: trip_id ?? undefined,
        date: date ?? undefined,
        created_by_id: req.user.id,
      };

      // Llamar al servicio
      const result = await this.fuelService.createFuelLog(input);

      if (!result.success) {
        this.sendError(res, result.message, 400, undefined, req);
        return;
      }

      this.sendSuccess(res, result.data, 'Fuel log created successfully', 201, req);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.sendError(res, `Failed to create fuel log: ${errorMessage}`, 500, undefined, req);
    }
  }

  /**
   * GET /fuel-logs/vehicle/:vehicleId
   * Obtiene todos los registros de combustible de un vehículo (paginado)
   * Soporta filtrado opcional por rango de fechas con startDate y endDate
   */
  async getFuelLogsByVehicle(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const { page, limit, startDate, endDate } = this.getPaginationParams(req) as any;

      if (!vehicleId || typeof vehicleId !== 'string') {
        this.sendError(res, 'Vehicle ID is required and must be a string', 400, undefined, req);
        return;
      }

      // Validar fechas si se proporcionan
      if (startDate || endDate) {
        if (!startDate || typeof startDate !== 'string') {
          this.sendError(res, 'Start date must be a valid date string when filtering by date range', 400, undefined, req);
          return;
        }

        if (!endDate || typeof endDate !== 'string') {
          this.sendError(res, 'End date must be a valid date string when filtering by date range', 400, undefined, req);
          return;
        }

        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);

        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
          this.sendError(res, 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)', 400, undefined, req);
          return;
        }
      }

      const result = await this.fuelService.getFuelLogsByVehicle(vehicleId, page, limit, startDate, endDate);

      if (!result.success) {
        this.sendError(res, result.message, 404, undefined, req);
        return;
      }

      const { data, total, totalPages } = result.data!;
      this.sendPaginatedSuccess(res, data, total, page, limit, 'Fuel logs retrieved successfully', 200, req);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.sendError(res, `Failed to retrieve fuel logs: ${errorMessage}`, 500, undefined, req);
    }
  }

  /**
   * GET /fuel-logs/:id
   * Obtiene un registro de combustible por ID
   */
  async getFuelLogById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        this.sendError(res, 'Fuel log ID is required and must be a string', 400, undefined, req);
        return;
      }

      const result = await this.fuelService.getFuelLogById(id);

      if (!result.success) {
        this.sendError(res, result.message, 404, undefined, req);
        return;
      }

      this.sendSuccess(res, result.data, 'Fuel log retrieved successfully', 200, req);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.sendError(res, `Failed to retrieve fuel log: ${errorMessage}`, 500, undefined, req);
    }
  }

  /**
   * GET /fuel-logs/vehicle/:vehicleId/average-consumption
   * Obtiene el promedio de consumo (liters_per_km) de un vehículo
   */
  async getAverageFuelConsumption(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const { limitDays } = req.query;

      if (!vehicleId || typeof vehicleId !== 'string') {
        this.sendError(res, 'Vehicle ID is required and must be a string', 400, undefined, req);
        return;
      }

      let limitDaysNumber: number | undefined;
      if (limitDays) {
        limitDaysNumber = parseInt(limitDays as string, 10);
        if (isNaN(limitDaysNumber) || limitDaysNumber <= 0) {
          this.sendError(res, 'Limit days must be a positive number', 400, undefined, req);
          return;
        }
      }

      const result = await this.fuelService.getAverageFuelConsumption(vehicleId, limitDaysNumber);

      if (!result.success) {
        this.sendError(res, result.message, 404, undefined, req);
        return;
      }

      this.sendSuccess(res, result.data, 'Average fuel consumption calculated successfully', 200, req);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.sendError(res, `Failed to calculate fuel consumption: ${errorMessage}`, 500, undefined, req);
    }
  }

  /**
   * GET /fuel-logs/vehicle/:vehicleId/statistics
   * Obtiene estadísticas de combustible en un período
   */
  async getFuelStatisticsByPeriod(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const { startDate, endDate } = req.query;

      if (!vehicleId || typeof vehicleId !== 'string') {
        this.sendError(res, 'Vehicle ID is required and must be a string', 400, undefined, req);
        return;
      }

      if (!startDate || typeof startDate !== 'string') {
        this.sendError(res, 'Start date is required and must be a valid date string', 400, undefined, req);
        return;
      }

      if (!endDate || typeof endDate !== 'string') {
        this.sendError(res, 'End date is required and must be a valid date string', 400, undefined, req);
        return;
      }

      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        this.sendError(res, 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)', 400, undefined, req);
        return;
      }

      const result = await this.fuelService.getFuelStatisticsByPeriod(vehicleId, startDateObj, endDateObj);

      if (!result.success) {
        this.sendError(res, result.message, 404, undefined, req);
        return;
      }

      this.sendSuccess(res, result.data, 'Fuel statistics retrieved successfully', 200, req);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.sendError(res, `Failed to retrieve fuel statistics: ${errorMessage}`, 500, undefined, req);
    }
  }

  /**
   * PUT /fuel-logs/:id
   * Actualiza un registro de combustible
   */
  async updateFuelLog(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { liters_loaded, fuel_price_per_liter, odometer_reading, fuel_type, station_name, location, notes, trip_id } = req.body;

      if (!id || typeof id !== 'string') {
        this.sendError(res, 'Fuel log ID is required and must be a string', 400, undefined, req);
        return;
      }

      // Validación de campos opcionales
      const errors: Record<string, string[]> = {};

      if (liters_loaded !== undefined && (typeof liters_loaded !== 'number' || liters_loaded <= 0)) {
        errors.liters_loaded = ['Liters loaded must be a number and greater than 0'];
      }

      if (fuel_price_per_liter !== undefined && (typeof fuel_price_per_liter !== 'number' || fuel_price_per_liter <= 0)) {
        errors.fuel_price_per_liter = ['Fuel price per liter must be a number and greater than 0'];
      }

      if (odometer_reading !== undefined && (typeof odometer_reading !== 'number' || odometer_reading < 0)) {
        errors.odometer_reading = ['Odometer reading must be a non-negative number'];
      }

      if (fuel_type !== undefined && !Object.values(FuelTypeEnum).includes(fuel_type)) {
        errors.fuel_type = [`Fuel type must be one of: ${Object.values(FuelTypeEnum).join(', ')}`];
      }

      if (trip_id !== undefined && trip_id !== null && typeof trip_id !== 'string') {
        errors.trip_id = ['Trip ID must be a string'];
      }

      if (Object.keys(errors).length > 0) {
        this.sendError(res, 'Validation failed', 400, errors, req);
        return;
      }

      // Construir datos de actualización
      const updateData: Partial<CreateFuelLogInput> = {};
      if (liters_loaded !== undefined) updateData.liters_loaded = liters_loaded;
      if (fuel_price_per_liter !== undefined) updateData.fuel_price_per_liter = fuel_price_per_liter;
      if (odometer_reading !== undefined) updateData.odometer_reading = odometer_reading;
      if (fuel_type !== undefined) updateData.fuel_type = fuel_type;
      if (station_name !== undefined) updateData.station_name = station_name;
      if (location !== undefined) updateData.location = location;
      if (notes !== undefined) updateData.notes = notes;
      if (trip_id !== undefined) updateData.trip_id = trip_id;

      const result = await this.fuelService.updateFuelLog(id, updateData);

      if (!result.success) {
        this.sendError(res, result.message, 404, undefined, req);
        return;
      }

      this.sendSuccess(res, result.data, 'Fuel log updated successfully', 200, req);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.sendError(res, `Failed to update fuel log: ${errorMessage}`, 500, undefined, req);
    }
  }

  /**
   * DELETE /fuel-logs/:id
   * Elimina (soft delete) un registro de combustible
   */
  async deleteFuelLog(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string') {
        this.sendError(res, 'Fuel log ID is required and must be a string', 400, undefined, req);
        return;
      }

      const result = await this.fuelService.deleteFuelLog(id);

      if (!result.success) {
        this.sendError(res, result.message, 404, undefined, req);
        return;
      }

      this.sendSuccess(res, null, 'Fuel log deleted successfully', 200, req);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.sendError(res, `Failed to delete fuel log: ${errorMessage}`, 500, undefined, req);
    }
  }
}

export default FuelController;
