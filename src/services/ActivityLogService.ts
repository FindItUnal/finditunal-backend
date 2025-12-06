import ActivityLogModel, { ActivityLogRecord } from '../models/ActivityLogModel';

export interface LogActivityInput {
  event_type: string;
  actor_user_id?: string | null;
  target_type: string;
  target_id?: string | number | null;
  title: string;
  description?: string | null;
  metadata?: any;
}

export interface ActivityLogPage {
  items: ActivityLogRecord[];
  total: number;
  limit: number;
  offset: number;
}

export class ActivityLogService {
  constructor(private activityModel: ActivityLogModel) {}

  async logActivity(input: LogActivityInput): Promise<void> {
    try {
      await this.activityModel.createActivity(input);
    } catch (error) {
      // No romper el flujo principal si el log falla
      console.error('Error al registrar actividad (ignorando):', error);
    }
  }

  async getRecentActivities(params: { limit?: number; offset?: number }): Promise<ActivityLogPage> {
    const limit = Math.min(Math.max(params.limit ?? 10, 1), 50);
    const offset = Math.max(params.offset ?? 0, 0);

    const [items, total] = await Promise.all([
      this.activityModel.getActivities({ limit, offset }),
      this.activityModel.countActivities(),
    ]);

    return { items, total, limit, offset };
  }
}

