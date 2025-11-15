/**
 * TEST UNIT - ConversationController
 * Verifica todas las funcionalidades del controller de conversaciones
 */

const ConversationController = require('../../controllers/conversationController');
const dbConfig = require('../../config/database');

// Mock del database
jest.mock('../../config/database', () => ({
  executeQuery: jest.fn(),
  executeQueryWithParams: jest.fn()
}));

describe('ConversationController Tests', () => {
  let mockResponse;
  let mockRequest;

  beforeEach(() => {
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
    mockRequest = {
      params: {},
      body: {},
      query: {}
    };
    
    jest.clearAllMocks();
  });

  describe('getAllConversations', () => {
    test('Debería obtener todas las conversaciones exitosamente', async () => {
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

      dbConfig.executeQuery.mockResolvedValue({ recordset: mockConversations });

      await ConversationController.getAllConversations(mockRequest, mockResponse);

      expect(dbConfig.executeQuery).toHaveBeenCalledWith(expect.stringContaining('WhatsAppConversations'));
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockConversations,
        total: 2,
        timestamp: expect.any(String)
      });
    });

    test('Debería filtrar por conversaciones urgentes', async () => {
      mockRequest.query.urgent = 'true';
      const mockUrgentConversations = [
        {
          conversationid: 1,
          phone_number: '+34664218253',
          status: 'active',
          color_tag: 'orange',
          priority: 'high',
          patient_name: 'Juan Pérez'
        }
      ];

      dbConfig.executeQuery.mockResolvedValue({ recordset: mockUrgentConversations });

      await ConversationController.getAllConversations(mockRequest, mockResponse);

      expect(dbConfig.executeQuery).toHaveBeenCalledWith(expect.stringContaining("color_tag = 'orange'"));
    });

    test('Debería manejar errores de base de datos', async () => {
      dbConfig.executeQuery.mockRejectedValue(new Error('Database connection failed'));

      await ConversationController.getAllConversations(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error al obtener conversaciones',
        error: 'Database connection failed'
      });
    });
  });

  describe('getConversationById', () => {
    test('Debería obtener conversación específica con mensajes', async () => {
      mockRequest.params.id = '1';
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
          content: 'Hola, necesito una cita urgente',
          timestamp: '2025-11-16T06:00:00Z',
          direction: 'inbound'
        },
        {
          messageid: 2,
          content: 'Hola Juan, te atenderemos lo antes posible',
          timestamp: '2025-11-16T06:05:00Z',
          direction: 'outbound'
        }
      ];

      dbConfig.executeQuery
        .mockResolvedValueOnce({ recordset: [mockConversation] })
        .mockResolvedValueOnce({ recordset: mockMessages });

      await ConversationController.getConversationById(mockRequest, mockResponse);

      expect(dbConfig.executeQuery).toHaveBeenCalledTimes(2);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          conversation: mockConversation,
          messages: mockMessages
        }
      });
    });

    test('Debería retornar 404 si la conversación no existe', async () => {
      mockRequest.params.id = '999';
      dbConfig.executeQuery.mockResolvedValue({ recordset: [] });

      await ConversationController.getConversationById(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Conversación no encontrada'
      });
    });
  });

  describe('tagAsUrgent', () => {
    test('Debería etiquetar conversación como urgente correctamente', async () => {
      mockRequest.params.id = '1';
      mockRequest.body.notes = 'Paciente con dolor severo';
      mockRequest.body.taggedBy = 'Dr. Mario Rubio';

      dbConfig.executeQueryWithParams.mockResolvedValue({ rowsAffected: [1] });

      await ConversationController.tagAsUrgent(mockRequest, mockResponse);

      expect(dbConfig.executeQueryWithParams).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE WhatsAppConversations"),
        expect.objectContaining({
          id: 1,
          color_tag: 'orange',
          priority: 'high'
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Conversación marcada como urgente',
        timestamp: expect.any(String)
      });
    });

    test('Debería manejar errores al etiquetar como urgente', async () => {
      mockRequest.params.id = '1';
      mockRequest.body.notes = 'Error test';
      
      dbConfig.executeQueryWithParams.mockRejectedValue(new Error('Update failed'));

      await ConversationController.tagAsUrgent(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error al marcar conversación como urgente',
        error: 'Update failed'
      });
    });
  });

  describe('untagUrgent', () => {
    test('Debería remover etiqueta urgente correctamente', async () => {
      mockRequest.params.id = '1';
      mockRequest.body.notes = 'Situación resuelta';

      dbConfig.executeQueryWithParams.mockResolvedValue({ rowsAffected: [1] });

      await ConversationController.untagUrgent(mockRequest, mockResponse);

      expect(dbConfig.executeQueryWithParams).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE WhatsAppConversations"),
        expect.objectContaining({
          id: 1,
          color_tag: null,
          priority: 'normal'
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Etiqueta urgente removida',
        timestamp: expect.any(String)
      });
    });
  });

  describe('closeConversation', () => {
    test('Debería cerrar conversación correctamente', async () => {
      mockRequest.params.id = '1';

      dbConfig.executeQueryWithParams.mockResolvedValue({ rowsAffected: [1] });

      await ConversationController.closeConversation(mockRequest, mockResponse);

      expect(dbConfig.executeQueryWithParams).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE WhatsAppConversations SET status = 'closed'"),
        expect.objectContaining({
          id: 1
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Conversación cerrada exitosamente',
        timestamp: expect.any(String)
      });
    });
  });

  describe('getAIConfig', () => {
    test('Debería obtener configuración de IA', async () => {
      const mockConfig = {
        configid: 1,
        ai_enabled: true,
        ai_active_outside_hours: true,
        working_hours: {
          monday: { start: '10:00', end: '20:00' },
          tuesday: { start: '10:00', end: '20:00' }
        }
      };

      dbConfig.executeQuery.mockResolvedValue({ recordset: [mockConfig] });

      await ConversationController.getAIConfig(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockConfig
      });
    });
  });

  describe('updateAIConfig', () => {
    test('Debería actualizar configuración de IA', async () => {
      mockRequest.body = {
        ai_enabled: false,
        ai_active_outside_hours: true
      };

      dbConfig.executeQueryWithParams.mockResolvedValue({ rowsAffected: [1] });

      await ConversationController.updateAIConfig(mockRequest, mockResponse);

      expect(dbConfig.executeQueryWithParams).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE WhatsAppAIConfig"),
        expect.objectContaining({
          ai_enabled: false,
          ai_active_outside_hours: true
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Configuración de IA actualizada',
        timestamp: expect.any(String)
      });
    });

    test('Debería validar configuración inválida', async () => {
      mockRequest.body = {
        ai_enabled: 'invalid_boolean',
        ai_active_outside_hours: true
      };

      await ConversationController.updateAIConfig(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Configuración inválida. ai_enabled debe ser booleano.'
      });
    });
  });

  describe('createConversation', () => {
    test('Debería crear nueva conversación', async () => {
      mockRequest.body = {
        phone_number: '+34612345678',
        patient_id: 1,
        initial_message: 'Hola, necesito una cita'
      };

      dbConfig.executeQueryWithParams.mockResolvedValue({
        recordset: [{ conversationid: 123 }]
      });

      await ConversationController.createConversation(mockRequest, mockResponse);

      expect(dbConfig.executeQueryWithParams).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO WhatsAppConversations"),
        expect.objectContaining({
          phone_number: '+34612345678',
          patient_id: 1
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Conversación creada exitosamente',
        conversationId: 123
      });
    });
  });

  describe('addMessage', () => {
    test('Debería agregar mensaje a conversación', async () => {
      mockRequest.params.id = '1';
      mockRequest.body = {
        content: 'Nuevo mensaje del paciente',
        direction: 'inbound',
        timestamp: '2025-11-16T06:26:06Z'
      };

      dbConfig.executeQueryWithParams.mockResolvedValue({ rowsAffected: [1] });

      await ConversationController.addMessage(mockRequest, mockResponse);

      expect(dbConfig.executeQueryWithParams).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO WhatsAppMessages"),
        expect.objectContaining({
          content: 'Nuevo mensaje del paciente',
          direction: 'inbound'
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Mensaje agregado exitosamente',
        timestamp: expect.any(String)
      });
    });
  });
});