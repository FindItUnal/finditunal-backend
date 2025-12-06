import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { UserAdminService } from '../services/UserAdminService';
import { sendSuccess } from '../utils/responseHandler';

export class UserController {
  constructor(
    private authService: AuthService,
    private userAdminService: UserAdminService,
  ) {}

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

  // Listar usuarios (admin)
  listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = (req as any).user?.user_id as string | undefined;
      if (!adminId) {
        res.status(401).json({ message: 'Usuario no autenticado' });
        return;
      }

      const result = await this.userAdminService.listUsers(adminId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  // Obtener detalle de un usuario (admin)
  getUserDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.user_id;
      const detail = await this.userAdminService.getUserDetail(userId);
      sendSuccess(res, detail);
    } catch (error) {
      next(error);
    }
  };

  // Banear usuario (admin)
  banUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = (req as any).user?.user_id as string | undefined;
      if (!adminId) {
        res.status(401).json({ message: 'Usuario no autenticado' });
        return;
      }

      const userId = req.params.user_id;
      await this.userAdminService.banUser(userId, adminId);
      sendSuccess(res, { message: 'Usuario baneado exitosamente' });
    } catch (error) {
      next(error);
    }
  };

  // Estadisticas del dashboard admin
  getAdminDashboardStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.userAdminService.getDashboardStats();
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  };
}
