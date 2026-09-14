import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types/index';

/**
 * Envía una respuesta exitosa
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200,
  path: string = '/'
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    path,
  };
  return res.status(statusCode).json(response);
};

/**
 * Envía una respuesta paginada exitosa
 */
export const sendPaginatedSuccess = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message: string = 'Success',
  statusCode: number = 200,
  path: string = '/'
): Response => {
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
    path,
  };
  return res.status(statusCode).json(response);
};

/**
 * Envía una respuesta de error
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 400,
  errors?: Record<string, string[]>,
  path: string = '/'
): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    statusCode,
    timestamp: new Date().toISOString(),
    path,
  });
};

export default {
  sendSuccess,
  sendPaginatedSuccess,
  sendError,
};

