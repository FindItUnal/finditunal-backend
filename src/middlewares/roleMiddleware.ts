import { Request, Response, NextFunction } from 'express';

export const authorizeAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const role = (req as any).user?.role;

  if (role !== 'admin') {
    res.status(403).json({ message: 'Acceso denegado' });
    return;
  }

  next();
};
