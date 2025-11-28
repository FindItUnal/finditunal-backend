import { Router } from 'express';
import { ImageController } from '../controllers/imageController';
import { authenticate } from '../middlewares/authMiddleware';
import ImageModel from '../models/ImageModel';

export const createImageRouter = (): Router => {
  const imageRouter = Router();
  const imageController = new ImageController(new ImageModel());

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

  /**
   * @swagger
   * /user/{user_id}/reports/{report_id}/images:
   *   get:
   *     summary: Listar imágenes de un reporte
   *     description: Devuelve todas las imágenes asociadas a un reporte específico.
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
   *       - in: path
   *         name: report_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del reporte
   *     responses:
   *       200:
   *         description: Lista de imágenes del reporte
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 report_id:
   *                   type: integer
   *                 images:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       filename:
   *                         type: string
   *                       url:
   *                         type: string
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   */
  imageRouter.get('/:user_id/reports/:report_id/images', authenticate, imageController.listImagesByReport);

  return imageRouter;
};
