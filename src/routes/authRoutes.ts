import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import UserModel from '../models/UserModel';

export const createAuthRouter = (userModel: UserModel): Router => {
  const authRouter = Router();
  const authController = new AuthController(userModel);

  // Registrar un nuevo usuario
  authRouter.post('/register', authController.register);

  // Iniciar sesión
  authRouter.post('/login', authController.login);

  // Refrescar el access token
  authRouter.post('/refresh-token', authController.refreshToken);

  // Cerrar sesión
  authRouter.post('/logout', authController.logout);
  return authRouter;
};
