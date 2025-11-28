import { Request, Response, NextFunction } from 'express';
import { ComplaintService } from '../services/ComplaintService';
import { complaintStatuses, complaintReasons } from '../schemas/complaintSchemas';
import { sendSuccess } from '../utils/responseHandler';

const isValidStatus = (value: unknown): value is (typeof complaintStatuses)[number] => {
  return typeof value === 'string' && (complaintStatuses as readonly string[]).includes(value);
};

const isValidReason = (value: unknown): value is (typeof complaintReasons)[number] => {
  return typeof value === 'string' && (complaintReasons as readonly string[]).includes(value);
};

export class ComplaintController {
  constructor(private complaintService: ComplaintService) {}

  createComplaint = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.user_id;
      const reportId = Number(req.params.report_id);

      if (Number.isNaN(reportId)) {
        res.status(400).json({ message: 'report_id inv\u00e1lido' });
        return;
      }

      const complaintId = await this.complaintService.submitComplaint(userId, reportId, req.body);
      sendSuccess(res, { complaint_id: complaintId, message: 'Denuncia creada exitosamente' }, 201);
    } catch (error) {
      next(error);
    }
  };

  getUserComplaints = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.user_id;
      const statusParam = req.query.status;
      const statusFilter = isValidStatus(statusParam) ? statusParam : undefined;

      const complaints = await this.complaintService.getUserComplaints(userId, statusFilter);
      sendSuccess(res, complaints);
    } catch (error) {
      next(error);
    }
  };

  getUserComplaintById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.user_id;
      const complaintId = Number(req.params.complaint_id);

      if (Number.isNaN(complaintId)) {
        res.status(400).json({ message: 'complaint_id inv\u00e1lido' });
        return;
      }

      const complaint = await this.complaintService.getComplaintForUser(complaintId, userId);
      sendSuccess(res, complaint);
    } catch (error) {
      next(error);
    }
  };

  getAdminComplaints = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const statusFilter = isValidStatus(req.query.status) ? req.query.status : undefined;
      const reasonFilter = isValidReason(req.query.reason) ? req.query.reason : undefined;
      const reportIdParam =
        typeof req.query.report_id === 'string' && req.query.report_id.trim() !== ''
          ? Number(req.query.report_id)
          : undefined;
      const reportId = reportIdParam !== undefined && !Number.isNaN(reportIdParam) ? reportIdParam : undefined;

      const complaints = await this.complaintService.getComplaintsForAdmin({
        status: statusFilter,
        reason: reasonFilter,
        report_id: reportId,
      });

      sendSuccess(res, complaints);
    } catch (error) {
      next(error);
    }
  };

  getAdminComplaintById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const complaintId = Number(req.params.complaint_id);

      if (Number.isNaN(complaintId)) {
        res.status(400).json({ message: 'complaint_id inv\u00e1lido' });
        return;
      }

      const complaint = await this.complaintService.getComplaintForAdmin(complaintId);
      sendSuccess(res, complaint);
    } catch (error) {
      next(error);
    }
  };

  updateComplaintStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserId = (req as any).user?.user_id as string | undefined;
      if (!adminUserId) {
        res.status(401).json({ message: 'Usuario no autenticado' });
        return;
      }

      const complaintId = Number(req.params.complaint_id);
      if (Number.isNaN(complaintId)) {
        res.status(400).json({ message: 'complaint_id inv\u00e1lido' });
        return;
      }

      await this.complaintService.updateComplaintStatus(complaintId, adminUserId, req.body);
      sendSuccess(res, { message: 'Denuncia actualizada exitosamente' });
    } catch (error) {
      next(error);
    }
  };

  discardComplaint = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserId = (req as any).user?.user_id as string | undefined;
      if (!adminUserId) {
        res.status(401).json({ message: 'Usuario no autenticado' });
        return;
      }

      const complaintId = Number(req.params.complaint_id);
      if (Number.isNaN(complaintId)) {
        res.status(400).json({ message: 'complaint_id inv\u00e1lido' });
        return;
      }

      await this.complaintService.discardComplaint(complaintId, adminUserId, req.body.admin_notes);
      sendSuccess(res, { message: 'Denuncia descartada exitosamente' });
    } catch (error) {
      next(error);
    }
  };

  resolveComplaint = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminUserId = (req as any).user?.user_id as string | undefined;
      if (!adminUserId) {
        res.status(401).json({ message: 'Usuario no autenticado' });
        return;
      }

      const complaintId = Number(req.params.complaint_id);
      if (Number.isNaN(complaintId)) {
        res.status(400).json({ message: 'complaint_id inv\u00e1lido' });
        return;
      }

      await this.complaintService.resolveComplaintAndDeleteReport(complaintId, adminUserId, req.body.admin_notes);
      sendSuccess(res, { message: 'Denuncia resuelta y reporte eliminado' });
    } catch (error) {
      next(error);
    }
  };
}
