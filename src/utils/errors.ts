// Clases de errores personalizadas para manejo de errores centralizado

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(public errors: Record<string, string[]>) {
    super(400, 'Error de validación');
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso no encontrado') {
    super(404, message);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'No autorizado') {
    super(401, message);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Acceso denegado') {
    super(403, message);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflicto de recursos') {
    super(409, message);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Error en la base de datos') {
    super(500, message);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

// Función para formatear errores de Zod
export function formatZodError(error: any): Record<string, string[]> {
  const formattedErrors: Record<string, string[]> = {};

  if (error.issues) {
    error.issues.forEach((issue: any) => {
      const path = issue.path.join('.');
      if (!formattedErrors[path]) {
        formattedErrors[path] = [];
      }
      formattedErrors[path].push(issue.message);
    });
  }

  return formattedErrors;
}
