import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { sendSuccess } from '../utils/responseHandler';

export class UserController {
  constructor(private authService: AuthService) {}

  // Obtener información del usuario
  getUserInformation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.user_id as string;
      const userInfo = await this.authService.getUserInfo(userId);

      sendSuccess(res, userInfo);
    } catch (error) {
      next(error);
    }
  };

  // Actualizar información del usuario
  updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.user_id;
      await this.authService.updateUser(userId, req.body);

      sendSuccess(res, { message: 'Usuario actualizado exitosamente' });
    } catch (error) {
      next(error);
    }
  };

  // Actualizar información del usuario autenticado (sin user_id en la URL)
  updateCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user?.user_id as string | undefined;
      if (!userId) {
        res.status(401).json({ message: 'Usuario no autenticado' });
        return;
      }

      await this.authService.updateUser(userId, req.body);
      sendSuccess(res, { message: 'Usuario actualizado exitosamente' });
    } catch (error) {
      next(error);
    }
  };
}
