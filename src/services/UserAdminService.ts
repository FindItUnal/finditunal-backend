import UserModel, { UserRecord, UserWithStats } from '../models/UserModel';
import ReportModel from '../models/ReportModel';
import ComplaintModel from '../models/ComplaintModel';
import { BOT_AUTH } from '../config';
import { ConflictError, NotFoundError } from '../utils/errors';
import ActivityLogModel from '../models/ActivityLogModel';
import { ActivityLogService } from './ActivityLogService';

export type AdminUserSummary = Pick<
  UserRecord,
  'user_id' | 'email' | 'name' | 'phone_number' | 'role' | 'is_active' | 'created_at' | 'updated_at'
>;

export type UserDetailWithStats = Pick<
  UserWithStats,
  'user_id' | 'email' | 'name' | 'phone_number' | 'role' | 'is_active' | 'created_at' | 'updated_at'
> & {
  total_reports: number;
  delivered_reports: number;
};

export interface AdminUsersResponse {
  total_users: number;
  active_users: number;
  users: AdminUserSummary[];
}

export interface AdminDashboardStats {
  total_users: number;
  new_users_last_7_days: number;
  total_reports: number;
  reports_today: number;
  active_complaints: number;
  recovered_reports_current_month: number;
  recovery_rate_current_month: number;
  active_users_percentage: number;
  resolved_complaints_percentage_current_month: number;
}

export class UserAdminService {
  private activityLog: ActivityLogService;
  private reportModel: ReportModel;
  private complaintModel: ComplaintModel;

  constructor(private userModel: UserModel) {
    this.activityLog = new ActivityLogService(new ActivityLogModel());
    this.reportModel = new ReportModel();
    this.complaintModel = new ComplaintModel();
  }

  async listUsers(requesterId: string): Promise<AdminUsersResponse> {
    const excludeIds: string[] = [];
    if (requesterId) {
      excludeIds.push(requesterId);
    }
    if (BOT_AUTH.USER_ID) {
      excludeIds.push(BOT_AUTH.USER_ID);
    }

    const records = await this.userModel.listUsers({ excludeUserIds: excludeIds });
    const users: AdminUserSummary[] = records.map((user) => ({
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      phone_number: user.phone_number,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
    }));

    const activeUsers = users.filter((user) => user.is_active === 1).length;

    return {
      total_users: users.length,
      active_users: activeUsers,
      users,
    };
  }

  async getUserDetail(userId: string): Promise<UserDetailWithStats> {
    const user = await this.userModel.getUserWithStats(userId);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    return {
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      phone_number: user.phone_number,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
      total_reports: user.total_reports ?? 0,
      delivered_reports: user.delivered_reports ?? 0,
    };
  }

  async getDashboardStats(): Promise<AdminDashboardStats> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalUsers,
      newUsersLast7Days,
      activeUsers,
      totalReports,
      reportsToday,
      reportsCurrentMonth,
      deliveredCurrentMonth,
      activeComplaints,
      complaintsCurrentMonth,
      complaintsResolvedCurrentMonth,
    ] = await Promise.all([
      this.userModel.countAllUsers(),
      this.userModel.countUsersCreatedSince(sevenDaysAgo),
      this.userModel.countActiveUsers(),
      this.reportModel.countAllReports(),
      this.reportModel.countReportsCreatedSince(todayStart),
      this.reportModel.countReportsCreatedInRange(monthStart, nextMonthStart),
      this.reportModel.countDeliveredReportsInRange(monthStart, nextMonthStart),
      this.complaintModel.countComplaintsByStatuses(['pending', 'in_review']),
      this.complaintModel.countComplaintsCreatedInRange(monthStart, nextMonthStart),
      this.complaintModel.countComplaintsResolvedInRange(monthStart, nextMonthStart),
    ]);

    const recoveryRateCurrentMonth =
      reportsCurrentMonth > 0 ? Math.round((deliveredCurrentMonth / reportsCurrentMonth) * 100) : 0;

    const activeUsersPercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

    const resolvedComplaintsPercentageCurrentMonth =
      complaintsCurrentMonth > 0 ? Math.round((complaintsResolvedCurrentMonth / complaintsCurrentMonth) * 100) : 0;

    return {
      total_users: totalUsers,
      new_users_last_7_days: newUsersLast7Days,
      total_reports: totalReports,
      reports_today: reportsToday,
      active_complaints: activeComplaints,
      recovered_reports_current_month: deliveredCurrentMonth,
      recovery_rate_current_month: recoveryRateCurrentMonth,
      active_users_percentage: activeUsersPercentage,
      resolved_complaints_percentage_current_month: resolvedComplaintsPercentageCurrentMonth,
    };
  }

  async banUser(targetUserId: string, adminId: string): Promise<void> {
    if (!adminId) {
      throw new ConflictError('Administrador no autenticado');
    }

    if (targetUserId === adminId) {
      throw new ConflictError('No puedes banearte a ti mismo');
    }

    if (BOT_AUTH.USER_ID && targetUserId === BOT_AUTH.USER_ID) {
      throw new ConflictError('No puedes banear al bot del sistema');
    }

    const user = await this.userModel.getUserById(targetUserId);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    if (user.role === 'admin') {
      throw new ConflictError('No puedes banear a otro administrador');
    }

    if (user.is_active === 2) {
      throw new ConflictError('El usuario ya se encuentra baneado');
    }

    const safeBase = user.user_id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'user';
    const suffix = Date.now().toString(36);

    const anonymizedGoogleId = `banned_${safeBase}_${suffix}`;

    await this.userModel.banUser(user.user_id, {
      google_id: anonymizedGoogleId,
      name: 'Usuario Baneado',
      phone_number: null,
    });

    await this.activityLog.logActivity({
      event_type: 'USER_BANNED',
      actor_user_id: adminId,
      target_type: 'USER',
      target_id: targetUserId,
      title: `Usuario suspendido: ${user.email}`,
      description: `El administrador ${adminId} suspende al usuario ${targetUserId}`,
      metadata: {
        user_id: targetUserId,
        email: user.email,
      },
    });
  }
}
