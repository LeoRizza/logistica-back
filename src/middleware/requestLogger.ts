import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para registrar las solicitudes HTTP
 * Registra el método, URL, estado y tiempo de ejecución
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const method = req.method;
  const path = req.path;
  const ip = req.ip || req.socket.remoteAddress;

  // Interceptar el método res.send para registrar la respuesta
  const originalSend = res.send.bind(res);

  res.send = function (data: any) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    // Log en formato simple
    const logLevel = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';
    const timestamp = new Date().toISOString();

    console.info(
      `[${timestamp}] [${logLevel}] ${method} ${path} - Status: ${statusCode} - Duration: ${duration}ms - IP: ${ip}`
    );

    // Devolver el data al cliente
    return originalSend(data);
  };

  next();
};

export default requestLogger;

