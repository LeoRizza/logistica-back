import { BaseService } from './baseService';
import { ServiceResponse, PaginatedResponse } from '../types/index';
import { Driver, DriverVehicle, Vehicle } from '@prisma/client';

interface CreateDriverInput {
  full_name: string;
  license_number: string;
  license_exp_date: Date | string;
  type?: 'PROPIO' | 'CONTRATADO';
  phone?: string;
  cuit_cuil?: string;
  user_id: string;
  is_active?: boolean;
}

interface UpdateDriverInput {
  full_name?: string;
  license_number?: string;
  license_exp_date?: Date | string;
  type?: 'PROPIO' | 'CONTRATADO';
  phone?: string;
  cuit_cuil?: string;
  is_active?: boolean;
}

/**
 * DriverService
 * Contiene la lógica de negocio para conductores
 */
export class DriverService extends BaseService {
  async createDriver(driverData: CreateDriverInput): Promise<ServiceResponse<Driver>> {
    try {
      // Validar datos requeridos
      if (!driverData.full_name || !driverData.license_number) {
        return this.createErrorResponse('Missing required fields: full_name, license_number');
      }

      // Validar que el user_id exista
      const userExists = await this.prisma.user.findUnique({
        where: { id: driverData.user_id },
      });

      if (!userExists) {
        return this.createErrorResponse('User not found');
      }

      // Validar unicidad de license_number
      const licenseExists = await this.prisma.driver.findUnique({
        where: { license_number: driverData.license_number },
      });

      if (licenseExists) {
        return this.createErrorResponse('License number already exists');
      }

      // Validar unicidad de cuit_cuil si se proporciona
      if (driverData.cuit_cuil) {
        const cuitCuilExists = await this.prisma.driver.findUnique({
          where: { cuit_cuil: driverData.cuit_cuil },
        });

        if (cuitCuilExists) {
          return this.createErrorResponse('CUIT/CUIL already exists');
        }
      }

      const driver = await this.prisma.driver.create({
        data: {
          full_name: driverData.full_name,
          license_number: driverData.license_number,
          license_exp_date: new Date(driverData.license_exp_date),
          type: driverData.type || 'CONTRATADO',
          phone: driverData.phone,
          cuit_cuil: driverData.cuit_cuil,
          user_id: driverData.user_id,
          is_active: driverData.is_active !== false,
        },
      });

      return this.createSuccessResponse(driver, 'Driver created successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to create driver: ${errorMessage}`);
    }
  }

  async getDrivers(page: number, limit: number): Promise<ServiceResponse<PaginatedResponse<Driver>>> {
    try {
      const { skip, take } = this.calculatePagination(page, limit);

      // Obtener conductores activos (sin registros eliminados)
      const [drivers, total] = await Promise.all([
        this.prisma.driver.findMany({
          where: {
            deleted_at: null,
          },
          orderBy: {
            created_at: 'desc',
          },
          skip,
          take,
        }),
        this.prisma.driver.count({
          where: {
            deleted_at: null,
          },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return this.createSuccessResponse(
        {
          data: drivers,
          total,
          page,
          limit,
          totalPages,
        },
        'Drivers retrieved successfully'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to retrieve drivers: ${errorMessage}`);
    }
  }

  async getDriverById(id: string): Promise<ServiceResponse<Driver>> {
    try {
      if (!this.isValidId(id)) {
        return this.createErrorResponse('Invalid driver ID format');
      }

      const driver = await this.prisma.driver.findUnique({
        where: { id },
        include: {
          vehicles: {
            include: {
              vehicle: true,
            },
          },
        },
      });

      if (!driver || driver.deleted_at) {
        return this.createErrorResponse('Driver not found');
      }

      return this.createSuccessResponse(driver as any, 'Driver retrieved successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to retrieve driver: ${errorMessage}`);
    }
  }

  async updateDriver(id: string, driverData: UpdateDriverInput): Promise<ServiceResponse<Driver>> {
    try {
      if (!this.isValidId(id)) {
        return this.createErrorResponse('Invalid driver ID format');
      }

      // Verificar que el conductor existe y no está eliminado
      const existingDriver = await this.prisma.driver.findUnique({
        where: { id },
      });

      if (!existingDriver || existingDriver.deleted_at) {
        return this.createErrorResponse('Driver not found');
      }

      // Validar unicidad de license_number si se está actualizando
      if (driverData.license_number && driverData.license_number !== existingDriver.license_number) {
        const licenseExists = await this.prisma.driver.findUnique({
          where: { license_number: driverData.license_number },
        });

        if (licenseExists) {
          return this.createErrorResponse('License number already exists');
        }
      }

      // Validar unicidad de cuit_cuil si se está actualizando
      if (driverData.cuit_cuil && driverData.cuit_cuil !== existingDriver.cuit_cuil) {
        const cuitCuilExists = await this.prisma.driver.findUnique({
          where: { cuit_cuil: driverData.cuit_cuil },
        });

        if (cuitCuilExists) {
          return this.createErrorResponse('CUIT/CUIL already exists');
        }
      }

      const updateData: any = {};
      
      if (driverData.full_name !== undefined) updateData.full_name = driverData.full_name;
      if (driverData.license_number !== undefined) updateData.license_number = driverData.license_number;
      if (driverData.license_exp_date !== undefined) updateData.license_exp_date = new Date(driverData.license_exp_date);
      if (driverData.type !== undefined) updateData.type = driverData.type;
      if (driverData.phone !== undefined) updateData.phone = driverData.phone;
      if (driverData.cuit_cuil !== undefined) updateData.cuit_cuil = driverData.cuit_cuil;
      if (driverData.is_active !== undefined) updateData.is_active = driverData.is_active;

      const driver = await this.prisma.driver.update({
        where: { id },
        data: updateData,
      });

      return this.createSuccessResponse(driver, 'Driver updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to update driver: ${errorMessage}`);
    }
  }

  async deleteDriver(id: string): Promise<ServiceResponse<Driver>> {
    try {
      if (!this.isValidId(id)) {
        return this.createErrorResponse('Invalid driver ID format');
      }

      // Verificar que el conductor existe y no está eliminado
      const existingDriver = await this.prisma.driver.findUnique({
        where: { id },
      });

      if (!existingDriver || existingDriver.deleted_at) {
        return this.createErrorResponse('Driver not found');
      }

      // Soft delete: actualizar deleted_at
      const driver = await this.prisma.driver.update({
        where: { id },
        data: {
          deleted_at: new Date(),
        },
      });

      return this.createSuccessResponse(driver, 'Driver deleted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to delete driver: ${errorMessage}`);
    }
  }

  async assignVehicle(driverId: string, vehicleId: string): Promise<ServiceResponse<DriverVehicle>> {
    try {
      if (!this.isValidId(driverId)) {
        return this.createErrorResponse('Invalid driver ID format');
      }

      if (!this.isValidId(vehicleId)) {
        return this.createErrorResponse('Invalid vehicle ID format');
      }

      // Verificar que el conductor existe y no está eliminado
      const driver = await this.prisma.driver.findUnique({
        where: { id: driverId },
      });

      if (!driver || driver.deleted_at) {
        return this.createErrorResponse('Driver not found');
      }

      // Verificar que el vehículo existe y no está eliminado
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });

      if (!vehicle || vehicle.deleted_at) {
        return this.createErrorResponse('Vehicle not found');
      }

      // Verificar que la asignación no existe ya
      const existingAssignment = await this.prisma.driverVehicle.findUnique({
        where: {
          driver_id_vehicle_id: {
            driver_id: driverId,
            vehicle_id: vehicleId,
          },
        },
      });

      if (existingAssignment) {
        return this.createErrorResponse('Vehicle is already assigned to this driver');
      }

      const assignment = await this.prisma.driverVehicle.create({
        data: {
          driver_id: driverId,
          vehicle_id: vehicleId,
        },
      });

      return this.createSuccessResponse(assignment, 'Vehicle assigned to driver successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to assign vehicle: ${errorMessage}`);
    }
  }

  async getDriverVehicles(driverId: string): Promise<ServiceResponse<(DriverVehicle & { vehicle: Vehicle })[]>> {
    try {
      if (!this.isValidId(driverId)) {
        return this.createErrorResponse('Invalid driver ID format');
      }

      // Verificar que el conductor existe y no está eliminado
      const driver = await this.prisma.driver.findUnique({
        where: { id: driverId },
      });

      if (!driver || driver.deleted_at) {
        return this.createErrorResponse('Driver not found');
      }

      const vehicles = await this.prisma.driverVehicle.findMany({
        where: {
          driver_id: driverId,
        },
        include: {
          vehicle: true,
        },
      });

      return this.createSuccessResponse(vehicles, 'Driver vehicles retrieved successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to retrieve driver vehicles: ${errorMessage}`);
    }
  }

  async removeVehicle(driverId: string, vehicleId: string): Promise<ServiceResponse<DriverVehicle>> {
    try {
      if (!this.isValidId(driverId)) {
        return this.createErrorResponse('Invalid driver ID format');
      }

      if (!this.isValidId(vehicleId)) {
        return this.createErrorResponse('Invalid vehicle ID format');
      }

      // Verificar que la asignación existe
      const assignment = await this.prisma.driverVehicle.findUnique({
        where: {
          driver_id_vehicle_id: {
            driver_id: driverId,
            vehicle_id: vehicleId,
          },
        },
      });

      if (!assignment) {
        return this.createErrorResponse('Vehicle is not assigned to this driver');
      }

      const removedAssignment = await this.prisma.driverVehicle.delete({
        where: {
          id: assignment.id,
        },
      });

      return this.createSuccessResponse(removedAssignment, 'Vehicle removed from driver successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to remove vehicle: ${errorMessage}`);
    }
  }

  async checkLicenseExpiration(driverId: string): Promise<ServiceResponse<boolean>> {
    try {
      if (!this.isValidId(driverId)) {
        return this.createErrorResponse('Invalid driver ID format');
      }

      const driver = await this.prisma.driver.findUnique({
        where: { id: driverId },
      });

      if (!driver || driver.deleted_at) {
        return this.createErrorResponse('Driver not found');
      }

      const isExpired = new Date() > driver.license_exp_date;
      return this.createSuccessResponse(isExpired, 'License expiration status checked');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to check license expiration: ${errorMessage}`);
    }
  }
}

export default DriverService;

