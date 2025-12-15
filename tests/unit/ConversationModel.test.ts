import ConversationModel, { ConversationRecord } from '../../src/models/ConversationModel';
import { MySQLDatabase } from '../../src/database/mysql';

type DatabaseProvider = Pick<typeof MySQLDatabase, 'getInstance'>;

const createDbMocks = () => {
  const connection = {
    query: jest.fn(),
    release: jest.fn(),
  };

  const dbInstance = {
    getConnection: jest.fn().mockResolvedValue(connection),
  };

  const dbProvider: jest.Mocked<DatabaseProvider> = {
    getInstance: jest.fn().mockResolvedValue(dbInstance as never),
  };

  return { connection, dbInstance, dbProvider };
};

const baseConversation: ConversationRecord = {
  conversation_id: 1,
  report_id: 10,
  user1_id: 'owner',
  user2_id: 'participant',
  created_at: new Date('2024-01-01T00:00:00Z'),
  updated_at: new Date('2024-01-02T00:00:00Z'),
};

describe('ConversationModel', () => {
  it('returns an existing conversation when already stored', async () => {
    const { connection, dbProvider } = createDbMocks();
    const model = new ConversationModel(dbProvider);

    connection.query.mockResolvedValueOnce([[baseConversation] as never]);

    const result = await model.findOrCreateByReportAndUsers({
      report_id: baseConversation.report_id,
      owner_id: baseConversation.user1_id,
      participant_id: baseConversation.user2_id,
    });

    expect(result.created).toBe(false);
    expect(result.conversation).toEqual(baseConversation);
    expect(connection.query).toHaveBeenCalledTimes(1);
    expect(connection.release).toHaveBeenCalledTimes(1);
  });

  it('creates and returns a new conversation when it does not exist', async () => {
    const { connection, dbProvider } = createDbMocks();
    const model = new ConversationModel(dbProvider);

    const insertResult = { insertId: 20, affectedRows: 1 };
    const insertedConversation: ConversationRecord = {
      ...baseConversation,
      conversation_id: 20,
    };

    connection.query
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([insertResult as never])
      .mockResolvedValueOnce([[insertedConversation] as never]);

    const result = await model.findOrCreateByReportAndUsers({
      report_id: insertedConversation.report_id,
      owner_id: insertedConversation.user1_id,
      participant_id: insertedConversation.user2_id,
    });

    expect(result.created).toBe(true);
    expect(result.conversation).toEqual(insertedConversation);
    expect(connection.query).toHaveBeenCalledTimes(3);
    expect(connection.release).toHaveBeenCalledTimes(1);
  });

  it('evaluates existsByReportAndUsers based on the query result', async () => {
    const { connection, dbProvider } = createDbMocks();
    const model = new ConversationModel(dbProvider);

    connection.query.mockResolvedValueOnce([[{ conversation_id: 1 }] as never]);
    const exists = await model.existsByReportAndUsers({
      report_id: 1,
      owner_id: 'owner',
      participant_id: 'participant',
    });
    expect(exists).toBe(true);

    connection.query.mockResolvedValueOnce([[]]);
    const notExists = await model.existsByReportAndUsers({
      report_id: 2,
      owner_id: 'owner',
      participant_id: 'participant',
    });
    expect(notExists).toBe(false);
    expect(connection.release).toHaveBeenCalledTimes(2);
  });
});
