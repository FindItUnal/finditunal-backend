import { Request, Response, NextFunction } from 'express';
import { ActivityLogService } from '../services/ActivityLogService';
import { sendSuccess } from '../utils/responseHandler';

export class ActivityLogController {
  constructor(private activityService: ActivityLogService) {}

  getAdminActivityLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limitParam = req.query.limit as string | undefined;
      const offsetParam = req.query.offset as string | undefined;

      const limit = limitParam ? parseInt(limitParam, 10) : undefined;
      const offset = offsetParam ? parseInt(offsetParam, 10) : undefined;

      const page = await this.activityService.getRecentActivities({ limit, offset });

      sendSuccess(res, page);
    } catch (error) {
      next(error);
    }
  };
}

