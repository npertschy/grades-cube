import type { Config } from '@jest/types'
import { defaults } from 'jest-config'

const config: Config.InitialOptions = {
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'vue'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.vue$': 'vue-jest'
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
}

export default config
