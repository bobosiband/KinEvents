import type { Config } from 'jest'

const jestConfig: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
}

module.exports = jestConfig

export { jestConfig }