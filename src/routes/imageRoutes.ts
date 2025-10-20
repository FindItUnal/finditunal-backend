import { Router } from 'express';
import { ImageController } from '../controllers/imageController';
import { authenticate } from '../middlewares/authMiddleware';

export const createImageRouter = (): Router => {
  const imageRouter = Router();
  const imageController = new ImageController();

  // Obtener todas las ubicaciones
  imageRouter.get('/:user_id/images/:filename', authenticate, imageController.sendImage);

  return imageRouter;
};
