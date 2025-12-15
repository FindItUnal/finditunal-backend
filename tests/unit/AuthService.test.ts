import jwt from 'jsonwebtoken';
import { AuthService } from '../../src/services/AuthService';
import UserModel from '../../src/models/UserModel';
import { ActivityLogService } from '../../src/services/ActivityLogService';
import { JWT_CONFIG } from '../../src/config';
import { UnauthorizedError } from '../../src/utils/errors';

const createAuthService = () => {
  const userModel = {
    getUserById: jest.fn(),
  };

  const activityLogService = {
    logActivity: jest.fn(),
  };

  const service = new AuthService(
    userModel as unknown as UserModel,
    activityLogService as unknown as ActivityLogService,
  );

  return { service, userModel, activityLogService };
};

describe('AuthService.refreshAccessToken', () => {
  it('returns a new access token when the refresh token is valid', async () => {
    const { service, userModel } = createAuthService();
    jest.spyOn(jwt, 'verify').mockReturnValue({ user_id: 'user-1' } as any);
    const jwtSignSpy = jest.spyOn(jwt, 'sign').mockReturnValue('signed-token' as any);

    userModel.getUserById.mockResolvedValueOnce({
      user_id: 'user-1',
      role: 'user',
      is_active: 1,
    } as any);

    const token = await service.refreshAccessToken('refresh-token');

    expect(token).toBe('signed-token');
    expect(jwtSignSpy).toHaveBeenCalledWith(
      { user_id: 'user-1', role: 'user' },
      JWT_CONFIG.ACCESS_TOKEN_SECRET,
      { expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN },
    );
  });

  it('throws UnauthorizedError when jwt verification fails', async () => {
    const { service } = createAuthService();
    jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('invalid token');
    });

    await expect(service.refreshAccessToken('bad')).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws UnauthorizedError when the user does not exist', async () => {
    const { service, userModel } = createAuthService();
    jest.spyOn(jwt, 'verify').mockReturnValue({ user_id: 'missing-user' } as any);
    userModel.getUserById.mockResolvedValueOnce(null);

    await expect(service.refreshAccessToken('refresh')).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws UnauthorizedError when the user is not active', async () => {
    const { service, userModel } = createAuthService();
    jest.spyOn(jwt, 'verify').mockReturnValue({ user_id: 'user-1' } as any);
    userModel.getUserById.mockResolvedValueOnce({
      user_id: 'user-1',
      role: 'user',
      is_active: 0,
    } as any);

    await expect(service.refreshAccessToken('refresh')).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
