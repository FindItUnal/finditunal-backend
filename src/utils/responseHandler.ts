import { Response } from 'express';
import { AppError } from './errors';

// Función para enviar respuestas exitosas
export function sendSuccess(res: Response, data: any, statusCode: number = 200): void {
  res.status(statusCode).json(data);
}

// Función para enviar respuestas de error
export function sendError(res: Response, error: Error | AppError): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      message: error.message,
      ...(error instanceof Error && 'errors' in error ? { errors: (error as any).errors } : {}),
    });
  } else {
    console.error('Error no manejado:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
}
