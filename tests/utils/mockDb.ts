import { MySQLDatabase } from '../../src/database/mysql';

export const mockDatabase = () => {
  const connection = {
    query: jest.fn(),
    release: jest.fn(),
    ping: jest.fn().mockResolvedValue(undefined),
  };

  const dbInstance = {
    getConnection: jest.fn().mockResolvedValue(connection),
    close: jest.fn(),
  };

  const getInstanceSpy = jest
    .spyOn(MySQLDatabase, 'getInstance')
    .mockResolvedValue(dbInstance as unknown as MySQLDatabase);

  return { connection, dbInstance, getInstanceSpy };
};
