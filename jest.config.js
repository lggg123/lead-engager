module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1', // Map path aliases (e.g., @/lib/utils)
    },
  };