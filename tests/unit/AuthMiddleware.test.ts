import { Request, Response, NextFunction } from 'express';

const verifyMock = jest.fn();

jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: {
    verify: (...args: any[]) => verifyMock(...args),
  },
  verify: (...args: any[]) => verifyMock(...args),
}));

jest.mock('../../src/config', () => ({
  BOT_AUTH: {
    ACCESS_TOKEN: 'bot-token',
    USER_ID: 'bot-user',
    ROLE: 'admin',
  },
  JWT_CONFIG: {
    ACCESS_TOKEN_SECRET: 'secret',
  },
}));

import { authenticate } from '../../src/middlewares/authMiddleware';

const createResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return res as unknown as Response & {
    status: jest.Mock;
    json: jest.Mock;
  };
};

const createRequest = (overrides: Partial<Request> = {}): Request => {
  return {
    headers: {},
    cookies: {},
    params: { user_id: 'user-1' },
    body: {},
    ...overrides,
  } as Request;
};

describe('authenticate middleware', () => {
  beforeEach(() => {
    verifyMock.mockReset();
  });

  it('returns 401 when no token is provided', () => {
    const req = createRequest();
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token no proporcionado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('authorizes bot tokens from headers', () => {
    const req = createRequest({
      headers: { authorization: 'Bearer bot-token' },
    });
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    authenticate(req, res, next);

    expect((req as any).user).toEqual({ user_id: 'bot-user', role: 'admin' });
    expect(next).toHaveBeenCalled();
  });

  it('verifies JWT tokens and attaches payload to the request', () => {
    const req = createRequest({
      headers: { authorization: 'Bearer jwt-token' },
    });
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    verifyMock.mockImplementationOnce((_token, _secret, callback: any) => {
      callback(null, { user_id: 'user-1', role: 'user' });
    });

    authenticate(req, res, next);

    expect(verifyMock).toHaveBeenCalled();
    expect((req as any).user).toEqual({ user_id: 'user-1', role: 'user' });
    expect(req.body.user).toEqual({ user_id: 'user-1', role: 'user' });
    expect(next).toHaveBeenCalled();
  });

  it('allows admins to access other user resources', () => {
    const req = createRequest({
      headers: { authorization: 'Bearer jwt-token' },
      params: { user_id: 'someone-else' },
    });
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    verifyMock.mockImplementationOnce((_token, _secret, callback: any) => {
      callback(null, { user_id: 'admin-1', role: 'admin' });
    });

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('rejects invalid JWT tokens', () => {
    const req = createRequest({
      headers: { authorization: 'Bearer bad' },
    });
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    verifyMock.mockImplementationOnce((_token, _secret, callback: any) => {
      callback(new Error('invalid'), undefined);
    });

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token inválido' });
    expect(next).not.toHaveBeenCalled();
  });
});
