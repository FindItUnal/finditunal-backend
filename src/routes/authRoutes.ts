import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { AuthService } from '../services/AuthService';
import UserModel from '../models/UserModel';
import { registerSchema, loginSchema } from '../schemas/authSchemas';
import { validate } from '../middlewares/validationMiddleware';

export const createAuthRouter = (userModel: UserModel): Router => {
  const authRouter = Router();
  const authService = new AuthService(userModel);
  const authController = new AuthController(authService);

  // Registrar un nuevo usuario
  authRouter.post('/register', validate(registerSchema), authController.register);

  // Iniciar sesión
  authRouter.post('/login', validate(loginSchema), authController.login);

  // Refrescar el access token
  authRouter.post('/refresh-token', authController.refreshToken);

  // Cerrar sesión
  authRouter.post('/logout', authController.logout);
  return authRouter;
};
