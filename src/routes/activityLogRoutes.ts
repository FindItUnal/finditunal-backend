import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { authorizeAdmin } from '../middlewares/roleMiddleware';
import ActivityLogModel from '../models/ActivityLogModel';
import { ActivityLogService } from '../services/ActivityLogService';
import { ActivityLogController } from '../controllers/activityLogController';

export const createActivityLogRouter = (activityModel: ActivityLogModel): Router => {
  const activityRouter = Router();
  const activityService = new ActivityLogService(activityModel);
  const activityController = new ActivityLogController(activityService);

  /**
   * @swagger
   * /user/admin/activity-log:
   *   get:
   *     summary: Obtener actividad reciente de la aplicacion
   *     description: Devuelve un listado paginado de la actividad global de la aplicacion, visible solo para administradores.
   *     tags: [Activity]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *         description: Numero maximo de registros a devolver (por defecto 10).
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           minimum: 0
   *         description: Desplazamiento para paginacion (por defecto 0).
   *     responses:
   *       200:
   *         description: Lista paginada de actividad reciente.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ActivityLogResponse'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  activityRouter.get('/admin/activity-log', authenticate, authorizeAdmin, activityController.getAdminActivityLog);

  return activityRouter;
};
