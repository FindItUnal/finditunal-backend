import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { AuthService } from '../services/AuthService';
import UserModel from '../models/UserModel';

export const createAuthRouter = (userModel: UserModel): Router => {
  const authRouter = Router();
  const authService = new AuthService(userModel);
  const authController = new AuthController(authService);

  /**
   * @swagger
   * /auth/google:
   *   get:
   *     summary: Iniciar autenticación con Google OAuth
   *     description: Redirige al usuario a la página de autenticación de Google OAuth. El usuario debe tener un email con dominio @unal.edu.co para poder autenticarse.
   *     tags: [Auth]
   *     responses:
   *       302:
   *         description: Redirección a Google OAuth
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  // Google OAuth
  authRouter.get('/google', authController.googleAuth);

  /**
   * @swagger
   * /auth/google/callback:
   *   get:
   *     summary: Callback de Google OAuth
   *     description: |
   *       Endpoint de callback después de la autenticación con Google.
   *       Este endpoint establece las cookies HTTP-only (accessToken y refreshToken) y redirige al frontend.
   *       Solo usuarios con email @unal.edu.co pueden autenticarse.
   *     tags: [Auth]
   *     parameters:
   *       - in: query
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *         description: Código de autorización de Google OAuth
   *       - in: query
   *         name: error
   *         schema:
   *           type: string
   *         description: Error de OAuth (si existe)
   *     responses:
   *       302:
   *         description: Redirección al frontend después de autenticación exitosa o con error
   *         headers:
   *           Set-Cookie:
   *             description: Cookies HTTP-only con accessToken y refreshToken
   *             schema:
   *               type: string
   *               example: accessToken=token; HttpOnly; Path=/; Max-Age=600
   *       400:
   *         description: Código de autorización no proporcionado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               message: 'Código de autorización no proporcionado'
   *       401:
   *         description: Email no permitido (dominio no @unal.edu.co)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               message: 'El email no pertenece a un dominio permitido'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  authRouter.get('/google/callback', authController.googleCallback);

  /**
   * @swagger
   * /auth/refresh-token:
   *   post:
   *     summary: Refrescar el access token
   *     description: Refresca el access token usando el refresh token almacenado en una cookie HTTP-only. El nuevo access token se establece en una cookie.
   *     tags: [Auth]
   *     responses:
   *       200:
   *         description: Access token refrescado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: 'Access token refrescado'
   *         headers:
   *           Set-Cookie:
   *             description: Nueva cookie con accessToken refrescado
   *             schema:
   *               type: string
   *               example: accessToken=new_token; HttpOnly; Path=/; Max-Age=600
   *       401:
   *         description: Refresh token no proporcionado o inválido
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               message: 'Refresh token no proporcionado'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  // Refrescar el access token
  authRouter.post('/refresh-token', authController.refreshToken);

  /**
   * @swagger
   * /auth/logout:
   *   post:
   *     summary: Cerrar sesión
   *     description: Elimina las cookies de autenticación (accessToken y refreshToken) y cierra la sesión del usuario.
   *     tags: [Auth]
   *     responses:
   *       200:
   *         description: Sesión cerrada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: 'Sesión cerrada exitosamente'
   *         headers:
   *           Set-Cookie:
   *             description: Cookies eliminadas
   *             schema:
   *               type: string
   *               example: accessToken=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  // Cerrar sesión
  authRouter.post('/logout', authController.logout);
  return authRouter;
};
