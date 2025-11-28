import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { ReportService } from '../services/ReportService';
import { authenticate } from '../middlewares/authMiddleware';
import ReportModel from '../models/ReportModel';
import ImageModel from '../models/ImageModel';
import upload from '../middlewares/multerMiddleware';
import { reportSchema } from '../schemas/reportSchemas';
import { validate } from '../middlewares/validationMiddleware';

export const createReportRouter = (reportModel: ReportModel, imageModel: ImageModel): Router => {
  const reportRouter = Router();
  const reportService = new ReportService(reportModel, imageModel);
  const reportController = new ReportController(reportService);

  /**
   * @swagger
   * /user/{user_id}/reports:
   *   post:
   *     summary: Crear un nuevo reporte
   *     description: Crea un nuevo reporte de objeto perdido o encontrado. Permite subir entre 0 y 4 imagenes del objeto. El user_id en la URL debe coincidir con el del token JWT.
   *     tags: [Reports]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del usuario que crea el reporte
   *         example: '550e8400-e29b-41d4-a716-446655440000'
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - category_id
   *               - location_id
   *               - title
   *               - status
   *               - date_lost_or_found
   *               - contact_method
   *             properties:
   *               category_id:
   *                 type: string
   *                 description: ID de la categoría (se convierte a número)
   *                 example: '1'
   *               location_id:
   *                 type: string
   *                 description: ID de la ubicación (se convierte a número)
   *                 example: '1'
   *               title:
   *                 type: string
   *                 minLength: 1
   *                 description: Título del reporte
   *                 example: 'Billetera encontrada en biblioteca'
   *               description:
   *                 type: string
   *                 description: Descripción detallada del objeto
   *                 example: 'Billetera negra con documentos de identidad'
   *               status:
   *                 type: string
   *                 enum: [perdido, encontrado, entregado]
   *                 description: Estado del reporte
   *                 example: 'encontrado'
   *               date_lost_or_found:
   *                 type: string
   *                 pattern: '^\d{4}-\d{2}-\d{2}$'
   *                 description: Fecha en formato YYYY-MM-DD
   *                 example: '2024-01-15'
   *               contact_method:
   *                 type: string
   *                 minLength: 1
   *                 description: Método de contacto
   *                 example: 'email: usuario@unal.edu.co'
   *               images:
   *                 type: array
   *                 maxItems: 4
   *                 description: Imagenes del objeto (opcional, maximo 4)
   *                 items:
   *                   type: string
   *                   format: binary
   *           encoding:
   *             images:
   *               contentType: image/jpeg, image/png, image/jpg
   *     responses:
   *       201:
   *         description: Reporte creado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               message: 'Reporte creado exitosamente'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  // Crear un nuevo reporte
  reportRouter.post(
    '/:user_id/reports',
    authenticate,
    upload.array('images', 4),
    validate(reportSchema),
    reportController.createReport,
  );

  /**
   * @swagger
   * /user/{user_id}/reports:
   *   get:
   *     summary: Obtener todos los reportes de un usuario
   *     description: Obtiene todos los reportes creados por el usuario especificado. El user_id en la URL debe coincidir con el del token JWT. Los reportes se ordenan por fecha de creación descendente.
   *     tags: [Reports]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del usuario
   *         example: '550e8400-e29b-41d4-a716-446655440000'
   *     responses:
   *       200:
   *         description: Lista de reportes obtenida exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Report'
   *             example:
   *               - report_id: 1
   *                 user_id: '550e8400-e29b-41d4-a716-446655440000'
   *                 category_id: 1
   *                 location_id: 1
   *                 title: 'Billetera encontrada en biblioteca'
   *                 description: 'Billetera negra con documentos de identidad'
   *                 status: 'encontrado'
   *                 date_lost_or_found: '2024-01-15T12:00:00Z'
   *                 contact_method: 'email: usuario@unal.edu.co'
   *                 created_at: '2024-01-15T10:30:00Z'
   *                 updated_at: '2024-01-15T10:30:00Z'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  // Obtener todos los reportes de un usuario
  reportRouter.get('/:user_id/reports', authenticate, reportController.getUserReports);

  /**
   * @swagger
   * /user/{user_id}/reports/{report_id}:
   *   patch:
   *     summary: Actualizar un reporte
   *     description: Actualiza un reporte existente. Solo se pueden actualizar los campos especificados en el body. El user_id en la URL debe coincidir con el del token JWT y ser el propietario del reporte.
   *     tags: [Reports]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del usuario propietario del reporte
   *         example: '550e8400-e29b-41d4-a716-446655440000'
   *       - in: path
   *         name: report_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del reporte a actualizar
   *         example: 1
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateReport'
   *           example:
   *             title: 'Billetera encontrada en biblioteca (actualizado)'
   *             description: 'Billetera negra con documentos de identidad y tarjeta de crédito'
   *             status: 'encontrado'
   *     responses:
   *       200:
   *         description: Reporte actualizado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               message: 'Reporte actualizado exitosamente'
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
  // Editar un reporte
  reportRouter.patch(
    '/:user_id/reports/:report_id',
    authenticate,
    validate(reportSchema.partial()),
    reportController.updateReport,
  );

  /**
   * @swagger
   * /user/{user_id}/reports/{report_id}:
   *   delete:
   *     summary: Eliminar un reporte
   *     description: Elimina un reporte existente. El user_id en la URL debe coincidir con el del token JWT y ser el propietario del reporte.
   *     tags: [Reports]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del usuario propietario del reporte
   *         example: '550e8400-e29b-41d4-a716-446655440000'
   *       - in: path
   *         name: report_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del reporte a eliminar
   *         example: 1
   *     responses:
   *       200:
   *         description: Reporte eliminado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
   *             example:
   *               message: 'Reporte eliminado exitosamente'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  // Eliminar un reporte
  reportRouter.delete('/:user_id/reports/:report_id', authenticate, reportController.deleteReport);

  return reportRouter;
};
