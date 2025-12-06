import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import NotificationModel from '../models/NotificationModel';
import { NotificationService } from '../services/NotificationService';
import { NotificationController } from '../controllers/notificationController';

export const createNotificationRouter = (notificationModel: NotificationModel): Router => {
  const notificationRouter = Router();
  const notificationService = new NotificationService(notificationModel);
  const notificationController = new NotificationController(notificationService);

  /**
   * @swagger
   * /user/{user_id}/notifications:
   *   get:
   *     summary: Listar notificaciones del usuario
   *     description: Devuelve una lista paginada de notificaciones para el usuario autenticado.
   *     tags: [Notifications]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del usuario autenticado.
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *         description: Numero maximo de notificaciones a devolver (por defecto 20).
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           minimum: 0
   *         description: Desplazamiento para paginacion (por defecto 0).
   *       - in: query
   *         name: only_unread
   *         schema:
   *           type: boolean
   *         description: Si es true, solo devuelve notificaciones no leidas.
   *     responses:
   *       200:
   *         description: Lista de notificaciones del usuario.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/NotificationPage'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  notificationRouter.get('/:user_id/notifications', authenticate, notificationController.getUserNotifications);

  /**
   * @swagger
   * /user/{user_id}/notifications/{notification_id}/read:
   *   post:
   *     summary: Marcar una notificacion como leida
   *     tags: [Notifications]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: notification_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Notificacion marcada como leida.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               message: 'Notificacion marcada como leida'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  notificationRouter.post(
    '/:user_id/notifications/:notification_id/read',
    authenticate,
    notificationController.markNotificationAsRead,
  );

  /**
   * @swagger
   * /user/{user_id}/notifications/read-all:
   *   post:
   *     summary: Marcar todas las notificaciones como leidas
   *     tags: [Notifications]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Todas las notificaciones se marcaron como leidas.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               message: 'Todas las notificaciones marcadas como leidas'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  notificationRouter.post(
    '/:user_id/notifications/read-all',
    authenticate,
    notificationController.markAllNotificationsAsRead,
  );

  return notificationRouter;
};
