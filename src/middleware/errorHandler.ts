import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, AppError, ErrorHandler, ErrorResponse } from '../types/index';

/**
 * Middleware global para manejo de errores
 * Debe ser el último middleware registrado
 */
export const errorHandler: ErrorHandler = (err, req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  console.error('Error:', err);

  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: Record<string, string[]> | undefined;

  // Handle AppError (custom errors)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  }
  // Handle Prisma Errors
  else if (err.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Invalid data provided';
  }   else if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    switch (prismaErr.code) {
      case 'P2002':
        statusCode = 409;
        message = `Unique constraint failed on field: ${prismaErr.meta?.target}`;
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found';
        break;
      case 'P2014':
        statusCode = 400;
        message = 'Required relation violation';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Foreign key constraint failed';
        break;
      default:
        statusCode = 400;
        message = 'Database error occurred';
    }
  }
  // Handle standard Error
  else if (err instanceof Error) {
    if (err.message.includes('CORS')) {
      statusCode = 403;
      message = err.message;
    } else {
      statusCode = 500;
      message = err.message || 'Internal Server Error';
    }
  }

  const errorResponse: ErrorResponse = {
    success: false,
    message,
    errors,
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  // Log error details in development
  if (process.env.NODE_ENV === 'development') {
    console.error({
      statusCode,
      message,
      errors,
      stack: err instanceof Error ? err.stack : undefined,
    });
  }

  res.status(statusCode).json(errorResponse);
};

export default errorHandler;

