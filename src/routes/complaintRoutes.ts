import { Router } from 'express';
import { ComplaintController } from '../controllers/complaintController';
import ComplaintModel from '../models/ComplaintModel';
import ReportModel from '../models/ReportModel';
import ImageModel from '../models/ImageModel';
import { ComplaintService } from '../services/ComplaintService';
import { authenticate } from '../middlewares/authMiddleware';
import { authorizeAdmin } from '../middlewares/roleMiddleware';
import { validate } from '../middlewares/validationMiddleware';
import {
  createComplaintSchema,
  updateComplaintStatusSchema,
  complaintAdminActionSchema,
} from '../schemas/complaintSchemas';

export const createComplaintRouter = (
  complaintModel: ComplaintModel,
  reportModel: ReportModel,
  imageModel: ImageModel,
): Router => {
  const complaintRouter = Router();
  const complaintService = new ComplaintService(complaintModel, reportModel, imageModel);
  const complaintController = new ComplaintController(complaintService);

  /**
   * @swagger
   * /user/{user_id}/reports/{report_id}/complaints:
   *   post:
   *     summary: Reportar una publicaci\u00f3n
   *     description: Permite que un usuario denuncie un reporte existente especificando el motivo y una descripci\u00f3n opcional.
   *     tags: [Complaints]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *         description: ID del usuario autenticado que realiza la denuncia.
   *       - in: path
   *         name: report_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID del reporte que se est\u00e1 denunciando.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateComplaint'
   *     responses:
   *       201:
   *         description: Denuncia creada exitosamente.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 complaint_id:
   *                   type: integer
   *                 message:
   *                   type: string
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
  complaintRouter.post(
    '/:user_id/reports/:report_id/complaints',
    authenticate,
    validate(createComplaintSchema),
    complaintController.createComplaint,
  );

  /**
   * @swagger
   * /user/admin/complaints:
   *   get:
   *     summary: Listar denuncias para revisi\u00f3n administrativa
   *     description: Solo disponible para usuarios con rol admin. Permite filtrar por estado, motivo o reporte.
   *     tags: [Complaints]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, in_review, resolved, rejected]
   *       - in: query
   *         name: reason
   *         schema:
   *           type: string
   *           enum: [spam, inappropriate, fraud, other]
   *       - in: query
   *         name: report_id
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Lista de denuncias.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Complaint'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  complaintRouter.get('/admin/complaints', authenticate, authorizeAdmin, complaintController.getAdminComplaints);

  /**
   * @swagger
   * /user/admin/complaints/{complaint_id}:
   *   get:
   *     summary: Obtener detalle de una denuncia (admin)
   *     tags: [Complaints]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: complaint_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Detalle de la denuncia.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Complaint'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  complaintRouter.get(
    '/admin/complaints/:complaint_id',
    authenticate,
    authorizeAdmin,
    complaintController.getAdminComplaintById,
  );

  /**
   * @swagger
   * /user/admin/complaints/{complaint_id}:
   *   patch:
   *     summary: Actualizar el estado de una denuncia
   *     tags: [Complaints]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: complaint_id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateComplaint'
   *     responses:
   *       200:
   *         description: Denuncia actualizada exitosamente.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SuccessResponse'
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
  complaintRouter.patch(
    '/admin/complaints/:complaint_id',
    authenticate,
    authorizeAdmin,
    validate(updateComplaintStatusSchema),
    complaintController.updateComplaintStatus,
  );

  /**
   * @swagger
   * /user/admin/complaints/{complaint_id}/discard:
   *   patch:
   *     summary: Descartar una denuncia
   *     description: Marca la denuncia como revisada sin eliminar el reporte asociado.
   *     tags: [Complaints]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: complaint_id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateComplaint'
   *           example:
   *             admin_notes: 'No se encontraron problemas en el reporte'
   *     responses:
   *       200:
   *         description: Denuncia descartada exitosamente.
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   */
  complaintRouter.patch(
    '/admin/complaints/:complaint_id/discard',
    authenticate,
    authorizeAdmin,
    validate(complaintAdminActionSchema),
    complaintController.discardComplaint,
  );

  /**
   * @swagger
   * /user/admin/complaints/{complaint_id}/resolve:
   *   patch:
   *     summary: Resolver una denuncia eliminando el reporte
   *     description: Marca la denuncia como resuelta y elimina el reporte denunciado.
   *     tags: [Complaints]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: complaint_id
   *         required: true
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateComplaint'
   *           example:
   *             admin_notes: 'Reporte eliminado por contener informacion fraudulenta'
   *     responses:
   *       200:
   *         description: Denuncia resuelta y reporte eliminado.
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   */
  complaintRouter.patch(
    '/admin/complaints/:complaint_id/resolve',
    authenticate,
    authorizeAdmin,
    validate(complaintAdminActionSchema),
    complaintController.resolveComplaint,
  );

  /**
   * @swagger
   * /user/{user_id}/complaints:
   *   get:
   *     summary: Listar denuncias enviadas por el usuario
   *     description: Devuelve todas las denuncias realizadas por el usuario autenticado. Se puede filtrar por estado.
   *     tags: [Complaints]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, in_review, resolved, rejected]
   *         description: Filtrar por estado de la denuncia.
   *     responses:
   *       200:
   *         description: Lista de denuncias del usuario.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Complaint'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  complaintRouter.get('/:user_id/complaints', authenticate, complaintController.getUserComplaints);

  /**
   * @swagger
   * /user/{user_id}/complaints/{complaint_id}:
   *   get:
   *     summary: Obtener detalle de una denuncia del usuario
   *     tags: [Complaints]
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: user_id
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: complaint_id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Denuncia encontrada.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Complaint'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       500:
   *         $ref: '#/components/responses/InternalServerError'
   */
  complaintRouter.get('/:user_id/complaints/:complaint_id', authenticate, complaintController.getUserComplaintById);

  return complaintRouter;
};
