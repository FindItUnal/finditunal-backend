import { Router } from 'express';
import { ImageController } from '../controllers/imageController';
import { authenticate } from '../middlewares/authMiddleware';

export const createImageRouter = (): Router => {
  const imageRouter = Router();
  const imageController = new ImageController();

  /**
   * @swagger
   * /user/{user_id}/images/{filename}:
   *   get:
   *     summary: Obtener una imagen
   *     description: Obtiene una imagen asociada a un reporte mediante su nombre de archivo. El user_id en la URL debe coincidir con el del token JWT. La imagen se sirve directamente como archivo binario.
   *     tags: [Images]
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
   *       - in: path
   *         name: filename
   *         required: true
   *         schema:
   *           type: string
   *         description: Nombre del archivo de la imagen
   *         example: 'image-1234567890.jpg'
   *     responses:
   *       200:
   *         description: Imagen obtenida exitosamente
   *         content:
   *           image/jpeg:
   *             schema:
   *               type: string
   *               format: binary
   *           image/png:
   *             schema:
   *               type: string
   *               format: binary
   *           image/jpg:
   *             schema:
   *               type: string
   *               format: binary
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       404:
   *         description: Imagen no encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               message: 'Imagen no encontrada'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  // Obtener todas las ubicaciones
  imageRouter.get('/:user_id/images/:filename', authenticate, imageController.sendImage);

  return imageRouter;
};
