import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, AppError } from '../types/index';
import jwt = require('jsonwebtoken');

interface DecodedToken {
  id: string;
  email: string;
  role: string;
}

/**
 * Middleware para validar que la solicitud tenga un token JWT válido
 * Verifica el token en el header Authorization: Bearer <token>
 * y guarda la información decodificada en req.user
 */
export const authenticateUser = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError(401, 'Authorization token is missing');
    }

    // Extraer el token del header (formato: "Bearer <token>")
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AppError(401, 'Invalid authorization header format');
    }

    const token = parts[1];
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
      throw new AppError(500, 'JWT_SECRET environment variable is not configured');
    }

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

    // Guardar la información decodificada en req.user
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError(401, 'Invalid or expired token');
    }
    throw new AppError(401, 'Authentication failed');
  }
};

/**
 * Middleware para verificar la API key del sistema bot y tenant
 */
export const verifySystemBot = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  if (req.headers['x-bot-api-key'] !== process.env.BOT_API_KEY) {
    throw new AppError(401, 'Invalid bot API key');
  }

  const tenantId = req.headers['x-tenant-id'];
  if (!tenantId) {
    throw new AppError(400, 'Tenant ID is required');
  }

  (req as any).tenantId = tenantId;
  next();
};

export default { authenticateUser, verifySystemBot };

