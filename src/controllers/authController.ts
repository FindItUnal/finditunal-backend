import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { sendSuccess } from '../utils/responseHandler';
import { AppError } from '../utils/errors';

export class AuthController {
  constructor(private authService: AuthService) {}

  // Registrar un nuevo usuario
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.authService.register(req.body);
      sendSuccess(res, { message: 'Usuario registrado exitosamente' }, 201);
    } catch (error) {
      next(error);
    }
  };

  // Iniciar sesión
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const { tokens, user } = await this.authService.login(email, password);

      // Configurar cookies
      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: true, // Necesario para sameSite: 'none'
        maxAge: 10 * 60 * 1000, // 10 minutos
        sameSite: 'none',
        path: '/',
      });

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: true, // Necesario para sameSite: 'none'
        maxAge: 30 * 60 * 1000, // 30 minutos
        sameSite: 'none',
        path: '/',
      });

      sendSuccess(res, { message: 'Inicio de sesión exitoso', user });
    } catch (error) {
      next(error);
    }
  };

  // Refrescar el access token
  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.cookies;

      if (!refreshToken) {
        throw new AppError(401, 'Refresh token no proporcionado');
      }

      const accessToken = await this.authService.refreshAccessToken(refreshToken);

      // Configurar la nueva cookie de access token
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: true,
        maxAge: 10 * 60 * 1000, // 10 minutos
        sameSite: 'none',
        path: '/',
      });

      sendSuccess(res, { message: 'Access token refrescado' });
    } catch (error) {
      next(error);
    }
  };

  // Cerrar sesión
  logout = (_req: Request, res: Response): void => {
    // Eliminar las cookies de accessToken y refreshToken
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });

    sendSuccess(res, { message: 'Sesión cerrada exitosamente' });
  };
}
