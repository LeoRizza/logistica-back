import { BaseService } from './baseService';
import { ServiceResponse } from '../types/index';
import { prisma } from '../config/database';

interface SettlementPreview {
  driver_id: string;
  total_estimated_km: number;
  total_viaticos_amount: number;
  total_driver_flat_pay: number;
  trip_count: number;
  trips: Array<{
    id: string;
    reference_number?: string | null;
    origin?: string | null;
    destination?: string | null;
    distance_km?: number | null;
    estimated_cost?: number | null;
    status?: string | null;
    scheduled_date?: Date | null;
    actual_start_date?: Date | null;
    actual_end_date?: Date | null;
    load_description?: string | null;
    load_weight_tons?: number | null;
  }>;
}

/**
 * TripService
 * Contiene la lógica de negocio para viajes
 */
interface UnforeseeExpense {
  detail: string;
  amount: number;
}

interface CreateTripInput {
  reference_number?: string | null;
  ctg?: string | null;
  origin?: string | null;
  destination?: string | null;
  driver_id?: string | null;
  vehicle_id?: string | null;
  client_id?: string | null;
  scheduled_date?: Date | null;
  distance_km?: number | null;
  km_start?: number | null;
  km_end?: number | null;
  estimated_cost?: number | null;
  per_diems_delivered?: number | null;
  load_description?: string | null;
  load_weight_tons?: number | null;
  load_volume_m3?: number | null;
  loaded_weight_kg?: number | null;
  net_weight_kg?: number | null;
  rate_per_kg?: number | null;
  invoice_number?: string | null;
  status?: string | null;
  notes?: string | null;
  unforesee_expenses?: UnforeseeExpense[];
  created_by_id: string;
}

interface UpdateTripInput {
  reference_number?: string | null;
  ctg?: string | null;
  origin?: string | null;
  destination?: string | null;
  driver_id?: string | null;
  vehicle_id?: string | null;
  client_id?: string | null;
  scheduled_date?: Date | null;
  actual_start_date?: Date | null;
  actual_end_date?: Date | null;
  distance_km?: number | null;
  km_start?: number | null;
  km_end?: number | null;
  estimated_cost?: number | null;
  actual_cost?: number | null;
  per_diems_delivered?: number | null;
  load_description?: string | null;
  load_weight_tons?: number | null;
  load_volume_m3?: number | null;
  loaded_weight_kg?: number | null;
  net_weight_kg?: number | null;
  rate_per_kg?: number | null;
  invoice_number?: string | null;
  notes?: string | null;
  unforesee_expenses?: UnforeseeExpense[];
  status?: string | null;
}

export class TripService extends BaseService {
  /**
   * Sanitiza strings vacíos a null para evitar problemas con unique constraints
   */
  private sanitizeString(value: string | null | undefined): string | null {
    if (value === undefined) return undefined as any;
    const trimmed = typeof value === 'string' ? value.trim() : value;
    return trimmed === '' ? null : trimmed;
  }

  async createTrip(tripData: CreateTripInput): Promise<ServiceResponse<any>> {
    try {
      if (!tripData.created_by_id) {
        return this.createErrorResponse('created_by_id is required');
      }

      const sanitizedRefNum = this.sanitizeString(tripData.reference_number as string | null);
      const sanitizedCtg = this.sanitizeString(tripData.ctg as string | null);
      const sanitizedOrigin = this.sanitizeString(tripData.origin as string | null);
      const sanitizedDestination = this.sanitizeString(tripData.destination as string | null);
      const sanitizedDriverId = this.sanitizeString(tripData.driver_id as string | null);
      const sanitizedVehicleId = this.sanitizeString(tripData.vehicle_id as string | null);
      const sanitizedClientId = this.sanitizeString(tripData.client_id as string | null);
      const sanitizedInvoice = this.sanitizeString(tripData.invoice_number as string | null);
      const sanitizedLoadDesc = this.sanitizeString(tripData.load_description as string | null);
      const sanitizedNotes = this.sanitizeString(tripData.notes as string | null);

      if (sanitizedRefNum) {
        const existingTrip = await this.prisma.trip.findUnique({
          where: { reference_number: sanitizedRefNum },
        });
        if (existingTrip && !existingTrip.deleted_at) {
          return this.createErrorResponse('Trip with this reference number already exists');
        }
      }

      if (sanitizedDriverId) {
        const driver = await this.prisma.driver.findUnique({
          where: { id: sanitizedDriverId },
        });
        if (!driver || driver.deleted_at) {
          return this.createErrorResponse('Driver not found');
        }
      }

      if (sanitizedVehicleId) {
        const vehicle = await this.prisma.vehicle.findUnique({
          where: { id: sanitizedVehicleId },
        });
        if (!vehicle || vehicle.deleted_at) {
          return this.createErrorResponse('Vehicle not found');
        }
      }

      if (sanitizedClientId) {
        const client = await this.prisma.client.findUnique({
          where: { id: sanitizedClientId },
        });
        if (!client || client.deleted_at) {
          return this.createErrorResponse('Client not found');
        }
      }

      let estimatedCost = tripData.estimated_cost;
      if (estimatedCost === undefined || estimatedCost === null) {
        if (
          tripData.net_weight_kg !== undefined &&
          tripData.net_weight_kg !== null &&
          tripData.rate_per_kg !== undefined &&
          tripData.rate_per_kg !== null
        ) {
          estimatedCost = Number(tripData.net_weight_kg) * Number(tripData.rate_per_kg);
        } else {
          estimatedCost = null;
        }
      }

      const trip = await this.prisma.trip.create({
        data: {
          reference_number: sanitizedRefNum,
          ctg: sanitizedCtg,
          origin: sanitizedOrigin,
          destination: sanitizedDestination,
          driver_id: sanitizedDriverId,
          vehicle_id: sanitizedVehicleId,
          ...(sanitizedClientId && { client_id: sanitizedClientId }),
          scheduled_date: tripData.scheduled_date ? new Date(tripData.scheduled_date) : null,
          distance_km: tripData.distance_km,
          km_start: tripData.km_start,
          km_end: tripData.km_end,
          estimated_cost: estimatedCost,
          per_diems_delivered: tripData.per_diems_delivered ?? 0,
          load_description: sanitizedLoadDesc,
          load_weight_tons: tripData.load_weight_tons,
          load_volume_m3: tripData.load_volume_m3,
          loaded_weight_kg: tripData.loaded_weight_kg,
          net_weight_kg: tripData.net_weight_kg,
          rate_per_kg: tripData.rate_per_kg,
          invoice_number: sanitizedInvoice,
          notes: sanitizedNotes,
          created_by_id: tripData.created_by_id,
          status: 'COMPLETED',
          ...(tripData.unforesee_expenses && tripData.unforesee_expenses.length > 0 && {
            tripExpenses: {
              create: tripData.unforesee_expenses.map((expense) => ({
                category: 'OTHER',
                description: expense.detail,
                amount: expense.amount,
                created_by_id: tripData.created_by_id,
              })),
            },
          }),
        },
        include: {
          driver: { select: { id: true, full_name: true } },
          vehicle: { select: { id: true, plate: true } },
          client: { select: { id: true, business_name: true } },
          tripExpenses: true,
        },
      });

      return this.createSuccessResponse(trip, 'Trip created successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error creating trip';
      return this.createErrorResponse(message);
    }
  }

  async getTrips(
    page: number = 1,
    limit: number = 10,
    status?: string,
    driverId?: string,
    clientId?: string
  ): Promise<ServiceResponse<any>> {
    try {
      const { skip, take } = this.calculatePagination(page, limit);

      const [trips, total] = await Promise.all([
        this.prisma.trip.findMany({
          where: { deleted_at: null },
          skip,
          take,
          include: {
            driver: { select: { id: true, full_name: true } },
            vehicle: { select: { id: true, plate: true } },
            client: { select: { id: true, business_name: true } },
            created_by: { select: { id: true, name: true } },
            tripExpenses: true,
            fuelLogs: { orderBy: { created_at: 'desc' } },
          },
          orderBy: { scheduled_date: 'desc' },
        }),
        this.prisma.trip.count({
          where: { deleted_at: null },
        }),
      ]);

      return this.createSuccessResponse(
        { trips, total, page, limit },
        'Trips retrieved successfully'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error retrieving trips';
      return this.createErrorResponse(message);
    }
  }

  async getTripById(id: string): Promise<ServiceResponse<any>> {
    try {
      if (!id) {
        return this.createErrorResponse('Trip ID is required');
      }

      const trip = await this.prisma.trip.findUnique({
        where: { id },
        include: {
          driver: true,
          vehicle: true,
          client: { select: { id: true, business_name: true } },
          tripExpenses: true,
          fuelLogs: { orderBy: { created_at: 'desc' } },
          created_by: { select: { id: true, name: true } },
        },
      });

      if (!trip || trip.deleted_at) {
        return this.createErrorResponse('Trip not found');
      }

      return this.createSuccessResponse(trip, 'Trip retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error retrieving trip';
      return this.createErrorResponse(message);
    }
  }

  async updateTrip(id: string, tripData: UpdateTripInput): Promise<ServiceResponse<any>> {
    try {
      if (!id) {
        return this.createErrorResponse('Trip ID is required');
      }

      // Verificar que el viaje existe
      const existingTrip = await this.prisma.trip.findUnique({
        where: { id },
      });

      if (!existingTrip || existingTrip.deleted_at) {
        return this.createErrorResponse('Trip not found');
      }

      // Si se intenta cambiar el conductor o el vehículo, validar que existan
      if (tripData.driver_id) {
        const driver = await this.prisma.driver.findUnique({
          where: { id: tripData.driver_id },
        });
        if (!driver || driver.deleted_at) {
          return this.createErrorResponse('Driver not found');
        }
      }

      if (tripData.vehicle_id) {
        const vehicle = await this.prisma.vehicle.findUnique({
          where: { id: tripData.vehicle_id },
        });
        if (!vehicle || vehicle.deleted_at) {
          return this.createErrorResponse('Vehicle not found');
        }
      }

      // Si se intenta cambiar el cliente, validar que exista (si se proporciona)
      if (tripData.client_id) {
        const client = await this.prisma.client.findUnique({
          where: { id: tripData.client_id },
        });
        if (!client || client.deleted_at) {
          return this.createErrorResponse('Client not found');
        }
      }

      // Si hay gastos imprevistos nuevos, eliminar los antiguos y crear los nuevos
      if (tripData.unforesee_expenses !== undefined) {
        await this.prisma.tripExpense.deleteMany({
          where: { trip_id: id },
        });
      }

      const trip = await this.prisma.trip.update({
        where: { id },
        data: {
          ...(tripData.origin && { origin: tripData.origin }),
          ...(tripData.destination && { destination: tripData.destination }),
          ...(tripData.driver_id && { driver_id: tripData.driver_id }),
          ...(tripData.vehicle_id && { vehicle_id: tripData.vehicle_id }),
          ...(tripData.client_id !== undefined && { client_id: tripData.client_id }),
          ...(tripData.scheduled_date && { scheduled_date: new Date(tripData.scheduled_date) }),
          ...(tripData.actual_start_date !== undefined && { actual_start_date: tripData.actual_start_date ? new Date(tripData.actual_start_date) : null }),
          ...(tripData.actual_end_date !== undefined && { actual_end_date: tripData.actual_end_date ? new Date(tripData.actual_end_date) : null }),
          ...(tripData.distance_km !== undefined && { distance_km: tripData.distance_km }),
          ...(tripData.km_start !== undefined && { km_start: tripData.km_start }),
          ...(tripData.km_end !== undefined && { km_end: tripData.km_end }),
          ...(tripData.estimated_cost && { estimated_cost: tripData.estimated_cost }),
          ...(tripData.actual_cost !== undefined && { actual_cost: tripData.actual_cost }),
          ...(tripData.per_diems_delivered !== undefined && { per_diems_delivered: tripData.per_diems_delivered }),
          ...(tripData.load_description !== undefined && { load_description: tripData.load_description }),
          ...(tripData.load_weight_tons !== undefined && { load_weight_tons: tripData.load_weight_tons }),
          ...(tripData.load_volume_m3 !== undefined && { load_volume_m3: tripData.load_volume_m3 }),
          ...(tripData.loaded_weight_kg !== undefined && { loaded_weight_kg: tripData.loaded_weight_kg }),
          ...(tripData.net_weight_kg !== undefined && { net_weight_kg: tripData.net_weight_kg }),
          ...(tripData.rate_per_kg !== undefined && { rate_per_kg: tripData.rate_per_kg }),
          ...(tripData.invoice_number !== undefined && { invoice_number: tripData.invoice_number }),
          ...(tripData.notes !== undefined && { notes: tripData.notes }),
          ...(tripData.status && { status: tripData.status }),
          ...(tripData.unforesee_expenses && tripData.unforesee_expenses.length > 0 && {
            tripExpenses: {
              create: tripData.unforesee_expenses.map((expense) => ({
                category: 'OTHER',
                description: expense.detail,
                amount: expense.amount,
                created_by_id: existingTrip.created_by_id,
              })),
            },
          }),
        },
        include: {
          driver: { select: { id: true, full_name: true } },
          vehicle: { select: { id: true, plate: true } },
          client: { select: { id: true, business_name: true } },
          tripExpenses: true,
          fuelLogs: { orderBy: { created_at: 'desc' } },
        },
      });

      return this.createSuccessResponse(trip, 'Trip updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error updating trip';
      return this.createErrorResponse(message);
    }
  }

  async deleteTrip(id: string): Promise<ServiceResponse<any>> {
    try {
      if (!id) {
        return this.createErrorResponse('Trip ID is required');
      }

      const existingTrip = await this.prisma.trip.findUnique({
        where: { id },
      });

      if (!existingTrip || existingTrip.deleted_at) {
        return this.createErrorResponse('Trip not found');
      }

      // Soft delete
      const trip = await this.prisma.trip.update({
        where: { id },
        data: { deleted_at: new Date() },
      });

      return this.createSuccessResponse(trip, 'Trip deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error deleting trip';
      return this.createErrorResponse(message);
    }
  }

  async updateTripStatus(id: string, status: string): Promise<ServiceResponse<any>> {
    try {
      if (!id || !status) {
        return this.createErrorResponse('Trip ID and status are required');
      }

      const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return this.createErrorResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const trip = await this.prisma.trip.findUnique({
        where: { id },
      });

      if (!trip || trip.deleted_at) {
        return this.createErrorResponse('Trip not found');
      }

      const updatedTrip = await this.prisma.trip.update({
        where: { id },
        data: { status },
        include: {
          driver: { select: { id: true, full_name: true } },
          vehicle: { select: { id: true, plate: true } },
          client: { select: { id: true, business_name: true } },
        },
      });

      return this.createSuccessResponse(updatedTrip, 'Trip status updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error updating trip status';
      return this.createErrorResponse(message);
    }
  }

  async getTripsByDriver(driverId: string, page: number = 1, limit: number = 10): Promise<ServiceResponse<any>> {
    try {
      if (!driverId) {
        return this.createErrorResponse('Driver ID is required');
      }

      // Verificar que el conductor existe
      const driver = await this.prisma.driver.findUnique({
        where: { id: driverId },
      });

      if (!driver || driver.deleted_at) {
        return this.createErrorResponse('Driver not found');
      }

      const { skip, take } = this.calculatePagination(page, limit);

      const [trips, total] = await Promise.all([
        this.prisma.trip.findMany({
          where: { driver_id: driverId, deleted_at: null },
          skip,
          take,
          include: {
            vehicle: { select: { id: true, plate: true } },
            client: { select: { id: true, business_name: true } },
            created_by: { select: { id: true, name: true } },
            fuelLogs: { orderBy: { created_at: 'desc' } },
          },
          orderBy: { scheduled_date: 'desc' },
        }),
        this.prisma.trip.count({
          where: { driver_id: driverId, deleted_at: null },
        }),
      ]);

      return this.createSuccessResponse(
        { trips, total, page, limit },
        'Driver trips retrieved successfully'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error retrieving driver trips';
      return this.createErrorResponse(message);
    }
  }

  async getTripsByVehicle(vehicleId: string, page: number = 1, limit: number = 10): Promise<ServiceResponse<any>> {
    try {
      if (!vehicleId) {
        return this.createErrorResponse('Vehicle ID is required');
      }

      // Verificar que el vehículo existe
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });

      if (!vehicle || vehicle.deleted_at) {
        return this.createErrorResponse('Vehicle not found');
      }

      const { skip, take } = this.calculatePagination(page, limit);

      const [trips, total] = await Promise.all([
        this.prisma.trip.findMany({
          where: { vehicle_id: vehicleId, deleted_at: null },
          skip,
          take,
          include: {
            driver: { select: { id: true, full_name: true } },
            client: { select: { id: true, business_name: true } },
            created_by: { select: { id: true, name: true } },
            fuelLogs: { orderBy: { created_at: 'desc' } },
          },
          orderBy: { scheduled_date: 'desc' },
        }),
        this.prisma.trip.count({
          where: { vehicle_id: vehicleId, deleted_at: null },
        }),
      ]);

      return this.createSuccessResponse(
        { trips, total, page, limit },
        'Vehicle trips retrieved successfully'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error retrieving vehicle trips';
      return this.createErrorResponse(message);
    }
  }

  async getTripsByStatus(status: string, page: number = 1, limit: number = 10): Promise<ServiceResponse<any>> {
    try {
      if (!status) {
        return this.createErrorResponse('Status is required');
      }

      const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return this.createErrorResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const { skip, take } = this.calculatePagination(page, limit);

      const [trips, total] = await Promise.all([
        this.prisma.trip.findMany({
          where: { status, deleted_at: null },
          skip,
          take,
          include: {
            driver: { select: { id: true, full_name: true } },
            vehicle: { select: { id: true, plate: true } },
            client: { select: { id: true, business_name: true } },
            created_by: { select: { id: true, name: true } },
            fuelLogs: { orderBy: { created_at: 'desc' } },
          },
          orderBy: { scheduled_date: 'desc' },
        }),
        this.prisma.trip.count({
          where: { status, deleted_at: null },
        }),
      ]);

      return this.createSuccessResponse(
        { trips, total, page, limit },
        'Trips retrieved successfully'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error retrieving trips by status';
      return this.createErrorResponse(message);
    }
  }

  /**
   * Motor de liquidaciones - Calcula el preview de liquidación para un conductor
   * Utiliza agregación de Prisma para sumar en base de datos, sin bucles en memoria
   */
  async getSettlementPreview(
    driverId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ServiceResponse<SettlementPreview>> {
    try {
      // Validar parámetros
      if (!driverId || !startDate || !endDate) {
        return this.createErrorResponse('Missing required parameters: driverId, startDate, endDate') as any;
      }

      if (startDate > endDate) {
        return this.createErrorResponse('Start date must be before end date') as any;
      }

      // Obtener todos los viajes del rango (para retornar detalles)
      const trips = await this.prisma.trip.findMany({
        where: {
          driver_id: driverId,
          scheduled_date: {
            gte: startDate,
            lte: endDate,
          },
          deleted_at: null,
        },
        select: {
          id: true,
          reference_number: true,
          origin: true,
          destination: true,
          distance_km: true,
          estimated_cost: true,
          status: true,
          scheduled_date: true,
          actual_start_date: true,
          actual_end_date: true,
          load_description: true,
          load_weight_tons: true,
          fuelLogs: { orderBy: { created_at: 'desc' } },
        },
        orderBy: {
          scheduled_date: 'asc',
        },
      });

      // Usar agregación de Prisma para calcular sumas directamente en BD
      // NOTA: Prisma NO tiene función aggregate para sum en campos específicos de múltiples registros
      // Usamos groupBy y agregación manual, pero la consulta ocurre en BD, no en memoria
      const aggregation = await this.prisma.trip.aggregate({
        where: {
          driver_id: driverId,
          scheduled_date: {
            gte: startDate,
            lte: endDate,
          },
          deleted_at: null,
        },
        _sum: {
          distance_km: true,
          estimated_cost: true,
        },
        _count: true,
      });

      // Calcular viaticos y flat pay basado en la política de la empresa
      // estimated_cost se usa como base para cálculos
      const totalEstimatedCost = aggregation._sum.estimated_cost || 0;
      const totalDistanceKm = aggregation._sum.distance_km || 0;

      // Política de liquidación (configurable)
      // Viaticos: 10% del costo estimado
      // Flat pay del conductor: 80% del costo estimado
      const totalViaticosAmount = parseFloat((totalEstimatedCost * 0.1).toFixed(2));
      const totalDriverFlatPay = parseFloat((totalEstimatedCost * 0.8).toFixed(2));

      const settlement: SettlementPreview = {
        driver_id: driverId,
        total_estimated_km: totalDistanceKm || 0,
        total_viaticos_amount: totalViaticosAmount,
        total_driver_flat_pay: totalDriverFlatPay,
        trip_count: aggregation._count,
        trips: trips as any,
      };

      return this.createSuccessResponse(
        settlement,
        `Settlement preview calculated for ${aggregation._count} trips`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error calculating settlement preview';
      return this.createErrorResponse(message) as any;
    }
  }
}

export default TripService;
