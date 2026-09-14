import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index';
import { BaseController } from './baseController';
import { ClientService } from '../services/clientService';

/**
 * ClientController
 * Maneja las operaciones relacionadas con clientes
 */
export class ClientController extends BaseController {
  private clientService: ClientService;

  constructor() {
    super();
    this.clientService = new ClientService();
  }

  async createClient(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { business_name, contact_email, contact_phone, contact_name, city } = req.body;

      // Validar campos requeridos
      if (!business_name || !business_name.trim()) {
        this.sendError(res, 'Missing required field: business_name', 400, undefined, req);
        return;
      }

      // Validar que el usuario autenticado exista
      const userId = req.user?.id;
      if (!userId) {
        this.sendError(res, 'User not authenticated', 401, undefined, req);
        return;
      }

      const result = await this.clientService.createClient({
        business_name: business_name.trim(),
        contact_email: contact_email?.trim(),
        contact_phone: contact_phone?.trim(),
        contact_name: contact_name?.trim(),
        city: city?.trim(),
        created_by_id: userId,
      });

      if (result.success && result.data) {
        this.sendSuccess(res, result.data, result.message, 201, req);
      } else {
        this.sendError(res, result.message || 'Failed to create client', 400, undefined, req);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      this.sendError(res, `Error creating client: ${message}`, 500, undefined, req);
    }
  }

  async getClients(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page, limit } = this.getPaginationParams(req);
      const result = await this.clientService.getClients(page, limit);

      if (result.success && result.data) {
        const { data, total, page: currentPage, limit: currentLimit, totalPages } = result.data;
        this.sendPaginatedSuccess(res, data, total, currentPage, currentLimit, result.message, 200, req);
      } else {
        this.sendError(res, result.message || 'Failed to retrieve clients', 500, undefined, req);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      this.sendError(res, `Error retrieving clients: ${message}`, 500, undefined, req);
    }
  }

  async getClientById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        this.sendError(res, 'Client ID is required', 400, undefined, req);
        return;
      }

      const result = await this.clientService.getClientById(id);

      if (result.success && result.data) {
        this.sendSuccess(res, result.data, result.message, 200, req);
      } else {
        this.sendError(res, result.message || 'Client not found', 404, undefined, req);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      this.sendError(res, `Error retrieving client: ${message}`, 500, undefined, req);
    }
  }

  async updateClient(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        this.sendError(res, 'Client ID is required', 400, undefined, req);
        return;
      }

      if (Object.keys(updateData).length === 0) {
        this.sendError(res, 'No fields to update', 400, undefined, req);
        return;
      }

      // Sanitize input
      const sanitizedData: any = {};
      if (updateData.business_name !== undefined) sanitizedData.business_name = updateData.business_name?.trim();
      if (updateData.contact_email !== undefined) sanitizedData.contact_email = updateData.contact_email?.trim();
      if (updateData.contact_phone !== undefined) sanitizedData.contact_phone = updateData.contact_phone?.trim();
      if (updateData.contact_name !== undefined) sanitizedData.contact_name = updateData.contact_name?.trim();
      if (updateData.city !== undefined) sanitizedData.city = updateData.city?.trim();
      if (updateData.extra_data !== undefined) sanitizedData.extra_data = updateData.extra_data;

      const result = await this.clientService.updateClient(id, sanitizedData);

      if (result.success && result.data) {
        this.sendSuccess(res, result.data, result.message, 200, req);
      } else {
        this.sendError(res, result.message || 'Failed to update client', 400, undefined, req);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      this.sendError(res, `Error updating client: ${message}`, 500, undefined, req);
    }
  }

  async deleteClient(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        this.sendError(res, 'Client ID is required', 400, undefined, req);
        return;
      }

      const result = await this.clientService.deleteClient(id);

      if (result.success && result.data) {
        this.sendSuccess(res, result.data, result.message, 200, req);
      } else {
        this.sendError(res, result.message || 'Failed to delete client', 400, undefined, req);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      this.sendError(res, `Error deleting client: ${message}`, 500, undefined, req);
    }
  }

  async searchClients(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        this.sendError(res, 'Search query parameter "q" is required', 400, undefined, req);
        return;
      }

      const result = await this.clientService.searchClients(q);

      if (result.success && result.data) {
        this.sendSuccess(res, result.data, result.message, 200, req);
      } else {
        this.sendError(res, result.message || 'Failed to search clients', 400, undefined, req);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      this.sendError(res, `Error searching clients: ${message}`, 500, undefined, req);
    }
  }
}

export default ClientController;
