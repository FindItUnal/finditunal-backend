import { Request, Response } from 'express';
import ReportModel from '../models/ReportModel';
import ImageModel from '../models/ImageModel';
import { validateCreateReport, validateUpdateReport } from '../schemas/reportSchemas';
import { deleteImage } from '../middlewares/multerMiddleware';

export class ReportController {
  private reportModel: ReportModel;
  private imageModel: ImageModel;

  constructor(reportModel: ReportModel, imageModel: ImageModel) {
    this.reportModel = reportModel;
    this.imageModel = imageModel;
  }

  // Crear un nuevo reporte
  createReport = async (req: Request, res: Response): Promise<void> => {
    const uploadedFile = req.file?.filename;

    try {
      const validate = validateCreateReport(req.body);

      if (!validate.success) {
        if (uploadedFile) deleteImage(uploadedFile);
        res.status(400).json({ error: JSON.parse(validate.error.message) });
        return;
      }

      const user_id = parseInt(req.params.user_id, 10);
      const reportData = {
        ...validate.data,
        user_id,
      };
      const result = await this.reportModel.createReport(reportData);
      // Guardar la URL de la imagen si se subió una
      if (uploadedFile) {
        await this.imageModel.saveImage(uploadedFile, result.insertId); // Guardar en la tabla Images
      }
      res.status(201).json({ message: 'Reporte creado exitosamente' });
    } catch (error) {
      console.error(error);
      console.log('req.file', req.file);

      if (uploadedFile) deleteImage(uploadedFile);

      res.status(500).json({ message: 'Error en el servidor' });
    }
  };

  // Obtener todos los reportes de un usuario
  getUserReports = async (req: Request, res: Response): Promise<void> => {
    const user_id = parseInt(req.params.user_id, 10);

    try {
      const reports = await this.reportModel.getReportsByUserId(user_id);
      res.status(200).json(reports);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error en el servidor' });
    }
  };

  // Editar un reporte
  updateReport = async (req: Request, res: Response): Promise<void> => {
    const validate = validateUpdateReport(req.body);

    if (!validate.success) {
      res.status(400).json({ error: JSON.parse(validate.error.message) });
      return;
    }

    const report_id = parseInt(req.params.report_id, 10);

    try {
      const updateData = {
        ...validate.data,
        date_lost_or_found: validate.data.date_lost_or_found ? new Date(validate.data.date_lost_or_found) : undefined,
      };
      await this.reportModel.updateReport(report_id, updateData);
      res.status(200).json({ message: 'Reporte actualizado exitosamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error en el servidor' });
    }
  };

  // Eliminar un reporte
  deleteReport = async (req: Request, res: Response): Promise<void> => {
    const report_id = parseInt(req.params.report_id, 10);

    try {
      const imageRecord = await this.imageModel.getImageByReportId(report_id);
      await this.reportModel.deleteReport(report_id);

      if (imageRecord) {
        deleteImage(imageRecord.image_url);
      }

      res.status(200).json({ message: 'Reporte eliminado exitosamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error en el servidor' });
    }
  };
}
