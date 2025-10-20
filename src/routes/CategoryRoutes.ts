import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController';
import CategoryModel from '../models/CategoryModel';
import { authenticate } from '../middlewares/authMiddleware';

export const createCategoryRouter = (categoryModel: CategoryModel): Router => {
  const categoryRouter = Router();
  const categoryController = new CategoryController(categoryModel);

  // Obtener todas las categorías
  categoryRouter.get('/:user_id/categories', authenticate, categoryController.getAllCategories);

  return categoryRouter;
};
