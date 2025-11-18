import { Request, Response, NextFunction } from 'express';
import CategoryModel from '../models/CategoryModel';
import { sendSuccess } from '../utils/responseHandler';

export class CategoryController {
  constructor(private categoryModel: CategoryModel) {}

  // Obtener todas las categorías
  getAllCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.categoryModel.getAllCategories();
      sendSuccess(res, categories);
    } catch (error) {
      next(error);
    }
  };
}
