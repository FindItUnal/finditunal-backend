import { Router } from 'express';
import { ObjectController } from '../controllers/objectController';
import { ObjectService } from '../services/ObjectService';
import ObjectModel from '../models/ObjectModel';
import { authenticate } from '../middlewares/authMiddleware';

export const createObjectRouter = (objectModel: ObjectModel): Router => {
  const objectRouter = Router();
  const objectService = new ObjectService(objectModel);
  const objectController = new ObjectController(objectService);

  /**
   * @swagger
   * /user/{user_id}/objects:
   *   get:
   *     summary: Obtener todos los objetos
   *     description: Obtiene todos los objetos reportados (perdidos y encontrados) con sus categorías, ubicaciones e imágenes asociadas. Los objetos se ordenan por fecha de creación descendente. El user_id en la URL debe coincidir con el del token JWT.
   *     tags: [Objects]
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
   *         description: Lista de objetos obtenida exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Object'
   *             example:
   *               - report_id: 1
   *                 title: 'Billetera encontrada en biblioteca'
   *                 description: 'Billetera negra con documentos de identidad'
   *                 category: 'Billeteras'
   *                 location: 'Biblioteca Central'
   *                 status: 'encontrado'
   *                 contact_method: 'email: usuario@unal.edu.co'
   *                 date_lost_or_found: '2024-01-15T12:00:00Z'
   *                 image_url: 'http://localhost:3000/user/user_id/images/image.jpg'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  // Obtener todos los objetos
  objectRouter.get('/:user_id/objects', authenticate, objectController.getAllObjects);

  /**
   * @swagger
   * /user/{user_id}/objects/filter/{report_id}:
   *   get:
   *     summary: Obtener un objeto por su report_id
   *     description: Obtiene un objeto específico mediante su report_id, incluyendo su categoría, ubicación e imagen asociada. El user_id en la URL debe coincidir con el del token JWT.
   *     tags: [Objects]
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
   *         name: report_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del reporte del objeto
   *         example: 1
   *     responses:
   *       200:
   *         description: Objeto obtenido exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Object'
   *             example:
   *               report_id: 1
   *               title: 'Billetera encontrada en biblioteca'
   *               description: 'Billetera negra con documentos de identidad'
   *               category: 'Billeteras'
   *               location: 'Biblioteca Central'
   *               status: 'encontrado'
   *               contact_method: 'email: usuario@unal.edu.co'
   *               date_lost_or_found: '2024-01-15T12:00:00Z'
   *               image_url: 'http://localhost:3000/user/user_id/images/image.jpg'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  // Obtener un objeto por su report_id
  objectRouter.get('/:user_id/objects/filter/:report_id', authenticate, objectController.getObjectById);

  /**
   * @swagger
   * /user/{user_id}/objects/filters:
   *   get:
   *     summary: Buscar objetos con filtros
   *     description: |
   *       Busca objetos aplicando múltiples filtros opcionales:
   *       - Por categoría (nombre exacto)
   *       - Por ubicación (nombre exacto)
   *       - Por rango de fechas (startDate y endDate)
   *       - Por palabras clave (busca en título y descripción)
   *       - Por estado (perdido/encontrado)
   *       
   *       Los filtros se pueden combinar y se aplican con lógica AND. El user_id en la URL debe coincidir con el del token JWT.
   *     tags: [Objects]
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
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *         description: Nombre exacto de la categoría
   *         example: 'Billeteras'
   *       - in: query
   *         name: location
   *         schema:
   *           type: string
   *         description: Nombre exacto de la ubicación
   *         example: 'Biblioteca Central'
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [perdido, encontrado]
   *         description: Estado del objeto
   *         example: 'encontrado'
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Fecha inicial del rango (formato YYYY-MM-DD). Debe usarse junto con endDate.
   *         example: '2024-01-01'
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Fecha final del rango (formato YYYY-MM-DD). Debe usarse junto con startDate.
   *         example: '2024-01-31'
   *       - in: query
   *         name: keyword
   *         schema:
   *           type: string
   *         description: Palabras clave para buscar en título y descripción (búsqueda parcial, múltiples palabras separadas por espacio)
   *         example: 'billetera negra'
   *     responses:
   *       200:
   *         description: Resultados de búsqueda obtenidos exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Object'
   *             example:
   *               - report_id: 1
   *                 title: 'Billetera encontrada en biblioteca'
   *                 description: 'Billetera negra con documentos de identidad'
   *                 category: 'Billeteras'
   *                 location: 'Biblioteca Central'
   *                 status: 'encontrado'
   *                 contact_method: 'email: usuario@unal.edu.co'
   *                 date_lost_or_found: '2024-01-15T12:00:00Z'
   *                 image_url: 'http://localhost:3000/user/user_id/images/image.jpg'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  // Buscar objetos por categoría, ubicación, rango de fechas y palabras clave
  objectRouter.get('/:user_id/objects/filters', authenticate, objectController.searchObjects);

  return objectRouter;
};
