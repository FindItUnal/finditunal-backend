import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { BOT_AUTH, JWT_CONFIG } from '../config';

interface DecodedToken extends JwtPayload {
  user_id: string;
  role?: 'user' | 'admin';
}

const assignUserPayload = (req: Request, payload: { user_id: string; role?: 'user' | 'admin' }): void => {
  try {
    req.body.user = payload;
  } catch (error) {
    // Ignorar si el body no es escribible (p.ej. cuando es un stream)
  }
  (req as any).user = payload;
};

const validateUserIdParam = (req: Request, res: Response): boolean => {
  if (req.params.user_id && req.body.user?.user_id && req.params.user_id !== req.body.user.user_id) {
    res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
    return false;
  }
  return true;
};

const getBearerToken = (req: Request): string | undefined => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.substring(7);
  }
  return undefined;
};

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const bearerToken = getBearerToken(req);

  // 1. Soportar token fijo (bot n8n) sin expiración
  if (BOT_AUTH.ACCESS_TOKEN && bearerToken === BOT_AUTH.ACCESS_TOKEN) {
    if (!BOT_AUTH.USER_ID) {
      res.status(500).json({ message: 'Configuración incompleta: defina BOT_USER_ID' });
      return;
    }

    assignUserPayload(req, { user_id: BOT_AUTH.USER_ID, role: BOT_AUTH.ROLE });

    if (!validateUserIdParam(req, res)) {
      return;
    }

    next();
    return;
  }

  // 2. Tokens JWT normales (cookie o header Bearer)
  const token = req.cookies?.accessToken || bearerToken;

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
      assignUserPayload(req, { user_id: decodedToken.user_id, role: decodedToken.role });

      if (!validateUserIdParam(req, res)) {
        return;
      }

      next();
    },
  );
};
