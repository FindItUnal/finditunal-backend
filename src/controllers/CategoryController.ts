import { Request, Response } from 'express';
import CategoryModel from '../models/CategoryModel';

export class CategoryController {
  private categoryModel: CategoryModel;

  constructor(categoryModel: CategoryModel) {
    this.categoryModel = categoryModel;
  }

  // Obtener todas las categorías
  getAllCategories = async (_req: Request, res: Response): Promise<void> => {
    try {
      const categories = await this.categoryModel.getAllCategories();
      res.status(200).json(categories);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error en el servidor' });
    }
  };
}
