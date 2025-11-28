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
  status: 'perdido' | 'encontrado' | 'entregado';
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
  async createReport(userId: string, reportData: CreateReportInput, imageFilenames: string[] = []): Promise<number> {
    try {
      const report = {
        ...reportData,
        user_id: userId,
      };

      const result = await this.reportModel.createReport(report);

      if (result.insertId && imageFilenames.length) {
        for (const filename of imageFilenames) {
          await this.imageModel.saveImage(filename, result.insertId);
        }
      }

      return result.insertId;
    } catch (error) {
      imageFilenames.forEach((filename) => deleteImage(filename));
      throw error;
    }
  }

  // Obtener todos los reportes de un usuario
  async getUserReports(userId: string): Promise<ReportWithImage[]> {
    const reports = await this.reportModel.getReportsByUserId(userId);
    return reports as ReportWithImage[];
  }

  // Obtener un reporte por ID (verifica que pertenezca al usuario)
  async getReportById(reportId: number, userId: string, options?: { isAdmin?: boolean }): Promise<ReportWithImage> {
    return this.verifyReportOwnership(reportId, userId, options);
  }

  // Verificar que un reporte existe y pertenece al usuario
  async verifyReportOwnership(
    reportId: number,
    userId: string,
    options?: { isAdmin?: boolean },
  ): Promise<ReportWithImage> {
    const report = await this.reportModel.getReportById(reportId);

    if (!report) {
      throw new NotFoundError('Reporte no encontrado');
    }

    if (!options?.isAdmin && report.user_id !== userId) {
      throw new NotFoundError('Reporte no encontrado');
    }

    return report as ReportWithImage;
  }

  // Actualizar un reporte
  async updateReport(
    reportId: number,
    userId: string,
    updateData: UpdateReportInput,
    options?: { isAdmin?: boolean },
  ): Promise<void> {
    // Verificar que el reporte existe y pertenece al usuario (o admin)
    await this.verifyReportOwnership(reportId, userId, options);

    // Transformar la fecha si viene
    const dataToUpdate = {
      ...updateData,
      date_lost_or_found: updateData.date_lost_or_found ? new Date(updateData.date_lost_or_found) : undefined,
    };

    await this.reportModel.updateReport(reportId, dataToUpdate);
  }

  // Eliminar un reporte
  async deleteReport(reportId: number, userId: string, options?: { isAdmin?: boolean }): Promise<void> {
    await this.verifyReportOwnership(reportId, userId, options);

    try {
      const images = await this.imageModel.getImagesByReportId(reportId);

      await this.reportModel.deleteReport(reportId);

      images.forEach((image) => {
        deleteImage(image.image_url);
      });
    } catch (error) {
      console.error('Error al eliminar reporte:', error);
      throw error;
    }
  }
}
