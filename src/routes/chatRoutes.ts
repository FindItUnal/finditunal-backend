import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import { ChatService } from '../services/ChatService';
import { ChatController } from '../controllers/chatController';
import { createMessageSchema } from '../schemas/chatSchemas';

export const createChatRouter = (chatService: ChatService): Router => {
  const chatRouter = Router();

  const chatController = new ChatController(chatService);

  /**
   * @swagger
   * /user/{user_id}/reports/{report_id}/conversations/exists:
   *   get:
   *     summary: Verificar si existe una conversacion para un reporte
   *     description: Devuelve un indicador booleano que representa si ya existe una conversacion entre el propietario del reporte y el usuario autenticado.
   *     tags: [Chats]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del usuario autenticado interesado en la publicacion.
   *       - in: path
   *         name: report_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del reporte sobre el cual se quiere verificar la conversacion.
   *     responses:
   *       200:
   *         description: Resultado de la verificacion.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 exists:
   *                   type: boolean
   *                   description: Indica si la conversacion ya existe.
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  // Verificar si existe una conversacion asociada a un reporte
  chatRouter.get('/:user_id/reports/:report_id/conversations/exists', authenticate, chatController.conversationExists);

  /**
   * @swagger
   * /user/{user_id}/reports/{report_id}/conversations:
   *   post:
   *     summary: Crear o recuperar una conversacion para un reporte
   *     description: >
   *       Crea una conversacion privada entre el propietario del reporte y el usuario autenticado
   *       interesado en la publicacion, o devuelve la conversacion existente si ya fue creada.
   *     tags: [Chats]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del usuario autenticado interesado en la publicacion.
   *       - in: path
   *         name: report_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del reporte sobre el cual se quiere iniciar la conversacion.
   *     responses:
   *       201:
   *         description: Conversacion creada o recuperada exitosamente.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ChatConversation'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  // Crear o recuperar una conversacion asociada a un reporte
  chatRouter.post('/:user_id/reports/:report_id/conversations', authenticate, chatController.createOrGetConversation);

  /**
   * @swagger
   * /user/{user_id}/conversations:
   *   get:
   *     summary: Listar conversaciones del usuario
   *     description: Devuelve todas las conversaciones en las que participa el usuario autenticado, ordenadas por ultima actividad.
   *     tags: [Chats]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del usuario autenticado.
   *     responses:
   *       200:
   *         description: Lista de conversaciones del usuario.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/ChatConversationSummary'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  // Listar conversaciones de un usuario
  chatRouter.get('/:user_id/conversations', authenticate, chatController.getUserConversations);

  /**
   * @swagger
   * /user/{user_id}/conversations/{conversation_id}/messages:
   *   get:
   *     summary: Obtener mensajes de una conversacion
   *     description: Devuelve el historial completo de mensajes de una conversacion en la que participa el usuario.
   *     tags: [Chats]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del usuario autenticado.
   *       - in: path
   *         name: conversation_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la conversacion.
   *     responses:
   *       200:
   *         description: Lista de mensajes de la conversacion.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/ChatMessage'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  // Obtener mensajes de una conversacion
  chatRouter.get(
    '/:user_id/conversations/:conversation_id/messages',
    authenticate,
    chatController.getConversationMessages,
  );

  /**
   * @swagger
   * /user/{user_id}/conversations/{conversation_id}/messages:
   *   post:
   *     summary: Enviar un mensaje en una conversacion
   *     description: Crea un nuevo mensaje en una conversacion existente entre dos usuarios.
   *     tags: [Chats]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del usuario autenticado que envia el mensaje.
   *       - in: path
   *         name: conversation_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la conversacion.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateChatMessage'
   *     responses:
   *       201:
   *         description: Mensaje enviado exitosamente.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ChatMessage'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  // Enviar un mensaje en una conversacion
  chatRouter.post(
    '/:user_id/conversations/:conversation_id/messages',
    authenticate,
    validate(createMessageSchema),
    chatController.sendMessage,
  );

  /**
   * @swagger
   * /user/{user_id}/conversations/{conversation_id}/read:
   *   post:
   *     summary: Marcar una conversacion como leida
   *     description: Marca todos los mensajes no leidos de la conversacion como leidos para el usuario autenticado.
   *     tags: [Chats]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del usuario autenticado.
   *       - in: path
   *         name: conversation_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la conversacion.
   *     responses:
   *       200:
   *         description: Conversacion marcada como leida exitosamente.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               message: 'Conversacion marcada como leida'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  // Marcar una conversacion como leida
  chatRouter.post('/:user_id/conversations/:conversation_id/read', authenticate, chatController.markConversationRead);

  /**
   * @swagger
   * /user/{user_id}/conversations/{conversation_id}:
   *   delete:
   *     summary: Eliminar una conversacion completa
   *     description: Elimina la conversacion y todos sus mensajes asociados. Solo pueden eliminarla los usuarios que participan en ella.
   *     tags: [Chats]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del usuario autenticado.
   *       - in: path
   *         name: conversation_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la conversacion a eliminar.
   *     responses:
   *       200:
   *         description: Conversacion eliminada exitosamente.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               message: 'Conversacion eliminada exitosamente'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  // Eliminar una conversacion completa (y sus mensajes)
  chatRouter.delete('/:user_id/conversations/:conversation_id', authenticate, chatController.deleteConversation);

  return chatRouter;
};
