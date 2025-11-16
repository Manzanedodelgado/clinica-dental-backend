/**
 * SETUP DE TESTS - WhatsApp Conversations System
 * Configuración global antes de ejecutar tests
 */

// Configurar variables de entorno para testing
process.env.NODE_ENV = 'test';
process.env.DB_SERVER = 'localhost';
process.env.DB_DATABASE = 'TestDentalClinicDB';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.JWT_SECRET = 'test_jwt_secret_2025';
process.env.JWT_EXPIRES_IN = '1h';
process.env.WHATSAPP_PHONE_NUMBER = '34664218253';
process.env.AI_ENABLED = 'true';
process.env.AI_ACTIVE_OUTSIDE_HOURS = 'true';

// Configurar timezone para tests consistentes
process.env.TZ = 'Europe/Madrid';

// Configurar logging para tests (silencioso)
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Silenciar logs en tests a menos que se especifique DEBUG
  if (!process.env.DEBUG) {
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  }
});

afterAll(() => {
  // Restaurar console después de tests
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Configurar timeouts globales
jest.setTimeout(30000);

// Configurar mocks globales para Date
const mockDate = new Date('2025-11-16T06:26:06Z');
const RealDate = Date;

beforeEach(() => {
  // Mock Date.now para tests de timestamp
  global.Date = jest.fn(() => mockDate);
  global.Date.now = RealDate.now;
  global.Date.parse = RealDate.parse;
  global.Date.UTC = RealDate.UTC;
});

afterEach(() => {
  // Restaurar Date después de cada test
  global.Date = RealDate;
});

// Configurar mocks de red globales
beforeEach(() => {
  // Mock fetch si no está disponible
  if (!global.fetch) {
    global.fetch = jest.fn();
  }
  
  // Mock WebSocket si no está disponible
  if (!global.WebSocket) {
    global.WebSocket = jest.fn();
  }
});

// Configurar limpieza de mocks entre tests
afterEach(() => {
  jest.clearAllMocks();
});

// Configuración de console para debugging de tests
global.consoleDebug = {
  log: (...args) => {
    if (process.env.DEBUG) {
      originalConsoleLog('[DEBUG]', ...args);
    }
  },
  error: (...args) => {
    if (process.env.DEBUG) {
      originalConsoleError('[DEBUG ERROR]', ...args);
    }
  }
};

// Utilidades globales para tests
global.testUtils = {
  // Helper para crear mock de request/response
  createMockReqRes: (reqData = {}, resData = {}) => {
    return {
      request: {
        params: reqData.params || {},
        body: reqData.body || {},
        query: reqData.query || {},
        headers: reqData.headers || {},
        user: reqData.user || { id: 1, role: 'admin' }
      },
      response: {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        ...resData
      }
    };
  },

  // Helper para validar estructura de respuesta API
  validateApiResponse: (response, expectedStructure) => {
    expect(response).toHaveProperty('success');
    expect(typeof response.success).toBe('boolean');
    
    if (response.success) {
      if (expectedStructure.data) {
        expect(response).toHaveProperty('data');
      }
      if (expectedStructure.message) {
        expect(response).toHaveProperty('message');
        expect(typeof response.message).toBe('string');
      }
      if (expectedStructure.total) {
        expect(response).toHaveProperty('total');
        expect(typeof response.total).toBe('number');
      }
    } else {
      expect(response).toHaveProperty('message');
      expect(typeof response.message).toBe('string');
    }
  },

  // Helper para generar datos de test
  generateTestData: {
    conversation: () => ({
      conversationid: Math.floor(Math.random() * 1000) + 1,
      phone_number: `+346${Math.floor(Math.random() * 900000000) + 100000000}`,
      status: 'active',
      color_tag: Math.random() > 0.5 ? 'orange' : null,
      priority: Math.random() > 0.5 ? 'high' : 'normal',
      last_message_at: new Date().toISOString()
    }),

    message: (conversationId) => ({
      messageid: Math.floor(Math.random() * 1000) + 1,
      conversationid: conversationId || Math.floor(Math.random() * 100) + 1,
      content: `Test message ${Math.floor(Math.random() * 1000)}`,
      direction: Math.random() > 0.5 ? 'inbound' : 'outbound',
      timestamp: new Date().toISOString(),
      message_type: 'text'
    }),

    aiConfig: () => ({
      configid: 1,
      ai_enabled: true,
      ai_active_outside_hours: true,
      working_hours: {
        monday: { start: '10:00', end: '20:00' },
        tuesday: { start: '10:00', end: '20:00' },
        wednesday: { start: '10:00', end: '20:00' },
        thursday: { start: '10:00', end: '20:00' },
        friday: { start: '10:00', end: '14:00' }
      },
      urgent_keywords: 'urgente,emergencia,dolor,sangrado'
    })
  },

  // Helper para esperar async
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper para validar fechas
  isValidISODate: (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  },

  // Helper para simular errores de red
  simulateNetworkError: () => {
    const error = new Error('Network Error');
    error.code = 'ECONNREFUSED';
    return error;
  },

  // Helper para limpiar datos sensibles de logs
  sanitizeLogData: (data) => {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    const sanitized = { ...data };
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
};

// Configurar process handlers para limpieza
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Configuración específica para tests de WhatsApp
global.whatsappTestConfig = {
  mockPhoneNumber: '+34664218253',
  mockPatientId: 1,
  mockConversationId: 1,
  urgentKeywords: ['urgente', 'emergencia', 'dolor', 'sangrado'],
  normalKeywords: ['cita', 'consulta', 'información', 'precio']
};

// Exponer utilities globalmente para uso en tests
global.expect.extend({
  toBeValidPhoneNumber(received) {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    const pass = phoneRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid phone number`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid phone number`,
        pass: false
      };
    }
  },

  toBeValidISODate(received) {
    const date = new Date(received);
    const pass = date instanceof Date && !isNaN(date) && received === date.toISOString();
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid ISO date`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid ISO date`,
        pass: false
      };
    }
  },

  toContainValidConversationData(received) {
    const requiredFields = ['conversationid', 'phone_number', 'status'];
    const pass = requiredFields.every(field => field in received);
    
    if (pass) {
      return {
        message: () => `expected object not to contain valid conversation data`,
        pass: true
      };
    } else {
      return {
        message: () => `expected object to contain valid conversation data with fields: ${requiredFields.join(', ')}`,
        pass: false
      };
    }
  }
});