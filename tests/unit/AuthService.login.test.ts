import { AuthService } from '../../src/services/AuthService';
import UserModel from '../../src/models/UserModel';
import { ActivityLogService } from '../../src/services/ActivityLogService';

jest.mock('../../src/config', () => ({
  ACCESS_RULES: {
    ALLOWED_DOMAIN: '@unal.edu.co',
    ADMIN_EMAIL: 'admin@unal.edu.co',
  },
  GOOGLE_OAUTH_CONFIG: {
    CLIENT_ID: 'client-id',
    CLIENT_SECRET: 'client-secret',
    REDIRECT_URI: 'redirect-uri',
    SCOPES: ['openid', 'email'],
  },
  JWT_CONFIG: {
    ACCESS_TOKEN_SECRET: 'access-secret',
    REFRESH_TOKEN_SECRET: 'refresh-secret',
    ACCESS_TOKEN_EXPIRES_IN: '10m',
    REFRESH_TOKEN_EXPIRES_IN: '30m',
  },
}));

const mockGetToken = jest.fn();
const mockVerifyIdToken = jest.fn();

jest.mock('google-auth-library', () => {
  class MockOAuth2Client {
    getToken = mockGetToken;
    verifyIdToken = mockVerifyIdToken;
  }
  return {
    OAuth2Client: jest.fn(() => new MockOAuth2Client()),
  };
});

const createService = () => {
  const userModel = {
    getUserByGoogleId: jest.fn(),
    getUserByEmail: jest.fn(),
    createUserFromGoogle: jest.fn(),
    restoreUserIdentity: jest.fn(),
    getUserById: jest.fn(),
    updateUser: jest.fn(),
  };
  const activityLog = {
    logActivity: jest.fn(),
  };

  const service = new AuthService(
    userModel as unknown as UserModel,
    activityLog as unknown as ActivityLogService,
  );

  return { service, userModel, activityLog };
};

const buildPayload = (overrides?: Partial<ReturnType<ReturnType<typeof mockVerifyIdToken>>>) => ({
  email: 'user@unal.edu.co',
  sub: 'google-id',
  name: 'Usuario Uno',
  ...overrides,
});

describe('AuthService.loginWithGoogle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetToken.mockResolvedValue({ tokens: { id_token: 'id-token' } });
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => buildPayload(),
    });
  });

  it('logs in an existing user from an allowed domain', async () => {
    const { service, userModel } = createService();
    const existingUser = {
      user_id: 'user-1',
      email: 'user@unal.edu.co',
      name: 'Usuario Uno',
      google_id: 'google-id',
      role: 'user',
      is_active: 1,
      phone_number: '123',
    };
    userModel.getUserByGoogleId.mockResolvedValue(existingUser);

    const result = await service.loginWithGoogle('auth-code');

    expect(result.user).toMatchObject({
      user_id: 'user-1',
      email: 'user@unal.edu.co',
      role: 'user',
    });
    expect(userModel.createUserFromGoogle).not.toHaveBeenCalled();
  });

  it('creates a new user when google_id is unknown and logs activity', async () => {
    const { service, userModel, activityLog } = createService();
    const createdUser = {
      user_id: 'generated-id',
      email: 'user@unal.edu.co',
      name: 'Usuario Uno',
      google_id: 'google-id',
      role: 'user',
      is_active: 1,
    };

    userModel.getUserByGoogleId.mockResolvedValueOnce(null).mockResolvedValue(createdUser);
    userModel.getUserByEmail.mockResolvedValue(null);
    userModel.getUserById.mockResolvedValueOnce(null).mockResolvedValue(createdUser);
    userModel.createUserFromGoogle.mockResolvedValue(undefined);

    const result = await service.loginWithGoogle('code');

    expect(result.user.user_id).toBe(createdUser.user_id);
    expect(userModel.createUserFromGoogle).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: expect.any(String),
        email: 'user@unal.edu.co',
      }),
    );
    expect(activityLog.logActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'USER_REGISTERED',
        actor_user_id: expect.any(String),
      }),
    );
  });

  it('rejects users outside the allowed domain', async () => {
    const { service } = createService();
    mockVerifyIdToken.mockResolvedValueOnce({
      getPayload: () => buildPayload({ email: 'user@gmail.com' }),
    });

    await expect(service.loginWithGoogle('code')).rejects.toThrow('Dominio de correo no permitido');
  });
});

describe('AuthService profile helpers', () => {
  it('returns user info and updates profile', async () => {
    const { service, userModel } = createService();
    const user = {
      user_id: 'user-1',
      email: 'user@unal.edu.co',
      name: 'User',
      phone_number: '123',
      role: 'user',
      is_active: 1,
    };
    userModel.getUserById.mockResolvedValue(user);

    const info = await service.getUserInfo('user-1');
    expect(info).toEqual(user);

    await service.updateUser('user-1', { name: 'Updated' } as any);
    expect(userModel.updateUser).toHaveBeenCalledWith('user-1', { name: 'Updated' });
  });

  it('throws when updating or fetching a missing user', async () => {
    const { service, userModel } = createService();
    userModel.getUserById.mockResolvedValue(null);

    await expect(service.getUserInfo('missing')).rejects.toThrow('Usuario no encontrado');
    await expect(service.updateUser('missing', { name: 'X' } as any)).rejects.toThrow('Usuario no encontrado');
  });
});
