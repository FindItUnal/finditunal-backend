import ComplaintModel, { ComplaintRecord, ComplaintStatus, ComplaintReason } from '../models/ComplaintModel';
import ReportModel from '../models/ReportModel';
import ImageModel from '../models/ImageModel';
import { CreateComplaintInput, UpdateComplaintStatusInput } from '../schemas/complaintSchemas';
import { NotFoundError } from '../utils/errors';
import { deleteImage } from '../middlewares/multerMiddleware';
import ActivityLogModel from '../models/ActivityLogModel';
import { ActivityLogService } from './ActivityLogService';

interface ComplaintFilters {
  status?: ComplaintStatus;
  reason?: ComplaintReason;
  report_id?: number;
}

export class ComplaintService {
  private activityLog: ActivityLogService;

  constructor(
    private complaintModel: ComplaintModel,
    private reportModel: ReportModel,
    private imageModel: ImageModel,
  ) {
    this.activityLog = new ActivityLogService(new ActivityLogModel());
  }

  private async getComplaintOrThrow(complaintId: number): Promise<ComplaintRecord> {
    const complaint = await this.complaintModel.getComplaintById(complaintId);
    if (!complaint) {
      throw new NotFoundError('Denuncia no encontrada');
    }
    return complaint;
  }

  async submitComplaint(reporterUserId: string, reportId: number, input: CreateComplaintInput): Promise<number> {
    const report = await this.reportModel.getReportById(reportId);
    if (!report) {
      throw new NotFoundError('Reporte no encontrado');
    }

    const result = await this.complaintModel.createComplaint({
      report_id: reportId,
      reporter_user_id: reporterUserId,
      reason: input.reason,
      description: input.description,
    });

    await this.activityLog.logActivity({
      event_type: 'COMPLAINT_CREATED',
      actor_user_id: reporterUserId,
      target_type: 'COMPLAINT',
      target_id: result.insertId,
      title: `Nueva denuncia recibida: ${input.reason}`,
      description: `El usuario ${reporterUserId} envio una denuncia sobre el reporte ${reportId}`,
      metadata: {
        complaint_id: result.insertId,
        report_id: reportId,
        reason: input.reason,
      },
    });

    return result.insertId;
  }

  async getUserComplaints(userId: string, status?: ComplaintStatus): Promise<ComplaintRecord[]> {
    return this.complaintModel.getComplaintsByReporter(userId, status);
  }

  async getComplaintForUser(complaintId: number, userId: string): Promise<ComplaintRecord> {
    const complaint = await this.complaintModel.getComplaintById(complaintId);
    if (!complaint || complaint.reporter_user_id !== userId) {
      throw new NotFoundError('Denuncia no encontrada');
    }
    return complaint;
  }

  async getComplaintForAdmin(complaintId: number): Promise<ComplaintRecord> {
    const complaint = await this.complaintModel.getComplaintById(complaintId);
    if (!complaint) {
      throw new NotFoundError('Denuncia no encontrada');
    }
    return complaint;
  }

  async getComplaintsForAdmin(filters?: ComplaintFilters): Promise<ComplaintRecord[]> {
    return this.complaintModel.getAllComplaints(filters);
  }

  async updateComplaintStatus(
    complaintId: number,
    adminUserId: string,
    input: UpdateComplaintStatusInput,
  ): Promise<void> {
    await this.getComplaintOrThrow(complaintId);
    const updates: Partial<ComplaintRecord> = {};

    if (input.status) {
      updates.status = input.status;
      if (input.status === 'resolved' || input.status === 'rejected') {
        updates.resolved_by = adminUserId;
        updates.resolved_at = new Date();
      } else {
        updates.resolved_by = null;
        updates.resolved_at = null;
      }
    }

    if (input.admin_notes !== undefined) {
      updates.admin_notes = input.admin_notes;
    }

    await this.complaintModel.updateComplaint(complaintId, updates);

    await this.activityLog.logActivity({
      event_type: 'COMPLAINT_UPDATED',
      actor_user_id: adminUserId,
      target_type: 'COMPLAINT',
      target_id: complaintId,
      title: `Estado de denuncia actualizado: ${updates.status ?? 'sin cambios'}`,
      description: `El administrador ${adminUserId} actualizo la denuncia ${complaintId}`,
      metadata: {
        complaint_id: complaintId,
        status: updates.status,
      },
    });
  }

  async discardComplaint(complaintId: number, adminUserId: string, adminNotes: string): Promise<void> {
    await this.getComplaintOrThrow(complaintId);

    await this.complaintModel.updateComplaint(complaintId, {
      status: 'resolved',
      admin_notes: adminNotes,
      resolved_by: adminUserId,
      resolved_at: new Date(),
    });

    await this.activityLog.logActivity({
      event_type: 'COMPLAINT_RESOLVED',
      actor_user_id: adminUserId,
      target_type: 'COMPLAINT',
      target_id: complaintId,
      title: 'Denuncia descartada',
      description: `El administrador ${adminUserId} descarto la denuncia ${complaintId}`,
      metadata: {
        complaint_id: complaintId,
        action: 'discard',
      },
    });
  }

  async resolveComplaintAndDeleteReport(complaintId: number, adminUserId: string, adminNotes: string): Promise<void> {
    const complaint = await this.getComplaintOrThrow(complaintId);

    const report = await this.reportModel.getReportById(complaint.report_id);
    if (!report) {
      throw new NotFoundError('Reporte asociado no encontrado');
    }

    const images = await this.imageModel.getImagesByReportId(report.report_id);

    await this.complaintModel.updateComplaint(complaintId, {
      status: 'resolved',
      admin_notes: adminNotes,
      resolved_by: adminUserId,
      resolved_at: new Date(),
    });

    images.forEach((image) => deleteImage(image.image_url));

    await this.reportModel.deleteReport(report.report_id);

    await this.activityLog.logActivity({
      event_type: 'COMPLAINT_RESOLVED',
      actor_user_id: adminUserId,
      target_type: 'COMPLAINT',
      target_id: complaintId,
      title: 'Denuncia resuelta y reporte eliminado',
      description: `El administrador ${adminUserId} resolvio la denuncia ${complaintId} eliminando el reporte asociado`,
      metadata: {
        complaint_id: complaintId,
        report_id: report.report_id,
        action: 'resolve_and_delete_report',
      },
    });
  }
}

export default ComplaintService;
