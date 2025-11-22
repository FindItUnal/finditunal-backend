import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { AuthService } from '../services/AuthService';
import UserModel from '../models/UserModel';
import { authenticate } from '../middlewares/authMiddleware';
import { updateUserSchema } from '../schemas/authSchemas';
import { validate } from '../middlewares/validationMiddleware';

export const createUserRouter = (userModel: UserModel): Router => {
  const userRouter = Router();
  const authService = new AuthService(userModel);
  const userController = new UserController(authService);

  /**
   * @swagger
   * /user/profile:
   *   get:
   *     summary: Obtener información del perfil del usuario autenticado
   *     description: Obtiene la información completa del usuario autenticado desde el token JWT en la cookie.
   *     tags: [Users]
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: Información del usuario obtenida exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *             example:
   *               user_id: '550e8400-e29b-41d4-a716-446655440000'
   *               email: 'usuario@unal.edu.co'
   *               google_id: '123456789'
   *               name: 'Juan Pérez'
   *               phone_number: '+57 300 123 4567'
   *               is_confirmed: true
   *               is_active: true
   *               role: 'user'
   *               created_at: '2024-01-15T10:30:00Z'
   *               updated_at: '2024-01-15T10:30:00Z'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  // Obtener la informacion del usuario
  userRouter.get('/profile', authenticate, userController.getUserInformation);

  /**
   * @swagger
   * /user/{user_id}/profile/update:
   *   patch:
   *     summary: Actualizar información del usuario (con user_id en URL)
   *     description: Actualiza la información del usuario especificado por user_id. El user_id en la URL debe coincidir con el del token JWT.
   *     tags: [Users]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del usuario a actualizar
   *         example: '550e8400-e29b-41d4-a716-446655440000'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateUser'
   *           example:
   *             phone_number: '+57 300 123 4567'
   *     responses:
   *       200:
   *         description: Usuario actualizado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               message: 'Usuario actualizado exitosamente'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  // Actualizar información del usuario
  userRouter.patch('/:user_id/profile/update', authenticate, validate(updateUserSchema), userController.updateUser);

  /**
   * @swagger
   * /user/profile/update:
   *   patch:
   *     summary: Actualizar perfil del usuario autenticado
   *     description: Actualiza la información del usuario autenticado sin necesidad de especificar el user_id en la URL (se obtiene del token JWT).
   *     tags: [Users]
   *     security:
   *       - cookieAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateUser'
   *           example:
   *             phone_number: '+57 300 123 4567'
   *     responses:
   *       200:
   *         description: Usuario actualizado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               message: 'Usuario actualizado exitosamente'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  // Actualizar perfil del usuario autenticado (sin enviar user_id en la URL)
  userRouter.patch('/profile/update', authenticate, validate(updateUserSchema), userController.updateCurrentUser);

  return userRouter;
};
