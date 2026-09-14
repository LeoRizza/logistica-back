import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, AsyncHandler } from '../types/index';

/**
 * Wrapper para manejar errores en funciones async
 * Evita tener que usar try-catch en cada controlador
 */
export const asyncHandler = (fn: AsyncHandler) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;

