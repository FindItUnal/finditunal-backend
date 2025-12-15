import request from 'supertest';
import { createApp } from '../../src/index';
import { createRealModels } from '../utils/modelFactory';
import { mockDatabase } from '../utils/mockDb';
import { AuthService } from '../../src/services/AuthService';

describe('POST /auth/refresh-token', () => {
  it('refreshes the access token when a valid refresh cookie is present', async () => {
    mockDatabase();
    const refreshSpy = jest.spyOn(AuthService.prototype, 'refreshAccessToken').mockResolvedValue('new-access-token');

    const { app } = await createApp({
      models: createRealModels(),
    });

    const response = await request(app).post('/auth/refresh-token').set('Cookie', 'refreshToken=valid-refresh');

    expect(refreshSpy).toHaveBeenCalledWith('valid-refresh');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Access token refrescado' });
    expect(response.headers['set-cookie']).toEqual(expect.arrayContaining([expect.stringContaining('accessToken=')]));
  });

  it('returns 401 when the refresh cookie is missing', async () => {
    mockDatabase();
    const refreshSpy = jest.spyOn(AuthService.prototype, 'refreshAccessToken').mockResolvedValue('new-access-token');

    const { app } = await createApp({
      models: createRealModels(),
    });

    const response = await request(app).post('/auth/refresh-token');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Refresh token no proporcionado' });
    expect(refreshSpy).not.toHaveBeenCalled();
  });
});
