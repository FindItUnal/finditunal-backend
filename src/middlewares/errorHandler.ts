import { Request, Response, NextFunction } from 'express';
import { AppError, formatZodError } from '../utils/errors';
import { sendError } from '../utils/responseHandler';

// Middleware para manejo centralizado de errores
export const errorHandler = (err: Error | AppError, req: Request, res: Response, next: NextFunction): void => {
  // Mark params as used to satisfy TS noUnusedParameters
  void req;
  void next;
  // Si es un error de Zod, formatearlo
  if (err.name === 'ZodError') {
    const formattedErrors = formatZodError(err);
    res.status(400).json({
      message: 'Error de validación',
      errors: formattedErrors,
    });
    return;
  }

  // Si es un AppError, usar el handler de errores
  if (err instanceof AppError) {
    sendError(res, err);
    return;
  }

  // Error no manejado
  console.error('Error no manejado:', err);
  sendError(res, err);
};
