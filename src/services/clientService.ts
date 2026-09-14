import { BaseService } from './baseService';
import { ServiceResponse, PaginatedResponse } from '../types/index';
import { Client, Prisma } from '@prisma/client';

interface CreateClientInput {
  business_name: string;
  contact_email?: string;
  contact_phone?: string;
  contact_name?: string;
  city?: string;
  extra_data?: Record<string, any>;
  created_by_id: string;
}

interface UpdateClientInput {
  business_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_name?: string;
  city?: string;
  extra_data?: Record<string, any>;
}

/**
 * ClientService
 * Contiene la lógica de negocio para clientes
 */
export class ClientService extends BaseService {
  async createClient(clientData: CreateClientInput): Promise<ServiceResponse<Client>> {
    try {
      // Validar datos requeridos
      if (!clientData.business_name || !clientData.business_name.trim()) {
        return this.createErrorResponse('Missing required field: business_name');
      }

      // Validar que el user_id exista
      const userExists = await this.prisma.user.findUnique({
        where: { id: clientData.created_by_id },
      });

      if (!userExists) {
        return this.createErrorResponse('User not found');
      }

      // Validar unicidad de business_name (case-insensitive)
      const businessNameExists = await this.prisma.client.findFirst({
        where: {
          business_name: {
            equals: clientData.business_name.trim(),
          },
          deleted_at: null,
        },
      });

      if (businessNameExists) {
        return this.createErrorResponse('A client with this business name already exists');
      }

      const client = await this.prisma.client.create({
        data: {
          business_name: clientData.business_name.trim(),
          contact_email: clientData.contact_email?.trim(),
          contact_phone: clientData.contact_phone?.trim(),
          contact_name: clientData.contact_name?.trim(),
          city: clientData.city?.trim(),
          extra_data: clientData.extra_data || Prisma.JsonNull,
          created_by_id: clientData.created_by_id,
        },
      });

      return this.createSuccessResponse(client, 'Client created successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to create client: ${errorMessage}`);
    }
  }

  async getClients(page: number, limit: number): Promise<ServiceResponse<PaginatedResponse<Client>>> {
    try {
      const { skip, take } = this.calculatePagination(page, limit);

      // Obtener clientes activos (sin registros eliminados)
      const [clients, total] = await Promise.all([
        this.prisma.client.findMany({
          where: {
            deleted_at: null,
          },
          orderBy: {
            created_at: 'desc',
          },
          skip,
          take,
          include: {
            created_by: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        this.prisma.client.count({
          where: {
            deleted_at: null,
          },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return this.createSuccessResponse(
        {
          data: clients as any,
          total,
          page,
          limit,
          totalPages,
        },
        'Clients retrieved successfully'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to retrieve clients: ${errorMessage}`);
    }
  }

  async getClientById(id: string): Promise<ServiceResponse<Client>> {
    try {
      if (!this.isValidId(id)) {
        return this.createErrorResponse('Invalid client ID format');
      }

      const client = await this.prisma.client.findUnique({
        where: { id },
        include: {
          created_by: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!client || client.deleted_at) {
        return this.createErrorResponse('Client not found');
      }

      return this.createSuccessResponse(client as any, 'Client retrieved successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to retrieve client: ${errorMessage}`);
    }
  }

  async updateClient(id: string, clientData: UpdateClientInput): Promise<ServiceResponse<Client>> {
    try {
      if (!this.isValidId(id)) {
        return this.createErrorResponse('Invalid client ID format');
      }

      // Verificar que el cliente existe y no está eliminado
      const existingClient = await this.prisma.client.findUnique({
        where: { id },
      });

      if (!existingClient || existingClient.deleted_at) {
        return this.createErrorResponse('Client not found');
      }

      // Validar unicidad de business_name si se está actualizando
      if (clientData.business_name && clientData.business_name.trim() !== existingClient.business_name) {
        const businessNameExists = await this.prisma.client.findFirst({
          where: {
            business_name: {
              equals: clientData.business_name.trim(),
            },
            id: {
              not: id,
            },
            deleted_at: null,
          },
        });

        if (businessNameExists) {
          return this.createErrorResponse('A client with this business name already exists');
        }
      }

      const updateData: any = {};

      if (clientData.business_name !== undefined) updateData.business_name = clientData.business_name.trim();
      if (clientData.contact_email !== undefined) updateData.contact_email = clientData.contact_email?.trim() || null;
      if (clientData.contact_phone !== undefined) updateData.contact_phone = clientData.contact_phone?.trim() || null;
      if (clientData.contact_name !== undefined) updateData.contact_name = clientData.contact_name?.trim() || null;
      if (clientData.city !== undefined) updateData.city = clientData.city?.trim() || null;
      if (clientData.extra_data !== undefined) updateData.extra_data = clientData.extra_data || Prisma.JsonNull;

      const client = await this.prisma.client.update({
        where: { id },
        data: updateData,
        include: {
          created_by: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return this.createSuccessResponse(client as any, 'Client updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to update client: ${errorMessage}`);
    }
  }

  async deleteClient(id: string): Promise<ServiceResponse<Client>> {
    try {
      if (!this.isValidId(id)) {
        return this.createErrorResponse('Invalid client ID format');
      }

      // Verificar que el cliente existe y no está eliminado
      const existingClient = await this.prisma.client.findUnique({
        where: { id },
      });

      if (!existingClient || existingClient.deleted_at) {
        return this.createErrorResponse('Client not found');
      }

      // Soft delete: actualizar deleted_at
      const client = await this.prisma.client.update({
        where: { id },
        data: {
          deleted_at: new Date(),
        },
      });

      return this.createSuccessResponse(client, 'Client deleted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to delete client: ${errorMessage}`);
    }
  }

  async searchClients(query: string, limit: number = 10): Promise<ServiceResponse<Client[]>> {
    try {
      if (!query || query.trim().length < 2) {
        return this.createErrorResponse('Search query must be at least 2 characters');
      }

      const clients = await this.prisma.client.findMany({
        where: {
          AND: [
            {
              deleted_at: null,
            },
            {
              OR: [
                {
                  business_name: {
                    contains: query.trim(),
                  },
                },
                {
                  contact_email: {
                    contains: query.trim(),
                  },
                },
                {
                  contact_phone: {
                    contains: query.trim(),
                  },
                },
              ],
            },
          ],
        },
        orderBy: {
          business_name: 'asc',
        },
        take: limit,
      });

      return this.createSuccessResponse(clients, 'Clients found successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.createErrorResponse(`Failed to search clients: ${errorMessage}`);
    }
  }
}

export default ClientService;
