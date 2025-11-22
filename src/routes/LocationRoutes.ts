import { Router } from 'express';
import { LocationController } from '../controllers/LocationController';
import LocationModel from '../models/LocationModel';
import { authenticate } from '../middlewares/authMiddleware';

export const createLocationRouter = (locationModel: LocationModel): Router => {
  const locationRouter = Router();
  const locationController = new LocationController(locationModel);

  /**
   * @swagger
   * /user/{user_id}/locations:
   *   get:
   *     summary: Obtener todas las ubicaciones
   *     description: Obtiene la lista completa de ubicaciones disponibles para los reportes. Las ubicaciones se ordenan alfabéticamente por nombre. El user_id en la URL debe coincidir con el del token JWT.
   *     tags: [Locations]
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
   *         description: Lista de ubicaciones obtenida exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Location'
   *             example:
   *               - location_id: 1
   *                 name: 'Biblioteca Central'
   *               - location_id: 2
   *                 name: 'Edificio de Ingeniería'
   *               - location_id: 3
   *                 name: 'Cafetería Principal'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  // Obtener todas las ubicaciones
  locationRouter.get('/:user_id/locations', authenticate, locationController.getAllLocations);

  return locationRouter;
};
