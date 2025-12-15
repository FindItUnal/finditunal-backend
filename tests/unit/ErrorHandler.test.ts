import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../src/middlewares/errorHandler';
import { AppError } from '../../src/utils/errors';

const sendErrorMock = jest.fn();

jest.mock('../../src/utils/responseHandler', () => ({
  sendError: (...args: any[]) => sendErrorMock(...args),
}));

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

describe('errorHandler middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('formats Zod errors as 400 responses', () => {
    const req = {} as Request;
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    const zodError = {
      name: 'ZodError',
      issues: [{ path: ['field'], message: 'Invalid' }],
    };

    errorHandler(zodError as any, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error de validación',
      errors: { field: ['Invalid'] },
    });
    expect(sendErrorMock).not.toHaveBeenCalled();
  });

  it('delegates AppErrors to sendError', () => {
    const req = {} as Request;
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    const appError = new AppError(418, 'Teapot');
    errorHandler(appError, req, res, next);

    expect(sendErrorMock).toHaveBeenCalledWith(res, appError);
  });

  it('wraps unknown errors with sendError', () => {
    const req = {} as Request;
    const res = createResponse();
    const next = jest.fn() as NextFunction;
    const unknown = new Error('boom');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler(unknown, req, res, next);

    expect(sendErrorMock).toHaveBeenCalledWith(res, unknown);
    consoleSpy.mockRestore();
  });
});
