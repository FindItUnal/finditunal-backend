import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_CONFIG } from '../config';

interface DecodedToken extends JwtPayload {
  user_id: number;
  role?: 'user' | 'admin';
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  // Obtener el token desde la cookie
  const token = req.cookies?.accessToken;

  if (!token) {
    res.status(401).json({ message: 'Token no proporcionado' });
    return;
  }

  jwt.verify(
    token,
    JWT_CONFIG.ACCESS_TOKEN_SECRET,
    (err: jwt.VerifyErrors | null, decoded: string | JwtPayload | undefined) => {
      if (err || !decoded) {
        res.status(401).json({ message: 'Token inválido' });
        return;
      }

      const decodedToken = decoded as DecodedToken;

      // Guardar los datos del usuario en `req.body.user`
      req.body.user = {
        user_id: decodedToken.user_id,
        role: decodedToken.role,
      };

      // Si la URL tiene un user_id, validarlo
      if (req.params.user_id) {
        const userIdFromUrl = parseInt(req.params.user_id, 10);

        if (isNaN(userIdFromUrl) || decodedToken.user_id !== userIdFromUrl) {
          res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
          return;
        }
      }

      next();
    },
  );
};
