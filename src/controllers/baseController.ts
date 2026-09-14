import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse, PaginatedResponse } from '../types/index';

/**
 * Clase base para todos los controladores
 * Proporciona métodos comunes de respuesta y manejo
 */
export class BaseController {
  /**
   * Envía respuesta exitosa
   */
  protected sendSuccess<T>(
    res: Response,
    data: T,
    message: string = 'Operation successful',
    statusCode: number = 200,
    req?: AuthenticatedRequest
  ): void {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      path: req?.path || '/',
    };
    res.status(statusCode).json(response);
  }

  /**
   * Envía respuesta paginada
   */
  protected sendPaginatedSuccess<T>(
    res: Response,
    data: T[],
    total: number,
    page: number,
    limit: number,
    message: string = 'Operation successful',
    statusCode: number = 200,
    req?: AuthenticatedRequest
  ): void {
    const totalPages = Math.ceil(total / limit);
    const response: ApiResponse<PaginatedResponse<T>> = {
      success: true,
      message,
      data: {
        data,
        total,
        page,
        limit,
        totalPages,
      },
      timestamp: new Date().toISOString(),
      path: req?.path || '/',
    };
    res.status(statusCode).json(response);
  }

  /**
   * Envía respuesta de error
   */
  protected sendError(
    res: Response,
    message: string,
    statusCode: number = 400,
    errors?: Record<string, string[]>,
    req?: AuthenticatedRequest
  ): void {
    res.status(statusCode).json({
      success: false,
      message,
      errors,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req?.path || '/',
    });
  }

  /**
   * Obtiene parámetros de paginación de la request
   */
  protected getPaginationParams(req: AuthenticatedRequest): { page: number; limit: number; skip: number } {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }
}

export default BaseController;

