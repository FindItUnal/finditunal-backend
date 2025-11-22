import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController';
import CategoryModel from '../models/CategoryModel';
import { authenticate } from '../middlewares/authMiddleware';

export const createCategoryRouter = (categoryModel: CategoryModel): Router => {
  const categoryRouter = Router();
  const categoryController = new CategoryController(categoryModel);

  /**
   * @swagger
   * /user/{user_id}/categories:
   *   get:
   *     summary: Obtener todas las categorías
   *     description: Obtiene la lista completa de categorías disponibles para los reportes. Las categorías se ordenan alfabéticamente por nombre. El user_id en la URL debe coincidir con el del token JWT.
   *     tags: [Categories]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del usuario autenticado
   *         example: '550e8400-e29b-41d4-a716-446655440000'
   *     responses:
   *       200:
   *         description: Lista de categorías obtenida exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Category'
   *             example:
   *               - category_id: 1
   *                 name: 'Billeteras'
   *               - category_id: 2
   *                 name: 'Llaves'
   *               - category_id: 3
   *                 name: 'Teléfonos móviles'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  // Obtener todas las categorías
  categoryRouter.get('/:user_id/categories', authenticate, categoryController.getAllCategories);

  return categoryRouter;
};
