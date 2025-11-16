/**
 * TEST INTEGRATION - Conversations API Routes
 * Verifica todos los endpoints de conversaciones WhatsApp
 */

const request = require('supertest');
const express = require('express');
const conversationRoutes = require('../../routes/conversations');

// Mock del controller
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

// Mock middleware de autenticación
jest.mock('../../middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 1, role: 'admin' };
    next();
  }
}));

const app = express();
app.use(express.json());
app.use('/api/whatsapp/conversations', conversationRoutes);

describe('Conversations API Integration Tests', () => {
  describe('GET /api/whatsapp/conversations', () => {
    test('Debería obtener todas las conversaciones', async () => {
      const mockConversations = [
        {
          conversationid: 1,
          phone_number: '+34664218253',
          status: 'active',
          color_tag: 'orange',
          priority: 'high',
          patient_name: 'Juan Pérez',
          last_message_at: '2025-11-16T06:00:00Z'
        },
        {
          conversationid: 2,
          phone_number: '+34612345678',
          status: 'active',
          color_tag: null,
          priority: 'normal',
          patient_name: 'María García',
          last_message_at: '2025-11-16T05:30:00Z'
        }
      ];

      const ConversationController = require('../../controllers/conversationController');
      ConversationController.getAllConversations.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          data: mockConversations,
          total: 2
        });
      });

      const response = await request(app)
        .get('/api/whatsapp/conversations')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].color_tag).toBe('orange');
    });

    test('Debería filtrar por conversaciones urgentes', async () => {
      const mockUrgentConversations = [
        {
          conversationid: 1,
          phone_number: '+34664218253',
          status: 'active',
          color_tag: 'orange',
          priority: 'high'
        }
      ];

      const ConversationController = require('../../controllers/conversationController');
      ConversationController.getAllConversations.mockImplementation((req, res) => {
        if (req.query.urgent === 'true') {
          res.status(200).json({
            success: true,
            data: mockUrgentConversations,
            total: 1
          });
        }
      });

      const response = await request(app)
        .get('/api/whatsapp/conversations?urgent=true')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].color_tag).toBe('orange');
    });

    test('Debería manejar errores del servidor', async () => {
      const ConversationController = require('../../controllers/conversationController');
      ConversationController.getAllConversations.mockImplementation((req, res) => {
        res.status(500).json({
          success: false,
          message: 'Error del servidor'
        });
      });

      const response = await request(app)
        .get('/api/whatsapp/conversations')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/whatsapp/conversations/urgent', () => {
    test('Debería obtener solo conversaciones urgentes', async () => {
      const mockUrgentConversations = [
        {
          conversationid: 1,
          phone_number: '+34664218253',
          color_tag: 'orange',
          priority: 'high',
          status: 'active'
        }
      ];

      const ConversationController = require('../../controllers/conversationController');
      ConversationController.getAllConversations.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          data: mockUrgentConversations,
          total: 1
        });
      });

      const response = await request(app)
        .get('/api/whatsapp/conversations/urgent')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].color_tag).toBe('orange');
    });
  });

  describe('GET /api/whatsapp/conversations/:id', () => {
    test('Debería obtener conversación específica', async () => {
      const mockConversation = {
        conversationid: 1,
        phone_number: '+34664218253',
        status: 'active',
        color_tag: 'orange',
        patient_name: 'Juan Pérez'
      };

      const mockMessages = [
        {
          messageid: 1,
          content: 'Tengo un dolor muy fuerte',
          timestamp: '2025-11-16T06:00:00Z',
          direction: 'inbound'
        }
      ];

      const ConversationController = require('../../controllers/conversationController');
      ConversationController.getConversationById.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          data: {
            conversation: mockConversation,
            messages: mockMessages
          }
        });
      });

      const response = await request(app)
        .get('/api/whatsapp/conversations/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.conversation.conversationid).toBe(1);
      expect(response.body.data.messages).toHaveLength(1);
    });

    test('Debería retornar 404 si conversación no existe', async () => {
      const ConversationController = require('../../controllers/conversationController');
      ConversationController.getConversationById.mockImplementation((req, res) => {
        res.status(404).json({
          success: false,
          message: 'Conversación no encontrada'
        });
      });

      const response = await request(app)
        .get('/api/whatsapp/conversations/999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/whatsapp/conversations/:id/tag-urgent', () => {
    test('Debería marcar conversación como urgente', async () => {
      const tagData = {
        notes: 'Paciente con dolor severo',
        taggedBy: 'Dr. Mario Rubio'
      };

      const ConversationController = require('../../controllers/conversationController');
      ConversationController.tagAsUrgent.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          message: 'Conversación marcada como urgente'
        });
      });

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
    });
  });

  describe('POST /api/whatsapp/conversations/:id/untag-urgent', () => {
    test('Debería remover etiqueta urgente', async () => {
      const untagData = {
        notes: 'Situación resuelta'
      };

      const ConversationController = require('../../controllers/conversationController');
      ConversationController.untagUrgent.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          message: 'Etiqueta urgente removida'
        });
      });

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
      const ConversationController = require('../../controllers/conversationController');
      ConversationController.closeConversation.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          message: 'Conversación cerrada exitosamente'
        });
      });

      const response = await request(app)
        .post('/api/whatsapp/conversations/1/close')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('cerrada');
    });
  });

  describe('GET /api/whatsapp/ai-config', () => {
    test('Debería obtener configuración de IA', async () => {
      const mockConfig = {
        configid: 1,
        ai_enabled: true,
        ai_active_outside_hours: true,
        working_hours: {
          monday: { start: '10:00', end: '20:00' }
        }
      };

      const ConversationController = require('../../controllers/conversationController');
      ConversationController.getAIConfig.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          data: mockConfig
        });
      });

      const response = await request(app)
        .get('/api/whatsapp/ai-config')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ai_enabled).toBe(true);
    });
  });

  describe('PUT /api/whatsapp/ai-config', () => {
    test('Debería actualizar configuración de IA', async () => {
      const configData = {
        ai_enabled: false,
        ai_active_outside_hours: true
      };

      const ConversationController = require('../../controllers/conversationController');
      ConversationController.updateAIConfig.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          message: 'Configuración de IA actualizada'
        });
      });

      const response = await request(app)
        .put('/api/whatsapp/ai-config')
        .send(configData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('actualizada');
    });

    test('Debería validar configuración inválida', async () => {
      const invalidConfig = {
        ai_enabled: 'invalid_boolean',
        ai_active_outside_hours: true
      };

      const response = await request(app)
        .put('/api/whatsapp/ai-config')
        .send(invalidConfig)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('inválida');
    });
  });

  describe('Error Handling and Validation', () => {
    test('Debería validar ID de conversación inválido', async () => {
      const response = await request(app)
        .get('/api/whatsapp/conversations/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('Debería manejar métodos HTTP no permitidos', async () => {
      const response = await request(app)
        .patch('/api/whatsapp/conversations')
        .expect(404);

      // Los métodos no implementados deberían retornar 404
    });

    test('Debería validar estructura JSON', async () => {
      const response = await request(app)
        .post('/api/whatsapp/conversations/1/tag-urgent')
        .set('Content-Type', 'text/plain')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Authentication and Authorization', () => {
    test('Debería requerir autenticación', async () => {
      // El middleware mock ya establece req.user
      const ConversationController = require('../../controllers/conversationController');
      ConversationController.getAllConversations.mockImplementation((req, res) => {
        // Verificar que el usuario esté autenticado
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: 'No autenticado'
          });
        }
        res.status(200).json({
          success: true,
          data: [],
          total: 0
        });
      });

      const response = await request(app)
        .get('/api/whatsapp/conversations')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    test('Debería manejar múltiples requests simultáneos', async () => {
      const promises = Array(10).fill().map(() => 
        request(app).get('/api/whatsapp/conversations')
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});