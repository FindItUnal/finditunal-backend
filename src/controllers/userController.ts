import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { sendSuccess } from '../utils/responseHandler';

export class UserController {
  constructor(private authService: AuthService) {}

  // Obtener información del usuario
  getUserInformation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.body.user.user_id;
      const userInfo = await this.authService.getUserInfo(userId);

      sendSuccess(res, userInfo);
    } catch (error) {
      next(error);
    }
  };

  // Actualizar información del usuario
  updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = parseInt(req.params.user_id, 10);
      await this.authService.updateUser(userId, req.body);

      sendSuccess(res, { message: 'Usuario actualizado exitosamente' });
    } catch (error) {
      next(error);
    }
  };
}
