import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { sendSuccess } from '../utils/responseHandler';
import { AppError } from '../utils/errors';
import { APP_CONFIG } from '../config';

export class AuthController {
  constructor(private authService: AuthService) {}

  // Redirige a Google OAuth
  googleAuth = async (_req: Request, res: Response): Promise<void> => {
    const url = this.authService.getGoogleAuthUrl();
    res.redirect(url);
  };

  // Callback de Google OAuth
  googleCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const code = typeof req.query.code === 'string' ? req.query.code : undefined;
      if (!code) {
        throw new AppError(400, 'Código de autorización no proporcionado');
      }

      const { tokens } = await this.authService.loginWithGoogle(code);

      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: true,
        maxAge: 10 * 60 * 1000,
        sameSite: 'none',
        path: '/',
      });

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: true,
        maxAge: 30 * 60 * 1000,
        sameSite: 'none',
        path: '/',
      });

      // Redirigir al frontend tras login
      const redirectUrl = `${APP_CONFIG.FRONTEND_URL}`;
      res.redirect(redirectUrl);
    } catch (error) {
      // If the error is due to domain restriction, redirect back to frontend login with a flag
      try {
        // Only redirect for known unauthorized domain errors to give user feedback
        if (error instanceof AppError && error.statusCode === 401 && /dominio/i.test(error.message)) {
          const frontend = APP_CONFIG.FRONTEND_URL.replace(/\/$/, '') + '/login';
          const params = new URLSearchParams({ error: 'domain_not_allowed' });
          res.redirect(`${frontend}?${params.toString()}`);
          return;
        }
      } catch (e) {
        // ignore and fallthrough to default error handler
      }

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
