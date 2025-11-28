import UserModel, { UserRecord, UserWithStats } from '../models/UserModel';
import { BOT_AUTH } from '../config';
import { ConflictError, NotFoundError } from '../utils/errors';

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

export class UserAdminService {
  constructor(private userModel: UserModel) {}

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
  }
}
