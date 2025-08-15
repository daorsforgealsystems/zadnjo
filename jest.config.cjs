module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    './config': '<rootDir>/src/lib/__mocks__/config.js',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};