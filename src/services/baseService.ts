import { prisma } from '../config/database';
import { ServiceResponse } from '../types/index';

/**
 * Clase base para todos los servicios
 * Proporciona métodos comunes para interactuar con Prisma
 */
export class BaseService {
  protected prisma = prisma;

  /**
   * Crea una respuesta exitosa de servicio
   */
  protected createSuccessResponse<T>(data: T, message: string = 'Operation successful'): ServiceResponse<T> {
    return {
      success: true,
      message,
      data,
    };
  }

  /**
   * Crea una respuesta de error de servicio
   */
  protected createErrorResponse<T = null>(message: string): ServiceResponse<T> {
    return {
      success: false,
      message,
      error: message,
    } as ServiceResponse<T>;
  }

  /**
   * Calcula parámetros de paginación
   */
  protected calculatePagination(page: number, limit: number): { skip: number; take: number } {
    const skip = (page - 1) * limit;
    return { skip, take: limit };
  }

  /**
   * Valida que el ID sea válido
   */
  protected isValidId(id: string): boolean {
    // Validar CUID format
    return /^[a-z0-9]{25}$/.test(id);
  }
}

export default BaseService;

