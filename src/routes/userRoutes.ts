import { Router } from 'express';
import { UserController } from '../controllers/userController';
import UserModel from '../models/UserModel';
import { authenticate } from '../middlewares/authMiddleware';

export const createUserRouter = (userModel: UserModel): Router => {
  const userRouter = Router();
  const userController = new UserController(userModel);

  // Obtener la informacion del usuario
  userRouter.get('/profile', authenticate, userController.getUserInformation);

  userRouter.patch('/:user_id/profile/update', authenticate, userController.updateUser);

  return userRouter;
};
