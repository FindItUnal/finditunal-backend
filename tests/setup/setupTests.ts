import path from 'path';
import dotenv from 'dotenv';

process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});
