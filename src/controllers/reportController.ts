import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/ReportService';
import { sendSuccess } from '../utils/responseHandler';

export class ReportController {
  constructor(private reportService: ReportService) {}

  // Crear un nuevo reporte
  createReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = parseInt(req.params.user_id, 10);
      const uploadedFile = req.file?.filename;

      await this.reportService.createReport(userId, req.body, uploadedFile);

      sendSuccess(res, { message: 'Reporte creado exitosamente' }, 201);
    } catch (error) {
      next(error);
    }
  };

  // Obtener todos los reportes de un usuario
  getUserReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = parseInt(req.params.user_id, 10);
      const reports = await this.reportService.getUserReports(userId);

      sendSuccess(res, reports);
    } catch (error) {
      next(error);
    }
  };

  // Editar un reporte
  updateReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = parseInt(req.params.user_id, 10);
      const reportId = parseInt(req.params.report_id, 10);

      await this.reportService.updateReport(reportId, userId, req.body);

      sendSuccess(res, { message: 'Reporte actualizado exitosamente' });
    } catch (error) {
      next(error);
    }
  };

  // Eliminar un reporte
  deleteReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = parseInt(req.params.user_id, 10);
      const reportId = parseInt(req.params.report_id, 10);

      await this.reportService.deleteReport(reportId, userId);

      sendSuccess(res, { message: 'Reporte eliminado exitosamente' });
    } catch (error) {
      next(error);
    }
  };
}
