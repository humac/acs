export default {
  testEnvironment: 'node',
  transform: {},
  setupFiles: ['./jest.setup.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    '**/*.js',
    '!node_modules/**',
    '!coverage/**',
    '!jest.config.js',
    '!**/*.test.js',
    '!routes/**',
  ],
  coverageThreshold: {
    global: {
      branches: 25,
      functions: 35,
      lines: 30,
      statements: 30
    }
  },
  testMatch: [
    '**/__tests__/**/*.js',
    '**/*.test.js',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
  ],
};
