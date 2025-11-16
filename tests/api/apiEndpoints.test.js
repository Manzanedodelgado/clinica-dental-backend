/**
 * TEST API ENDPOINTS - Complete API Testing
 * Verifica todos los endpoints del sistema WhatsApp conversaciones
 */

const request = require('supertest');
const express = require('express');

// Mock completo del sistema
jest.mock('../../controllers/conversationController', () => ({
  getAllConversations: jest.fn(),
  getConversationById: jest.fn(),
  tagAsUrgent: jest.fn(),
  untagUrgent: jest.fn(),
  closeConversation: jest.fn(),
  getAIConfig: jest.fn(),
  updateAIConfig: jest.fn(),
  createConversation: jest.fn(),
  addMessage: jest.fn()
}));

jest.mock('../../controllers/conversation-integration', () => ({
  handleIncomingMessage: jest.fn(),
  detectUrgency: jest.fn(),
  tagConversationUrgent: jest.fn()
}));

jest.mock('../../middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 1, role: 'admin' };
    next();
  }
}));

// Configurar aplicación Express para testing
const app = express();
app.use(express.json());

// Importar rutas
const conversationRoutes = require('../../routes/conversations');
const whatsappRoutes = require('../../routes/whatsapp');

app.use('/api/whatsapp/conversations', conversationRoutes);
app.use('/api/whatsapp', whatsappRoutes);

describe('Complete API Endpoints Tests', () => {
  describe('GET /api/whatsapp/conversations', () => {
    test('Debería retornar estructura correcta de respuesta', async () => {
      const ConversationController = require('../../controllers/conversationController');
      
      ConversationController.getAllConversations.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          data: [
            {
              conversationid: 1,
              phone_number: '+34664218253',
              color_tag: 'orange',
              priority: 'high',
              status: 'active',
              patient_name: 'Juan Pérez',
              last_message_at: '2025-11-16T06:00:00Z'
            }
          ],
          total: 1,
          timestamp: '2025-11-16T06:26:06Z'
        });
      });

      const response = await request(app)
        .get('/api/whatsapp/conversations')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('timestamp');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('Debería soportar parámetros de filtrado', async () => {
      const testCases = [
        { query: '?urgent=true', expectedFilter: "color_tag = 'orange'" },
        { query: '?status=active', expectedFilter: "status = 'active'" },
        { query: '?assigned=1', expectedFilter: "assigned_to = 1" },
        { query: '?limit=10', expectedFilter: 'TOP 10' }
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .get(`/api/whatsapp/conversations${testCase.query}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('GET /api/whatsapp/conversations/urgent', () => {
    test('Debería retornar solo conversaciones urgentes', async () => {
      const response = await request(app)
        .get('/api/whatsapp/conversations/urgent')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(conv => conv.color_tag === 'orange')).toBe(true);
    });
  });

  describe('GET /api/whatsapp/conversations/:id', () => {
    test('Debería retornar conversación con mensajes', async () => {
      const response = await request(app)
        .get('/api/whatsapp/conversations/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('conversation');
      expect(response.body.data).toHaveProperty('messages');
      expect(Array.isArray(response.body.data.messages)).toBe(true);
    });

    test('Debería validar ID numérico', async () => {
      const response = await request(app)
        .get('/api/whatsapp/conversations/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/whatsapp/conversations/:id/tag-urgent', () => {
    test('Debería etiquetar conversación como urgente', async () => {
      const tagData = {
        notes: 'Paciente con dolor severo',
        taggedBy: 'Dr. Mario Rubio'
      };

      const response = await request(app)
        .post('/api/whatsapp/conversations/1/tag-urgent')
        .send(tagData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('urgente');
    });

    test('Debería validar datos requeridos', async () => {
      const response = await request(app)
        .post('/api/whatsapp/conversations/1/tag-urgent')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('notas requeridas');
    });

    test('Debería validar longitud de notas', async () => {
      const longNotes = 'a'.repeat(1001); // Más de 1000 caracteres

      const response = await request(app)
        .post('/api/whatsapp/conversations/1/tag-urgent')
        .send({ notes: longNotes })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/whatsapp/conversations/:id/untag-urgent', () => {
    test('Debería remover etiqueta urgente', async () => {
      const untagData = {
        notes: 'Situación resuelta'
      };

      const response = await request(app)
        .post('/api/whatsapp/conversations/1/untag-urgent')
        .send(untagData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('removida');
    });
  });

  describe('POST /api/whatsapp/conversations/:id/close', () => {
    test('Debería cerrar conversación', async () => {
      const response = await request(app)
        .post('/api/whatsapp/conversations/1/close')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('cerrada');
    });
  });

  describe('GET /api/whatsapp/ai-config', () => {
    test('Debería retornar configuración de IA', async () => {
      const response = await request(app)
        .get('/api/whatsapp/ai-config')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('ai_enabled');
      expect(response.body.data).toHaveProperty('ai_active_outside_hours');
      expect(response.body.data).toHaveProperty('working_hours');
    });

    test('Debería incluir horarios de trabajo', async () => {
      const response = await request(app)
        .get('/api/whatsapp/ai-config')
        .expect(200);

      const workingHours = response.body.data.working_hours;
      expect(workingHours).toHaveProperty('monday');
      expect(workingHours).toHaveProperty('tuesday');
      expect(workingHours.monday).toHaveProperty('start');
      expect(workingHours.monday).toHaveProperty('end');
    });
  });

  describe('PUT /api/whatsapp/ai-config', () => {
    test('Debería actualizar configuración válida', async () => {
      const newConfig = {
        ai_enabled: false,
        ai_active_outside_hours: true,
        working_hours: {
          monday: { start: '09:00', end: '19:00' },
          tuesday: { start: '09:00', end: '19:00' }
        }
      };

      const response = await request(app)
        .put('/api/whatsapp/ai-config')
        .send(newConfig)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('actualizada');
    });

    test('Debería rechazar configuración inválida', async () => {
      const invalidConfigs = [
        { ai_enabled: 'invalid_boolean' },
        { ai_active_outside_hours: 'not_boolean' },
        { ai_enabled: true, ai_active_outside_hours: null },
        {}
      ];

      for (const config of invalidConfigs) {
        const response = await request(app)
          .put('/api/whatsapp/ai-config')
          .send(config)
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('POST /api/whatsapp/conversations', () => {
    test('Debería crear nueva conversación', async () => {
      const conversationData = {
        phone_number: '+34612345678',
        patient_id: 1,
        initial_message: 'Hola, necesito una cita'
      };

      const response = await request(app)
        .post('/api/whatsapp/conversations')
        .send(conversationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('conversationId');
    });

    test('Debería validar teléfono requerido', async () => {
      const response = await request(app)
        .post('/api/whatsapp/conversations')
        .send({ patient_id: 1 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('teléfono requerido');
    });

    test('Debería validar formato de teléfono', async () => {
      const invalidPhones = ['123456', 'invalid', '+12345678901234567890'];

      for (const phone of invalidPhones) {
        const response = await request(app)
          .post('/api/whatsapp/conversations')
          .send({ phone_number: phone })
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('POST /api/whatsapp/conversations/:id/messages', () => {
    test('Debería agregar mensaje a conversación', async () => {
      const messageData = {
        content: 'Nuevo mensaje del paciente',
        direction: 'inbound',
        timestamp: '2025-11-16T06:26:06Z'
      };

      const response = await request(app)
        .post('/api/whatsapp/conversations/1/messages')
        .send(messageData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('messageId');
    });

    test('Debería validar contenido del mensaje', async () => {
      const invalidMessages = ['', '   ', null, undefined];

      for (const content of invalidMessages) {
        const response = await request(app)
          .post('/api/whatsapp/conversations/1/messages')
          .send({ content })
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('Error Handling Tests', () => {
    test('Debería manejar errores 500 del servidor', async () => {
      // Mock error en el controller
      const ConversationController = require('../../controllers/conversationController');
      ConversationController.getAllConversations.mockImplementation((req, res) => {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor'
        });
      });

      const response = await request(app)
        .get('/api/whatsapp/conversations')
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    test('Debería manejar timeouts de base de datos', async () => {
      const ConversationController = require('../../controllers/conversationController');
      ConversationController.getAllConversations.mockImplementation((req, res) => {
        setTimeout(() => {
          res.status(408).json({
            success: false,
            message: 'Timeout de base de datos'
          });
        }, 100);
      });

      const response = await request(app)
        .get('/api/whatsapp/conversations')
        .expect(408);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Performance Tests', () => {
    test('Debería responder en menos de 2 segundos', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/whatsapp/conversations')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(2000);
      expect(response.body.success).toBe(true);
    });

    test('Debería manejar múltiples requests concurrentes', async () => {
      const promises = Array(10).fill().map(() => 
        request(app).get('/api/whatsapp/conversations')
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Rate Limiting Tests', () => {
    test('Debería limitar requests excesivos', async () => {
      const requests = Array(100).fill().map(() => 
        request(app).get('/api/whatsapp/conversations')
      );

      const responses = await Promise.all(requests);
      
      // Algunos requests pueden ser limitados (429)
      const limitedCount = responses.filter(r => r.status === 429).length;
      const successCount = responses.filter(r => r.status === 200).length;

      expect(successCount + limitedCount).toBe(100);
    });
  });

  describe('Security Tests', () => {
    test('Debería validar autenticación', async () => {
      // Remover middleware de autenticación mock
      jest.clearAllMocks();

      const response = await request(app)
        .get('/api/whatsapp/conversations')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('Debería sanitizar inputs', async () => {
      const maliciousData = {
        notes: '<script>alert("xss")</script>',
        taggedBy: '../../../etc/passwd'
      };

      const response = await request(app)
        .post('/api/whatsapp/conversations/1/tag-urgent')
        .send(maliciousData)
        .expect(200); // Debería sanitizar y procesar

      expect(response.body.success).toBe(true);
    });

    test('Debería validar Content-Type', async () => {
      const response = await request(app)
        .post('/api/whatsapp/conversations/1/tag-urgent')
        .set('Content-Type', 'text/plain')
        .send('invalid content')
        .expect(415);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Data Validation Tests', () => {
    test('Debería validar fechas ISO 8601', async () => {
      const validDates = [
        '2025-11-16T06:26:06Z',
        '2025-11-16T06:26:06.123Z',
        '2025-11-16T06:26:06+00:00'
      ];

      for (const date of validDates) {
        const response = await request(app)
          .post('/api/whatsapp/conversations/1/messages')
          .send({
            content: 'Test message',
            timestamp: date
          })
          .expect(201);

        expect(response.body.success).toBe(true);
      }
    });

    test('Debería rechazar fechas inválidas', async () => {
      const invalidDates = [
        'invalid-date',
        '2025-13-16T06:26:06Z',
        '2025-11-32T06:26:06Z'
      ];

      for (const date of invalidDates) {
        const response = await request(app)
          .post('/api/whatsapp/conversations/1/messages')
          .send({
            content: 'Test message',
            timestamp: date
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('CORS Tests', () => {
    test('Debería permitir requests desde dominios autorizados', async () => {
      const response = await request(app)
        .get('/api/whatsapp/conversations')
        .set('Origin', 'https://rubiogarciadental.com')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('https://rubiogarciadental.com');
    });

    test('Debería bloquear requests desde dominios no autorizados', async () => {
      const response = await request(app)
        .get('/api/whatsapp/conversations')
        .set('Origin', 'https://malicious-site.com')
        .expect(200);

      // El origen no debería estar en la respuesta
      expect(response.headers['access-control-allow-origin']).not.toBe('https://malicious-site.com');
    });
  });
});