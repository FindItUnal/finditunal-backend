import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { AuthService } from '../services/AuthService';
import UserModel from '../models/UserModel';

export const createAuthRouter = (userModel: UserModel): Router => {
  const authRouter = Router();
  const authService = new AuthService(userModel);
  const authController = new AuthController(authService);

  // Google OAuth
  authRouter.get('/google', authController.googleAuth);
  authRouter.get('/google/callback', authController.googleCallback);

  // Refrescar el access token
  authRouter.post('/refresh-token', authController.refreshToken);

  // Cerrar sesión
  authRouter.post('/logout', authController.logout);
  return authRouter;
};
