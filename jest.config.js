module.exports = {
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '!**/__tests__/**/*.test.tsx',
    '**/*.test.ts',
    '!**/*.test.tsx',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/web-build/',
    '/.expo/',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  // Previously scoped to src/utils + src/types only, which hid the fact that
  // screens, components, contexts, hooks and navigation (the vast majority of
  // the app) had zero test coverage — the 40%/75% thresholds below only ever
  // applied to a small, cherry-picked slice. Widened to the whole src/ tree so
  // the number this reports is honest, even though it's now much lower.
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  // Honest current baseline across the WHOLE src/ tree, not just the slice
  // that happened to be tested — screens, components, contexts, hooks and
  // navigation still have ~0% coverage; that's tracked work, not hidden by
  // narrowing collectCoverageFrom. These numbers are a floor: they should
  // only ever move up as more of the app gets test coverage, never down.
  coverageThreshold: {
    global: {
      branches: 1,
      functions: 1,
      lines: 1,
      statements: 1,
    },
    './src/utils/syncEngine.ts': {
      branches: 80,
      functions: 70,
      lines: 90,
      statements: 90,
    },
    './src/utils/profanityFilter.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/utils/contrastChecker.ts': {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  setupFilesAfterEnv: [],
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};
