import { BaseService } from './baseService';
import { ServiceResponse } from '../types/index';
import { Prisma } from '@prisma/client';

interface CreateVehicleInput {
  plate: string;
  vehicle_type: string;
  brand?: string;
  model?: string;
  year?: number;
  capacity_tons?: number;
  capacity_m3?: number;
  is_owned?: boolean;
  truck_rto_exp_date?: Date;
  trailer_plate?: string;
  trailer_rto_exp_date?: Date;
  truck_insurance_exp_date?: Date;
  trailer_insurance_exp_date?: Date;
  registration_number?: string;
  created_by_id: string;
}

interface UpdateVehicleInput {
  plate?: string;
  vehicle_type?: string;
  brand?: string;
  model?: string;
  year?: number;
  capacity_tons?: number;
  capacity_m3?: number;
  is_owned?: boolean;
  is_active?: boolean;
  truck_rto_exp_date?: Date;
  trailer_plate?: string;
  trailer_rto_exp_date?: Date;
  truck_insurance_exp_date?: Date;
  trailer_insurance_exp_date?: Date;
  registration_number?: string;
}

/**
 * VehicleService
 * Contiene la lógica de negocio para vehículos
 */
export class VehicleService extends BaseService {
  async createVehicle(vehicleData: CreateVehicleInput): Promise<ServiceResponse<any>> {
    try {
      if (!vehicleData.plate || !vehicleData.vehicle_type || !vehicleData.created_by_id) {
        return this.createErrorResponse('Missing required fields: plate, vehicle_type, created_by_id');
      }

      // Verificar si ya existe un vehículo con la misma patente
      const existingVehicle = await this.prisma.vehicle.findUnique({
        where: { plate: vehicleData.plate },
      });

      if (existingVehicle && !existingVehicle.deleted_at) {
        return this.createErrorResponse('Vehicle with this plate already exists');
      }

      const vehicle = await this.prisma.vehicle.create({
        data: {
          plate: vehicleData.plate,
          vehicle_type: vehicleData.vehicle_type,
          brand: vehicleData.brand,
          model: vehicleData.model,
          year: vehicleData.year,
          capacity_tons: vehicleData.capacity_tons,
          capacity_m3: vehicleData.capacity_m3,
          is_owned: vehicleData.is_owned ?? true,
          truck_rto_exp_date: vehicleData.truck_rto_exp_date,
          trailer_plate: vehicleData.trailer_plate,
          trailer_rto_exp_date: vehicleData.trailer_rto_exp_date,
          truck_insurance_exp_date: vehicleData.truck_insurance_exp_date,
          trailer_insurance_exp_date: vehicleData.trailer_insurance_exp_date,
          registration_number: vehicleData.registration_number,
          is_active: true,
        },
      });

      return this.createSuccessResponse(vehicle, 'Vehicle created successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error creating vehicle';
      return this.createErrorResponse(message);
    }
  }

  async getVehicles(page: number = 1, limit: number = 10): Promise<ServiceResponse<any>> {
    try {
      const { skip, take } = this.calculatePagination(page, limit);

      const [vehicles, total] = await Promise.all([
        this.prisma.vehicle.findMany({
          where: { deleted_at: null },
          skip,
          take,
          orderBy: { created_at: 'desc' },
        }),
        this.prisma.vehicle.count({
          where: { deleted_at: null },
        }),
      ]);

      return this.createSuccessResponse(
        { vehicles, total, page, limit },
        'Vehicles retrieved successfully'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error retrieving vehicles';
      return this.createErrorResponse(message);
    }
  }

  async getVehicleById(id: string): Promise<ServiceResponse<any>> {
    try {
      if (!id) {
        return this.createErrorResponse('Vehicle ID is required');
      }

      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id },
        include: {
          drivers: true,
          trips: { take: 5, orderBy: { created_at: 'desc' } },
          fuelLogs: { take: 5, orderBy: { created_at: 'desc' } },
        },
      });

      if (!vehicle || vehicle.deleted_at) {
        return this.createErrorResponse('Vehicle not found');
      }

      return this.createSuccessResponse(vehicle, 'Vehicle retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error retrieving vehicle';
      return this.createErrorResponse(message);
    }
  }

  async updateVehicle(id: string, vehicleData: UpdateVehicleInput): Promise<ServiceResponse<any>> {
    try {
      if (!id) {
        return this.createErrorResponse('Vehicle ID is required');
      }

      // Verificar que el vehículo existe
      const existingVehicle = await this.prisma.vehicle.findUnique({
        where: { id },
      });

      if (!existingVehicle || existingVehicle.deleted_at) {
        return this.createErrorResponse('Vehicle not found');
      }

      // Si se intenta cambiar la patente, verificar que no exista otra
      if (vehicleData.plate && vehicleData.plate !== existingVehicle.plate) {
        const duplicateVehicle = await this.prisma.vehicle.findUnique({
          where: { plate: vehicleData.plate },
        });
        if (duplicateVehicle && !duplicateVehicle.deleted_at) {
          return this.createErrorResponse('Another vehicle with this plate already exists');
        }
      }

      const vehicle = await this.prisma.vehicle.update({
        where: { id },
        data: {
          ...(vehicleData.plate && { plate: vehicleData.plate }),
          ...(vehicleData.vehicle_type && { vehicle_type: vehicleData.vehicle_type }),
          ...(vehicleData.brand !== undefined && { brand: vehicleData.brand }),
          ...(vehicleData.model !== undefined && { model: vehicleData.model }),
          ...(vehicleData.year !== undefined && { year: vehicleData.year }),
          ...(vehicleData.capacity_tons !== undefined && { capacity_tons: vehicleData.capacity_tons }),
          ...(vehicleData.capacity_m3 !== undefined && { capacity_m3: vehicleData.capacity_m3 }),
          ...(vehicleData.is_owned !== undefined && { is_owned: vehicleData.is_owned }),
          ...(vehicleData.is_active !== undefined && { is_active: vehicleData.is_active }),
          ...(vehicleData.truck_rto_exp_date !== undefined && { truck_rto_exp_date: vehicleData.truck_rto_exp_date }),
          ...(vehicleData.trailer_plate !== undefined && { trailer_plate: vehicleData.trailer_plate }),
          ...(vehicleData.trailer_rto_exp_date !== undefined && { trailer_rto_exp_date: vehicleData.trailer_rto_exp_date }),
          ...(vehicleData.truck_insurance_exp_date !== undefined && { truck_insurance_exp_date: vehicleData.truck_insurance_exp_date }),
          ...(vehicleData.trailer_insurance_exp_date !== undefined && { trailer_insurance_exp_date: vehicleData.trailer_insurance_exp_date }),
          ...(vehicleData.registration_number !== undefined && { registration_number: vehicleData.registration_number }),
        },
      });

      return this.createSuccessResponse(vehicle, 'Vehicle updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error updating vehicle';
      return this.createErrorResponse(message);
    }
  }

  async deleteVehicle(id: string): Promise<ServiceResponse<any>> {
    try {
      if (!id) {
        return this.createErrorResponse('Vehicle ID is required');
      }

      // Verificar que el vehículo existe
      const existingVehicle = await this.prisma.vehicle.findUnique({
        where: { id },
      });

      if (!existingVehicle || existingVehicle.deleted_at) {
        return this.createErrorResponse('Vehicle not found');
      }

      // Soft delete: marcar como eliminado
      const vehicle = await this.prisma.vehicle.update({
        where: { id },
        data: { deleted_at: new Date() },
      });

      return this.createSuccessResponse(vehicle, 'Vehicle deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error deleting vehicle';
      return this.createErrorResponse(message);
    }
  }

  async getVehicleDrivers(vehicleId: string): Promise<ServiceResponse<any>> {
    try {
      if (!vehicleId) {
        return this.createErrorResponse('Vehicle ID is required');
      }

      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
        include: {
          drivers: {
            where: { driver: { deleted_at: null } },
            include: {
              driver: {
                select: {
                  id: true,
                  full_name: true,
                  type: true,
                  license_number: true,
                  is_active: true,
                },
              },
            },
          },
        },
      });

      if (!vehicle || vehicle.deleted_at) {
        return this.createErrorResponse('Vehicle not found');
      }

      const drivers = vehicle.drivers.map((dv) => dv.driver).filter(Boolean);

      return this.createSuccessResponse(drivers, 'Vehicle drivers retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error retrieving vehicle drivers';
      return this.createErrorResponse(message);
    }
  }

  async updateRTOExpiration(vehicleId: string, newExpiryDate: Date): Promise<ServiceResponse<any>> {
    try {
      if (!vehicleId || !newExpiryDate) {
        return this.createErrorResponse('Vehicle ID and new expiry date are required');
      }

      if (!(newExpiryDate instanceof Date) || isNaN(newExpiryDate.getTime())) {
        return this.createErrorResponse('Invalid date format');
      }

      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });

      if (!vehicle || vehicle.deleted_at) {
        return this.createErrorResponse('Vehicle not found');
      }

      const updatedVehicle = await this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          truck_rto_exp_date: newExpiryDate,
        },
      });

      return this.createSuccessResponse(updatedVehicle, 'RTO expiration date updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error updating RTO expiration';
      return this.createErrorResponse(message);
    }
  }

  async checkRTOExpiration(vehicleId: string): Promise<ServiceResponse<boolean>> {
    try {
      if (!vehicleId) {
        return this.createErrorResponse('Vehicle ID is required') as any;
      }

      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });

      if (!vehicle || vehicle.deleted_at) {
        return this.createErrorResponse('Vehicle not found') as any;
      }

      const now = new Date();
      const isExpired = vehicle.truck_rto_exp_date && vehicle.truck_rto_exp_date < now;

      return this.createSuccessResponse(!!isExpired, 'RTO expiration status retrieved');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error checking RTO expiration';
      return this.createErrorResponse(message) as any;
    }
  }

  async getActiveVehicles(): Promise<ServiceResponse<any>> {
    try {
      const vehicles = await this.prisma.vehicle.findMany({
        where: {
          is_active: true,
          deleted_at: null,
        },
        orderBy: { created_at: 'desc' },
      });

      return this.createSuccessResponse(vehicles, 'Active vehicles retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error retrieving active vehicles';
      return this.createErrorResponse(message);
    }
  }
}

export default VehicleService;
