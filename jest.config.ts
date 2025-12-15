import type { Config } from 'jest';

const createProject = (displayName: string, testMatch: string[]): Config => ({
  displayName,
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  clearMocks: true,
  setupFilesAfterEnv: ['<rootDir>/tests/setup/setupTests.ts'],
  testMatch,
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
});

const config: Config = {
  rootDir: '.',
  projects: [
    createProject('unit', ['<rootDir>/tests/unit/**/*.test.ts']),
    createProject('integration', ['<rootDir>/tests/integration/**/*.test.ts']),
  ],
};

export default config;
