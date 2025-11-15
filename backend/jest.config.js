/**
 * CONFIGURACIÓN DE JEST - WhatsApp Conversations System
 * Configuración completa para ejecutar todos los tests
 */

module.exports = {
  // Entorno de testing
  testEnvironment: 'node',

  // Directorios donde buscar tests
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],

  // Directorios a ignorar
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/'
  ],

  // Patrón para archivos de setup
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],

  // Cobertura de código
  collectCoverage: true,
  coverageDirectory: 'test-reports/coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/config/database.js',
    '/server.js'
  ],

  // Configuración de reporteres
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './test-reports',
        filename: 'test-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'WhatsApp Conversations System - Test Report'
      }
    ]
  ],

  // Configuración de módulos
  moduleFileExtensions: [
    'js',
    'json'
  ],

  // Variables de entorno para tests
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },

  // Configuración de timeouts
  testTimeout: 30000, // 30 segundos

  // Configuración de verbose output
  verbose: true,

  // Configuración de clear mocks entre tests
  clearMocks: true,
  restoreMocks: true,

  // Configuración de transform para módulos ES6
  transform: {},

  // Configuración de globals
  globals: {
    'NODE_ENV': 'test'
  },

  // Configuración específica por tipo de test
  projects: [
    {
      displayName: 'Unit Tests',
      testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
      collectCoverageFrom: [
        'controllers/**/*.js',
        'utils/**/*.js',
        'middleware/**/*.js',
        'models/**/*.js'
      ]
    },
    {
      displayName: 'Integration Tests',
      testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
      collectCoverageFrom: [
        'routes/**/*.js',
        'controllers/**/*.js',
        'middleware/**/*.js'
      ]
    },
    {
      displayName: 'API Tests',
      testMatch: ['<rootDir>/tests/api/**/*.test.js'],
      collectCoverageFrom: [
        'routes/**/*.js',
        'controllers/**/*.js',
        'middleware/**/*.js'
      ],
      testTimeout: 15000
    },
    {
      displayName: 'Database Tests',
      testMatch: ['<rootDir>/tests/database/**/*.test.js'],
      collectCoverageFrom: [
        'scripts/**/*.js',
        'config/**/*.js'
      ],
      testTimeout: 20000
    }
  ],

  // Configuración de watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],

  // Configuración de max workers
  maxWorkers: '50%',

  // Configuración de bail (parar en el primer fallo)
  bail: false,

  // Configuración de force exit
  forceExit: true,

  // Configuración de detect open handles
  detectOpenHandles: true
};