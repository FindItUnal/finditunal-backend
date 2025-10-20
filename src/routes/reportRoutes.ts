import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { authenticate } from '../middlewares/authMiddleware';
import ReportModel from '../models/ReportModel';
import ImageModel from '../models/ImageModel';
import upload from '../middlewares/multerMiddleware';

export const createReportRouter = (reportModel: ReportModel, imageModel: ImageModel): Router => {
  const reportRouter = Router();
  const reportController = new ReportController(reportModel, imageModel);

  // Crear un nuevo reporte
  reportRouter.post('/:user_id/reports', authenticate, upload.single('image'), reportController.createReport);

  // Obtener todos los reportes de un usuario
  reportRouter.get('/:user_id/reports', authenticate, reportController.getUserReports);

  // Editar un reporte
  reportRouter.patch('/:user_id/reports/:report_id', authenticate, reportController.updateReport);

  // Eliminar un reporte
  reportRouter.delete('/:user_id/reports/:report_id', authenticate, reportController.deleteReport);

  return reportRouter;
};
