import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { AuthService } from '../services/AuthService';
import UserModel from '../models/UserModel';
import { authenticate } from '../middlewares/authMiddleware';
import { updateUserSchema } from '../schemas/authSchemas';
import { validate } from '../middlewares/validationMiddleware';

export const createUserRouter = (userModel: UserModel): Router => {
  const userRouter = Router();
  const authService = new AuthService(userModel);
  const userController = new UserController(authService);

  // Obtener la informacion del usuario
  userRouter.get('/profile', authenticate, userController.getUserInformation);

  // Actualizar información del usuario
  userRouter.patch(
    '/:user_id/profile/update',
    authenticate,
    validate(updateUserSchema.partial()),
    userController.updateUser,
  );

  return userRouter;
};
