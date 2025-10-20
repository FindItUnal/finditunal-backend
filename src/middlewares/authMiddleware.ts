import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  //Obtener el token desde la cookie
  const token = req.cookies?.accessToken;

  if (!token) {
    res.status(401).json({ message: 'Token no proporcionado' });
    return;
  }

  jwt.verify(token, JWT_CONFIG.ACCESS_TOKEN_SECRET, (err: any, decoded: any) => {
    if (err) {
      res.status(401).json({ message: 'Token inválido' });
      return;
    }

    // Guardar los datos del usuario en `req.body.user`
    req.body.user = decoded;

    // Si la URL tiene un user_id, validarlo
    if (req.params.user_id) {
      const userIdFromUrl = parseInt(req.params.user_id, 10);

      if (!decoded || userIdFromUrl !== parseInt(decoded.user_id, 10)) {
        res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
        return;
      }
    }

    next();
  });
};
