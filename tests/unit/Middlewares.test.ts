import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate, validateParams } from '../../src/middlewares/validationMiddleware';
import { authorizeAdmin } from '../../src/middlewares/roleMiddleware';

const createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return res as unknown as Response & {
    status: jest.Mock;
    json: jest.Mock;
  };
};

describe('validation middleware', () => {
  it('passes control to next when the body is valid', () => {
    const schema = z.object({ name: z.string().min(1) });
    const req = { body: { name: 'Test' } } as Request;
    const res = createMockResponse();
    const next = jest.fn() as NextFunction;

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.body).toEqual({ name: 'Test' });
  });

  it('responds with 400 when the body is invalid', () => {
    const schema = z.object({ name: z.string().min(1) });
    const req = { body: { name: '' } } as Request;
    const res = createMockResponse();
    const next = jest.fn() as NextFunction;

    validate(schema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.any(String),
        errors: expect.any(Object),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('validates params and mutates req.params when valid', () => {
    const schema = z.string().uuid();
    const req = { params: { id: '550e8400-e29b-41d4-a716-446655440000' } } as unknown as Request;
    const res = createMockResponse();
    const next = jest.fn() as NextFunction;

    validateParams(schema, 'id')(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.params.id).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('rejects invalid params and returns 400', () => {
    const schema = z.string().uuid();
    const req = { params: { id: 'invalid' } } as unknown as Request;
    const res = createMockResponse();
    const next = jest.fn() as NextFunction;

    validateParams(schema, 'id')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('authorizeAdmin middleware', () => {
  it('calls next when role is admin', () => {
    const req = { user: { role: 'admin' } } as unknown as Request & { user: { role: string } };
    const res = createMockResponse();
    const next = jest.fn() as NextFunction;

    authorizeAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('returns 403 when user is not admin', () => {
    const req = { user: { role: 'user' } } as unknown as Request & { user: { role: string } };
    const res = createMockResponse();
    const next = jest.fn() as NextFunction;

    authorizeAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Acceso denegado' });
    expect(next).not.toHaveBeenCalled();
  });
});
