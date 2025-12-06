import ReportModel from '../models/ReportModel';
import ImageModel from '../models/ImageModel';
import { CreateReportInput, UpdateReportInput } from '../schemas/reportSchemas';
import { NotFoundError } from '../utils/errors';
import { deleteImage } from '../middlewares/multerMiddleware';
import ActivityLogModel from '../models/ActivityLogModel';
import { ActivityLogService } from './ActivityLogService';

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
  private activityLog: ActivityLogService;

  constructor(
    private reportModel: ReportModel,
    private imageModel: ImageModel,
  ) {
    this.activityLog = new ActivityLogService(new ActivityLogModel());
  }

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

      if (result.insertId) {
        await this.activityLog.logActivity({
          event_type: 'REPORT_CREATED',
          actor_user_id: userId,
          target_type: 'REPORT',
          target_id: result.insertId,
          title: `Nuevo objeto publicado: ${report.title}`,
          description: `El usuario ${userId} publico un nuevo reporte`,
          metadata: {
            report_id: result.insertId,
            status: report.status,
            category_id: report.category_id,
            location_id: report.location_id,
          },
        });
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
    newImageFilenames: string[] = [],
  ): Promise<void> {
    // Verificar que el reporte existe y pertenece al usuario (o admin)
    const existingReport = await this.verifyReportOwnership(reportId, userId, options);

    // Transformar la fecha si viene
    const dataToUpdate = {
      ...updateData,
      date_lost_or_found: updateData.date_lost_or_found ? new Date(updateData.date_lost_or_found) : undefined,
    };

    await this.reportModel.updateReport(reportId, dataToUpdate);

    if (newImageFilenames.length) {
      const existingImages = await this.imageModel.getImagesByReportId(reportId);
      existingImages.forEach((image) => deleteImage(image.image_url));
      await this.imageModel.deleteImageByReportId(reportId);

      for (const filename of newImageFilenames) {
        await this.imageModel.saveImage(filename, reportId);
      }
    }

    const newStatus = dataToUpdate.status ?? existingReport.status;

    await this.activityLog.logActivity({
      event_type: 'REPORT_UPDATED',
      actor_user_id: userId,
      target_type: 'REPORT',
      target_id: reportId,
      title: `Reporte actualizado: ${existingReport.title}`,
      description: `El usuario ${userId} actualizo el reporte ${reportId}`,
      metadata: {
        report_id: reportId,
        previous_status: existingReport.status,
        new_status: newStatus,
      },
    });

    if (existingReport.status !== 'entregado' && newStatus === 'entregado') {
      await this.activityLog.logActivity({
        event_type: 'REPORT_DELIVERED',
        actor_user_id: userId,
        target_type: 'REPORT',
        target_id: reportId,
        title: `Objeto entregado: ${existingReport.title}`,
        description: `El reporte ${reportId} ha sido marcado como entregado`,
        metadata: {
          report_id: reportId,
        },
      });
    }
  }

  // Eliminar un reporte
  async deleteReport(reportId: number, userId: string, options?: { isAdmin?: boolean }): Promise<void> {
    const report = await this.verifyReportOwnership(reportId, userId, options);

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

    await this.activityLog.logActivity({
      event_type: 'REPORT_DELETED',
      actor_user_id: userId,
      target_type: 'REPORT',
      target_id: reportId,
      title: `Reporte eliminado: ${report.title}`,
      description: `El reporte ${reportId} fue eliminado por el usuario ${userId}`,
      metadata: {
        report_id: reportId,
      },
    });
  }
}
