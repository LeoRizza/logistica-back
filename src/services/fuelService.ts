import { BaseService } from './baseService';
import { ServiceResponse, CreateFuelLogInput, FuelLogDTO } from '../types/index';
import { FuelLog, Vehicle, Prisma } from '@prisma/client';

/**
 * FuelService
 * Lógica de negocio para gestión de registros de combustible (FuelLog)
 * 
 * REGLA CRÍTICA: Al crear un registro de carga de combustible, se busca
 * el registro anterior para calcular los kilómetros recorridos y el
 * promedio de liters_per_km automáticamente.
 * 
 * NUEVA REGLA: Ahora acepta EITHER fuel_price_per_liter OR total_cost
 * y calcula el faltante automáticamente.
 */
export class FuelService extends BaseService {
  /**
   * Crea un nuevo registro de carga de combustible
   * Automáticamente calcula liters_per_km basado en el registro anterior
   * Calcula fuel_price_per_liter desde total_cost si es necesario
   * 
   * @param input Datos para crear el registro de combustible
   * @returns ServiceResponse con el FuelLog creado
   */
  async createFuelLog(input: CreateFuelLogInput): Promise<ServiceResponse<FuelLogDTO>> {
    try {
      // Validar que el vehículo existe
      const vehicle: Vehicle | null = await this.prisma.vehicle.findUnique({
        where: { id: input.vehicle_id },
      });

      if (!vehicle) {
        return this.createErrorResponse(`Vehicle with ID ${input.vehicle_id} not found`);
      }

      // Validar que el usuario existe
      const userExists = await this.prisma.user.findUnique({
        where: { id: input.created_by_id },
      });

      if (!userExists) {
        return this.createErrorResponse(`User with ID ${input.created_by_id} not found`);
      }

      // Validar datos de entrada
      if (input.liters_loaded <= 0) {
        return this.createErrorResponse('Liters loaded must be greater than 0');
      }

      // Validar que tenemos EITHER fuel_price_per_liter OR total_cost
      const hasFuelPrice = input.fuel_price_per_liter !== undefined && input.fuel_price_per_liter > 0;
      const hasTotalCost = input.total_cost !== undefined && input.total_cost > 0;

      if (!hasFuelPrice && !hasTotalCost) {
        return this.createErrorResponse('Either fuel_price_per_liter or total_cost must be provided');
      }

      // Calcular fuel_price_per_liter si viene total_cost
      let finalFuelPrice = input.fuel_price_per_liter || 0;
      let finalTotalCost = input.total_cost || 0;

      if (hasTotalCost && !hasFuelPrice) {
        // Calcular precio por litro desde total_cost
        finalFuelPrice = input.total_cost! / input.liters_loaded;
        finalTotalCost = input.total_cost!;
      } else if (hasFuelPrice && !hasTotalCost) {
        // Calcular total_cost desde fuel_price_per_liter
        finalFuelPrice = input.fuel_price_per_liter!;
        finalTotalCost = input.fuel_price_per_liter! * input.liters_loaded;
      }

      if (finalFuelPrice <= 0) {
        return this.createErrorResponse('Calculated fuel price per liter must be greater than 0');
      }

      if (input.odometer_reading < 0) {
        return this.createErrorResponse('Odometer reading must be non-negative');
      }

      // Obtener el último registro de combustible de este vehículo ordenado por odometer_reading
      const previousFuelLog: FuelLog | null = await this.prisma.fuelLog.findFirst({
        where: {
          vehicle_id: input.vehicle_id,
          deleted_at: null,
        },
        orderBy: {
          odometer_reading: 'desc',
        },
      });

      let distanceKm: number | null = null;
      let litersPerKm: number | null = null;

      // Calcular distancia y promedio de consumo si hay un registro anterior
      if (previousFuelLog) {
        distanceKm = input.odometer_reading - previousFuelLog.odometer_reading;

        // Validar que el odómetro no haya bajado
        if (distanceKm < 0) {
          return this.createErrorResponse(
            `Odometer reading (${input.odometer_reading} km) cannot be less than the previous reading (${previousFuelLog.odometer_reading} km). If the vehicle's odometer was reset, you may need to add a note about the reset.`
          );
        }

        // Calcular liters_per_km solo si hay distancia recorrida
        if (distanceKm > 0) {
          litersPerKm = previousFuelLog.liters_loaded / distanceKm;
        }
      }

      // Crear el registro de combustible
      const newFuelLog: FuelLog = await this.prisma.fuelLog.create({
        data: {
          vehicle_id: input.vehicle_id,
          liters_loaded: input.liters_loaded,
          fuel_price_per_liter: finalFuelPrice,
          odometer_reading: input.odometer_reading,
          fuel_type: input.fuel_type ?? 'DIESEL',
          station_name: input.station_name ?? null,
          location: input.location ?? null,
          notes: input.notes ?? null,
          total_cost: finalTotalCost,
          created_by_id: input.created_by_id,
          trip_id: input.trip_id ?? null,
          distance_km: previousFuelLog ? distanceKm : null,
          liters_per_km: previousFuelLog ? litersPerKm : null,
          previous_fuel_log_id: previousFuelLog?.id ?? null,
          created_at: input.date ? new Date(input.date + 'T12:00:00Z') : undefined,
        },
      });

      const fuelLogDTO = this.mapFuelLogToDTO(newFuelLog);

      return this.createSuccessResponse(
        fuelLogDTO,
        'Fuel log created successfully'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to create fuel log: ${errorMessage}`);
    }
  }

  /**
   * Obtiene todos los registros de combustible de un vehículo (paginado)
   * Soporta filtrado opcional por rango de fechas
   * 
   * @param vehicleId ID del vehículo
   * @param page Número de página
   * @param limit Límite de registros por página
   * @param startDate Fecha de inicio (opcional, formato ISO 8601)
   * @param endDate Fecha de fin (opcional, formato ISO 8601)
   * @returns ServiceResponse con lista paginada de FuelLogs
   */
  async getFuelLogsByVehicle(
    vehicleId: string,
    page: number,
    limit: number,
    startDate?: string | Date,
    endDate?: string | Date
  ): Promise<ServiceResponse<{ data: FuelLogDTO[]; total: number; page: number; limit: number; totalPages: number }>> {
    try {
      // Validar que el vehículo existe
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });

      if (!vehicle) {
        return this.createErrorResponse(`Vehicle with ID ${vehicleId} not found`);
      }

      const { skip, take } = this.calculatePagination(page, limit);

      // Construir la cláusula where dinámica
      const whereClause: Prisma.FuelLogWhereInput = {
        vehicle_id: vehicleId,
        deleted_at: null,
      };

      // Agregar filtro de fechas si se proporcionan
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Validar que las fechas son válidas
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return this.createErrorResponse('Invalid date format. Use ISO 8601 format (YYYY-MM-DD)');
        }

        // Validar que startDate <= endDate
        if (start > end) {
          return this.createErrorResponse('Start date must be before or equal to end date');
        }

        // Configurar el final del día para endDate para incluir todo el día
        end.setUTCHours(23, 59, 59, 999);

        whereClause.created_at = {
          gte: start,
          lte: end,
        };
      }

      const [fuelLogs, total]: [FuelLog[], number] = await Promise.all([
        this.prisma.fuelLog.findMany({
          where: whereClause,
          orderBy: {
            created_at: 'desc',
          },
          skip,
          take,
        }),
        this.prisma.fuelLog.count({
          where: whereClause,
        }),
      ]);

      const fuelLogDTOs = fuelLogs.map(log => this.mapFuelLogToDTO(log));
      const totalPages = Math.ceil(total / limit);

      return this.createSuccessResponse(
        {
          data: fuelLogDTOs,
          total,
          page,
          limit,
          totalPages,
        },
        'Fuel logs retrieved successfully'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to retrieve fuel logs: ${errorMessage}`);
    }
  }

  /**
   * Obtiene un registro de combustible por ID
   * 
   * @param id ID del FuelLog
   * @returns ServiceResponse con el FuelLog encontrado
   */
  async getFuelLogById(id: string): Promise<ServiceResponse<FuelLogDTO>> {
    try {
      if (!this.isValidId(id)) {
        return this.createErrorResponse(`Invalid fuel log ID format: ${id}`);
      }

      const fuelLog: FuelLog | null = await this.prisma.fuelLog.findUnique({
        where: { id },
      });

      if (!fuelLog || fuelLog.deleted_at !== null) {
        return this.createErrorResponse(`Fuel log with ID ${id} not found`);
      }

      const fuelLogDTO = this.mapFuelLogToDTO(fuelLog);

      return this.createSuccessResponse(fuelLogDTO, 'Fuel log retrieved successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to retrieve fuel log: ${errorMessage}`);
    }
  }

  /**
   * Obtiene el promedio de consumo (liters_per_km) de un vehículo
   * 
   * @param vehicleId ID del vehículo
   * @param limitDays Número de días para calcular el promedio (opcional)
   * @returns ServiceResponse con el promedio de consumo
   */
  async getAverageFuelConsumption(
    vehicleId: string,
    limitDays?: number
  ): Promise<ServiceResponse<{ averageLitersPerKm: number; recordsCount: number; periodDays?: number }>> {
    try {
      // Validar que el vehículo existe
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });

      if (!vehicle) {
        return this.createErrorResponse(`Vehicle with ID ${vehicleId} not found`);
      }

      const whereClause: Prisma.FuelLogWhereInput = {
        vehicle_id: vehicleId,
        deleted_at: null,
        liters_per_km: {
          not: null,
        },
      };

      if (limitDays) {
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - limitDays);
        whereClause.created_at = {
          gte: dateLimit,
        };
      }

      const fuelLogs: FuelLog[] = await this.prisma.fuelLog.findMany({
        where: whereClause,
        orderBy: {
          created_at: 'asc',
        },
      });

      if (fuelLogs.length === 0) {
        return this.createErrorResponse(
          `No fuel logs with consumption data found for vehicle ${vehicleId}`
        );
      }

      // Calcular el promedio
      const totalLitersPerKm = fuelLogs.reduce((sum, log) => sum + (log.liters_per_km || 0), 0);
      const averageLitersPerKm = totalLitersPerKm / fuelLogs.length;

      const result = {
        averageLitersPerKm: parseFloat(averageLitersPerKm.toFixed(4)),
        recordsCount: fuelLogs.length,
        periodDays: limitDays,
      };

      return this.createSuccessResponse(
        result,
        'Average fuel consumption calculated successfully'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to calculate fuel consumption: ${errorMessage}`);
    }
  }

  /**
   * Obtiene el total de combustible cargado en un período
   * 
   * @param vehicleId ID del vehículo
   * @param startDate Fecha de inicio
   * @param endDate Fecha de fin
   * @returns ServiceResponse con las estadísticas
   */
  async getFuelStatisticsByPeriod(
    vehicleId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ServiceResponse<{
    totalLiters: number;
    totalCost: number;
    averagePrice: number;
    recordsCount: number;
    startDate: Date;
    endDate: Date;
  }>> {
    try {
      // Validar que el vehículo existe
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });

      if (!vehicle) {
        return this.createErrorResponse(`Vehicle with ID ${vehicleId} not found`);
      }

      // Validar fechas
      if (startDate > endDate) {
        return this.createErrorResponse('Start date must be before end date');
      }

      const fuelLogs: FuelLog[] = await this.prisma.fuelLog.findMany({
        where: {
          vehicle_id: vehicleId,
          deleted_at: null,
          created_at: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          created_at: 'asc',
        },
      });

      if (fuelLogs.length === 0) {
        return this.createErrorResponse('No fuel logs found in the specified period');
      }

      const totalLiters = fuelLogs.reduce((sum, log) => sum + log.liters_loaded, 0);
      const totalCost = fuelLogs.reduce((sum, log) => sum + log.total_cost, 0);
      const averagePrice = totalCost / totalLiters;

      const result = {
        totalLiters: parseFloat(totalLiters.toFixed(2)),
        totalCost: parseFloat(totalCost.toFixed(2)),
        averagePrice: parseFloat(averagePrice.toFixed(2)),
        recordsCount: fuelLogs.length,
        startDate,
        endDate,
      };

      return this.createSuccessResponse(
        result,
        'Fuel statistics retrieved successfully'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to retrieve fuel statistics: ${errorMessage}`);
    }
  }

  /**
   * Actualiza un registro de combustible
   * 
   * @param id ID del FuelLog
   * @param updateData Datos a actualizar
   * @returns ServiceResponse con el FuelLog actualizado
   */
  async updateFuelLog(
    id: string,
    updateData: Partial<CreateFuelLogInput>
  ): Promise<ServiceResponse<FuelLogDTO>> {
    try {
      if (!this.isValidId(id)) {
        return this.createErrorResponse(`Invalid fuel log ID format: ${id}`);
      }

      const existingFuelLog: FuelLog | null = await this.prisma.fuelLog.findUnique({
        where: { id },
      });

      if (!existingFuelLog || existingFuelLog.deleted_at !== null) {
        return this.createErrorResponse(`Fuel log with ID ${id} not found`);
      }

      // Construir datos de actualización
      const dataToUpdate: Partial<FuelLog> = {};

      if (updateData.liters_loaded !== undefined) {
        if (updateData.liters_loaded <= 0) {
          return this.createErrorResponse('Liters loaded must be greater than 0');
        }
        dataToUpdate.liters_loaded = updateData.liters_loaded;
      }

      if (updateData.fuel_price_per_liter !== undefined) {
        if (updateData.fuel_price_per_liter <= 0) {
          return this.createErrorResponse('Fuel price per liter must be greater than 0');
        }
        dataToUpdate.fuel_price_per_liter = updateData.fuel_price_per_liter;
      }

      if (updateData.odometer_reading !== undefined) {
        if (updateData.odometer_reading < 0) {
          return this.createErrorResponse('Odometer reading must be non-negative');
        }
        dataToUpdate.odometer_reading = updateData.odometer_reading;
      }

      if (updateData.station_name !== undefined) {
        dataToUpdate.station_name = updateData.station_name ?? null;
      }

      if (updateData.location !== undefined) {
        dataToUpdate.location = updateData.location ?? null;
      }

      if (updateData.notes !== undefined) {
        dataToUpdate.notes = updateData.notes ?? null;
      }

      if (updateData.fuel_type !== undefined) {
        dataToUpdate.fuel_type = updateData.fuel_type;
      }

      if (updateData.trip_id !== undefined) {
        dataToUpdate.trip_id = updateData.trip_id ?? null;
      }

      // Recalcular total_cost si cambió el precio o los litros
      if (updateData.liters_loaded !== undefined || updateData.fuel_price_per_liter !== undefined) {
        const liters = updateData.liters_loaded ?? existingFuelLog.liters_loaded;
        const price = updateData.fuel_price_per_liter ?? existingFuelLog.fuel_price_per_liter;
        dataToUpdate.total_cost = liters * price;
      }

      // Actualizar el registro
      const updatedFuelLog: FuelLog = await this.prisma.fuelLog.update({
        where: { id },
        data: dataToUpdate,
      });

      const fuelLogDTO = this.mapFuelLogToDTO(updatedFuelLog);

      return this.createSuccessResponse(fuelLogDTO, 'Fuel log updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to update fuel log: ${errorMessage}`);
    }
  }

  /**
   * Elimina (soft delete) un registro de combustible
   * 
   * @param id ID del FuelLog
   * @returns ServiceResponse con confirmación
   */
  async deleteFuelLog(id: string): Promise<ServiceResponse<null>> {
    try {
      if (!this.isValidId(id)) {
        return this.createErrorResponse(`Invalid fuel log ID format: ${id}`);
      }

      const existingFuelLog: FuelLog | null = await this.prisma.fuelLog.findUnique({
        where: { id },
      });

      if (!existingFuelLog || existingFuelLog.deleted_at !== null) {
        return this.createErrorResponse(`Fuel log with ID ${id} not found`);
      }

      await this.prisma.fuelLog.update({
        where: { id },
        data: {
          deleted_at: new Date(),
        },
      });

      return this.createSuccessResponse(null, 'Fuel log deleted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to delete fuel log: ${errorMessage}`);
    }
  }

  /**
   * Mapea un objeto FuelLog a FuelLogDTO
   */
  private mapFuelLogToDTO(fuelLog: FuelLog): FuelLogDTO {
    return {
      id: fuelLog.id,
      liters_loaded: fuelLog.liters_loaded,
      liters_per_km: fuelLog.liters_per_km,
      distance_km: fuelLog.distance_km,
      fuel_price_per_liter: fuelLog.fuel_price_per_liter,
      total_cost: fuelLog.total_cost,
      odometer_reading: fuelLog.odometer_reading,
      fuel_type: fuelLog.fuel_type,
      station_name: fuelLog.station_name,
      location: fuelLog.location,
      notes: fuelLog.notes,
      trip_id: fuelLog.trip_id,
      vehicle_id: fuelLog.vehicle_id,
      created_by_id: fuelLog.created_by_id,
      created_at: fuelLog.created_at,
      updated_at: fuelLog.updated_at,
      deleted_at: fuelLog.deleted_at,
    };
  }
}

export default FuelService;
