const nextJest = require('next/jest')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  // Since this config file lives in ./config, point to the project root
  dir: projectRoot,
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  rootDir: projectRoot,
  setupFilesAfterEnv: ['<rootDir>/config/jest.setup.js'],
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you based on your tsconfig.json paths)
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig) 