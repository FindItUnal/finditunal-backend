import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/index';
import { createRealModels } from '../utils/modelFactory';
import { mockDatabase } from '../utils/mockDb';
import { JWT_CONFIG } from '../../src/config';
import { ReportWithImage } from '../../src/services/ReportService';

const createToken = (payload: { user_id: string; role?: 'user' | 'admin' }) =>
  jwt.sign(payload, JWT_CONFIG.ACCESS_TOKEN_SECRET);

describe('GET /user/:user_id/reports', () => {
  it('returns the reports of the authenticated user', async () => {
    mockDatabase();
    const models = createRealModels();

    const reports: ReportWithImage[] = [
      {
        report_id: 1,
        user_id: 'user-1',
        category_id: 1,
        location_id: 2,
        title: 'Billetera',
        description: 'Negra',
        status: 'perdido',
        date_lost_or_found: new Date('2024-01-01T00:00:00Z'),
        contact_method: 'email',
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
      },
    ];
    jest.spyOn(models.reportModel, 'getReportsByUserId').mockResolvedValue(reports as any);

    const { app } = await createApp({ models });
    const token = createToken({ user_id: 'user-1', role: 'user' });

    const response = await request(app).get('/user/user-1/reports').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe('Billetera');
    expect(models.reportModel.getReportsByUserId).toHaveBeenCalledWith('user-1');
  });

  it('returns 403 when requesting other user reports', async () => {
    mockDatabase();
    const models = createRealModels();
    jest.spyOn(models.reportModel, 'getReportsByUserId').mockResolvedValue([]);

    const { app } = await createApp({ models });
    const token = createToken({ user_id: 'user-1', role: 'user' });

    const response = await request(app).get('/user/another-user/reports').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toContain('No tienes permiso para realizar esta');
    expect(models.reportModel.getReportsByUserId).not.toHaveBeenCalled();
  });
});
