// As per new specs we can avoid double configuration for the mapping
// https://kulshekhar.github.io/ts-jest/docs/27.1/getting-started/paths-mapping#jest-config-with-helper

const { pathsToModuleNameMapper } = require('ts-jest');
// In the following statement, replace `./tsconfig` with the path to your `tsconfig` file
// which contains the path mapping (ie the `compilerOptions.paths` option):
const { compilerOptions } = require('./tsconfig.spec.json');

module.exports = {
  preset:             'ts-jest',
  testEnvironment:    'jsdom',
  setupFilesAfterEnv: ['./jest.setup.js'],
  watchman:           false,

  // tell Jest to handle `*.vue` files
  moduleFileExtensions: ['js', 'json', 'vue', 'ts'],

  // Paths
  roots:                    ['<rootDir>'],
  modulePaths:              [compilerOptions.baseUrl], // <-- This will be set to 'baseUrl' value
  moduleNameMapper:         pathsToModuleNameMapper(compilerOptions.paths /*, { prefix: '<rootDir>/' } */),
  modulePathIgnorePatterns: [
    '<rootDir>/cypress/',
    '<rootDir>/scripts/',
    '<rootDir>/docusaurus/',
    '<rootDir>/stories/',
    '<rootDir>/shell/scripts/',
    '<rootDir>/drone',
    '<rootDir>/.nuxt',
    '<rootDir>/.nuxt-prod',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>(/.*)*/__tests__/utils/',
  ],

  // Babel
  transform: {
    '^.+\\.js$':   '<rootDir>/node_modules/babel-jest', // process js with `babel-jest`
    '.*\\.(vue)$': '<rootDir>/node_modules/@vue/vue2-jest', // process `*.vue` files with `vue-jest`
    '^.+\\.tsx?$': 'ts-jest', // process `*.ts` files with `ts-jest`
    '^.+\\.svg$':  '<rootDir>/svgTransform.js' // to mock `*.svg` files
  },
  snapshotSerializers: ['<rootDir>/node_modules/jest-serializer-vue'],

  // Coverage
  coverageDirectory:   '<rootDir>/coverage/unit',
  coverageReporters:   ['json', 'text-summary'],
  collectCoverage:     false,
  collectCoverageFrom: [
    '<rootDir>/shell/**/*.{vue,ts,js}',
    '<rootDir>/pkg/rancher-components/src/components/**/*.{vue,ts,js}',
    '!<rootDir>/shell/scripts/',
  ],

  // Globals
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsconfig:        'tsconfig.spec.json'
    }
  },
};
