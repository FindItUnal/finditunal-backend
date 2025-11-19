import ReportModel from '../models/ReportModel';
import ImageModel from '../models/ImageModel';
import { CreateReportInput, UpdateReportInput } from '../schemas/reportSchemas';
import { NotFoundError } from '../utils/errors';
import { deleteImage } from '../middlewares/multerMiddleware';

export interface ReportWithImage {
  report_id: number;
  user_id: string;
  category_id: number;
  location_id: number;
  title: string;
  description?: string;
  status: 'perdido' | 'encontrado';
  date_lost_or_found: Date;
  contact_method: string;
  created_at: Date;
  updated_at: Date;
}

export class ReportService {
  constructor(
    private reportModel: ReportModel,
    private imageModel: ImageModel,
  ) {}

  // Crear un nuevo reporte
  async createReport(userId: string, reportData: CreateReportInput, imageFilename?: string): Promise<number> {
    try {
      const report = {
        ...reportData,
        user_id: userId,
      };

      const result = await this.reportModel.createReport(report);

      // Guardar la imagen si se subió una
      if (imageFilename && result.insertId) {
        await this.imageModel.saveImage(imageFilename, result.insertId);
      }

      return result.insertId;
    } catch (error) {
      // Si hay error y se subió una imagen, eliminarla
      if (imageFilename) {
        deleteImage(imageFilename);
      }
      throw error;
    }
  }

  // Obtener todos los reportes de un usuario
  async getUserReports(userId: string): Promise<ReportWithImage[]> {
    const reports = await this.reportModel.getReportsByUserId(userId);
    return reports as ReportWithImage[];
  }

  // Obtener un reporte por ID (verifica que pertenezca al usuario)
  async getReportById(reportId: number, userId: string): Promise<ReportWithImage> {
    const report = await this.reportModel.getReportById(reportId);

    if (!report) {
      throw new NotFoundError('Reporte no encontrado');
    }

    // Verificar que el reporte pertenece al usuario
    if (report.user_id !== userId) {
      throw new NotFoundError('Reporte no encontrado');
    }

    return report as ReportWithImage;
  }

  // Verificar que un reporte existe y pertenece al usuario
  async verifyReportOwnership(reportId: number, userId: string): Promise<void> {
    const report = await this.reportModel.getReportById(reportId);

    if (!report || report.user_id !== userId) {
      throw new NotFoundError('Reporte no encontrado');
    }
  }

  // Actualizar un reporte
  async updateReport(reportId: number, userId: string, updateData: UpdateReportInput): Promise<void> {
    // Verificar que el reporte existe y pertenece al usuario
    await this.verifyReportOwnership(reportId, userId);

    // Transformar la fecha si viene
    const dataToUpdate = {
      ...updateData,
      date_lost_or_found: updateData.date_lost_or_found ? new Date(updateData.date_lost_or_found) : undefined,
    };

    await this.reportModel.updateReport(reportId, dataToUpdate);
  }

  // Eliminar un reporte
  async deleteReport(reportId: number, userId: string): Promise<void> {
    // Verificar que el reporte existe y pertenece al usuario
    await this.verifyReportOwnership(reportId, userId);

    try {
      // Obtener la imagen asociada antes de eliminar
      const imageRecord = await this.imageModel.getImageByReportId(reportId);

      // Eliminar el reporte (esto también debería eliminar la imagen por FK CASCADE si está configurado)
      await this.reportModel.deleteReport(reportId);

      // Eliminar la imagen del sistema de archivos si existe
      if (imageRecord) {
        deleteImage(imageRecord.image_url);
      }
    } catch (error) {
      console.error('Error al eliminar reporte:', error);
      throw error;
    }
  }
}
