import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError, formatZodError } from '../utils/errors';

// Middleware para validar datos con Zod
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = formatZodError(result.error);
      const validationError = new ValidationError(errors);
      res.status(400).json({
        message: validationError.message,
        errors: errors,
      });
      return;
    }

    req.body = result.data;
    next();
  };
};

// Middleware para validar parámetros de URL
export const validateParams = (schema: ZodSchema, paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params[paramName]);

    if (!result.success) {
      const errors = formatZodError(result.error);
      res.status(400).json({
        message: 'Parámetro inválido',
        errors: errors,
      });
      return;
    }

    req.params[paramName] = result.data;
    next();
  };
};
