import request from 'supertest';
import { createApp } from '../../src/index';
import { createRealModels } from '../utils/modelFactory';
import { mockDatabase } from '../utils/mockDb';
describe('GET /health', () => {
  it('returns status ok when the database ping succeeds', async () => {
    const { connection } = mockDatabase();
    const { app } = await createApp({
      models: createRealModels(),
    });

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'ok',
      database: 'connected',
    });
    expect(connection.ping).toHaveBeenCalledTimes(1);
  });

  it('returns 503 when the database connection fails', async () => {
    const { getInstanceSpy } = mockDatabase();
    const { app } = await createApp({
      models: createRealModels(),
    });

    getInstanceSpy.mockImplementationOnce(() => Promise.reject(new Error('DB down')));

    const response = await request(app).get('/health');

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      status: 'error',
      database: 'disconnected',
    });
  });
});
