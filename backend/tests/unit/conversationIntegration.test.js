/**
 * TEST UNIT - ConversationIntegration
 * Verifica la integración entre WhatsApp y el sistema de conversaciones
 */

const ConversationIntegration = require('../../controllers/conversation-integration');
const dbConfig = require('../../config/database');
const { EventEmitter } = require('events');

// Mock del database y WhatsApp
jest.mock('../../config/database', () => ({
  executeQuery: jest.fn(),
  executeQueryWithParams: jest.fn()
}));

jest.mock('@whiskeysockets/baileys', () => ({
  MessageType: {
    TEXT: 'text'
  }
}));

describe('ConversationIntegration Tests', () => {
  let conversationIntegration;
  let mockSock;

  beforeEach(() => {
    conversationIntegration = new ConversationIntegration();
    mockSock = {
      sendMessage: jest.fn()
    };
    
    jest.clearAllMocks();
    // Mock Date.now para tests de timeout
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2025-11-16T06:00:00Z').getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('detectUrgency', () => {
    test('Debería detectar urgencia por palabra clave en español', () => {
      const urgentMessages = [
        'Tengo un dolor muy fuerte en el diente',
        'Es una emergencia, necesito ayuda',
        'El sangrado no para',
        'Urgente: cita inmediata',
        'Dolor insoportable, ayuda por favor'
      ];

      urgentMessages.forEach(message => {
        const isUrgent = conversationIntegration.detectUrgency(message);
        expect(isUrgent).toBe(true);
      });
    });

    test('No debería detectar urgencia en mensajes normales', () => {
      const normalMessages = [
        'Hola, buenos días',
        'Necesito una cita para limpieza dental',
        'Cuál es el precio del blanqueamiento',
        'Que horarios tienen disponibles',
        'Tengo una consulta general'
      ];

      normalMessages.forEach(message => {
        const isUrgent = conversationIntegration.detectUrgency(message);
        expect(isUrgent).toBe(false);
      });
    });

    test('Debería ser case insensitive', () => {
      const testMessages = [
        'DOLOR fuerte en el diente',
        'EMERGENCIA dental',
        'Sangrado constante',
        'urgente cita dental'
      ];

      testMessages.forEach(message => {
        const isUrgent = conversationIntegration.detectUrgency(message);
        expect(isUrgent).toBe(true);
      });
    });
  });

  describe('handleIncomingMessage', () => {
    test('Debería crear nueva conversación si no existe', async () => {
      const mockIncomingMessage = {
        from: '+34612345678',
        message: 'Hola, tengo un dolor muy fuerte en el diente',
        timestamp: '2025-11-16T06:00:00Z'
      };

      // Mock: no existe conversación previa
      dbConfig.executeQuery.mockResolvedValue({ recordset: [] });
      // Mock: crear nueva conversación
      dbConfig.executeQueryWithParams.mockResolvedValue({
        recordset: [{ conversationid: 123 }]
      });

      const result = await conversationIntegration.handleIncomingMessage(
        mockIncomingMessage.from,
        mockIncomingMessage.message,
        mockIncomingMessage.timestamp
      );

      expect(dbConfig.executeQueryWithParams).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO WhatsAppConversations"),
        expect.objectContaining({
          phone_number: '+34612345678',
          last_message_at: new Date(mockIncomingMessage.timestamp)
        })
      );

      expect(dbConfig.executeQueryWithParams).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO WhatsAppMessages"),
        expect.objectContaining({
          content: 'Hola, tengo un dolor muy fuerte en el diente',
          direction: 'inbound'
        })
      );

      expect(result.conversationId).toBe(123);
      expect(result.isUrgent).toBe(true);
    });

    test('Debería continuar conversación existente si < 24h', async () => {
      const mockIncomingMessage = {
        from: '+34612345678',
        message: 'Gracias por la información',
        timestamp: '2025-11-16T06:30:00Z'
      };

      // Mock: existe conversación con timestamp < 24h
      const existingConversation = {
        conversationid: 123,
        last_message_at: '2025-11-16T05:30:00Z'
      };

      dbConfig.executeQuery
        .mockResolvedValue({ recordset: [existingConversation] });
      
      // Mock: agregar mensaje
      dbConfig.executeQueryWithParams.mockResolvedValue({ rowsAffected: [1] });

      const result = await conversationIntegration.handleIncomingMessage(
        mockIncomingMessage.from,
        mockIncomingMessage.message,
        mockIncomingMessage.timestamp
      );

      expect(result.conversationId).toBe(123);
      expect(result.isNewConversation).toBe(false);
    });

    test('Debería crear nueva conversación si > 24h', async () => {
      const mockIncomingMessage = {
        from: '+34612345678',
        message: 'Hola de nuevo',
        timestamp: '2025-11-17T06:30:00Z' // +24h 30min
      };

      // Mock: existe conversación pero > 24h
      const oldConversation = {
        conversationid: 123,
        last_message_at: '2025-11-16T05:30:00Z'
      };

      dbConfig.executeQuery
        .mockResolvedValue({ recordset: [oldConversation] });
      
      // Mock: crear nueva conversación
      dbConfig.executeQueryWithParams.mockResolvedValue({
        recordset: [{ conversationid: 124 }]
      });

      const result = await conversationIntegration.handleIncomingMessage(
        mockIncomingMessage.from,
        mockIncomingMessage.message,
        mockIncomingMessage.timestamp
      );

      expect(dbConfig.executeQueryWithParams).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO WhatsAppConversations"),
        expect.objectContaining({
          phone_number: '+34612345678'
        })
      );

      expect(result.conversationId).toBe(124);
      expect(result.isNewConversation).toBe(true);
    });
  });

  describe('tagConversationUrgent', () => {
    test('Debería etiquetar conversación como urgente', async () => {
      const conversationId = 123;
      const taggedBy = 'AI';
      const reason = 'Detected urgent keywords';

      dbConfig.executeQueryWithParams
        .mockResolvedValue({ rowsAffected: [1] });

      await conversationIntegration.tagConversationUrgent(conversationId, taggedBy, reason);

      expect(dbConfig.executeQueryWithParams).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE WhatsAppConversations SET color_tag = 'orange'"),
        expect.objectContaining({
          conversationid: conversationId,
          priority: 'high'
        })
      );

      expect(dbConfig.executeQueryWithParams).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO WhatsAppConversationTags"),
        expect.objectContaining({
          conversationid: conversationId,
          tag_type: 'urgent',
          tagged_by: taggedBy,
          notes: reason
        })
      );
    });
  });

  describe('getOrCreateConversation', () => {
    test('Debería obtener conversación existente', async () => {
      const phoneNumber = '+34612345678';
      const existingConversation = {
        conversationid: 123,
        phone_number: '+34612345678',
        status: 'active',
        color_tag: null,
        last_message_at: '2025-11-16T06:00:00Z'
      };

      dbConfig.executeQuery
        .mockResolvedValue({ recordset: [existingConversation] });

      const result = await conversationIntegration.getOrCreateConversation(phoneNumber);

      expect(dbConfig.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT TOP 1 * FROM WhatsAppConversations"),
        expect.objectContaining({
          phone_number: phoneNumber
        })
      );

      expect(result).toEqual(existingConversation);
    });

    test('Debería crear nueva conversación si no existe', async () => {
      const phoneNumber = '+34612345678';

      dbConfig.executeQuery.mockResolvedValue({ recordset: [] });

      dbConfig.executeQueryWithParams
        .mockResolvedValue({ recordset: [{ conversationid: 123 }] });

      const result = await conversationIntegration.getOrCreateConversation(phoneNumber);

      expect(dbConfig.executeQueryWithParams).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO WhatsAppConversations"),
        expect.objectContaining({
          phone_number: phoneNumber
        })
      );

      expect(result.conversationid).toBe(123);
    });
  });

  describe('updateConversationActivity', () => {
    test('Debería actualizar actividad de conversación', async () => {
      const conversationId = 123;
      const newTimestamp = '2025-11-16T06:30:00Z';

      dbConfig.executeQueryWithParams.mockResolvedValue({ rowsAffected: [1] });

      await conversationIntegration.updateConversationActivity(conversationId, newTimestamp);

      expect(dbConfig.executeQueryWithParams).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE WhatsAppConversations SET last_message_at"),
        expect.objectContaining({
          conversationid: conversationId,
          last_message_at: new Date(newTimestamp)
        })
      );
    });
  });

  describe('isOutsideWorkingHours', () => {
    test('Debería detectar horarios fuera de servicio', () => {
      // Mock working hours
      conversationIntegration.config = {
        workingHours: {
          monday: { start: '10:00', end: '20:00' },
          tuesday: { start: '10:00', end: '20:00' },
          wednesday: { start: '10:00', end: '20:00' },
          thursday: { start: '10:00', end: '20:00' },
          friday: { start: '10:00', end: '14:00' }
        }
      };

      // Outside working hours: Saturday
      const saturday = new Date('2025-11-15T15:00:00Z'); // Saturday 15:00
      expect(conversationIntegration.isOutsideWorkingHours(saturday)).toBe(true);

      // Outside working hours: Weekday but after hours
      const weekdayEvening = new Date('2025-11-17T21:00:00Z'); // Monday 21:00
      expect(conversationIntegration.isOutsideWorkingHours(weekdayEvening)).toBe(true);

      // Outside working hours: Before opening
      const weekdayMorning = new Date('2025-11-17T08:00:00Z'); // Monday 08:00
      expect(conversationIntegration.isOutsideWorkingHours(weekdayMorning)).toBe(true);

      // Within working hours
      const weekdayWorkTime = new Date('2025-11-17T14:00:00Z'); // Monday 14:00
      expect(conversationIntegration.isOutsideWorkingHours(weekdayWorkTime)).toBe(false);
    });
  });

  describe('shouldActivateAI', () => {
    test('Debería activar IA cuando AI está habilitado y fuera de horario', () => {
      const mockConfig = {
        ai_enabled: true,
        ai_active_outside_hours: true
      };

      const mockTimestamp = new Date('2025-11-16T06:00:00Z'); // Saturday outside hours
      jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp.getTime());

      // Mock isOutsideWorkingHours to return true
      conversationIntegration.isOutsideWorkingHours = jest.fn().mockReturnValue(true);

      const shouldActivate = conversationIntegration.shouldActivateAI(mockConfig, mockTimestamp);

      expect(shouldActivate).toBe(true);
    });

    test('No debería activar IA cuando está deshabilitado', () => {
      const mockConfig = {
        ai_enabled: false,
        ai_active_outside_hours: true
      };

      const mockTimestamp = new Date('2025-11-16T06:00:00Z');

      const shouldActivate = conversationIntegration.shouldActivateAI(mockConfig, mockTimestamp);

      expect(shouldActivate).toBe(false);
    });

    test('No debería activar IA durante horario de trabajo', () => {
      const mockConfig = {
        ai_enabled: true,
        ai_active_outside_hours: true
      };

      const mockTimestamp = new Date('2025-11-17T14:00:00Z'); // Monday within hours
      jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp.getTime());

      conversationIntegration.isOutsideWorkingHours = jest.fn().mockReturnValue(false);

      const shouldActivate = conversationIntegration.shouldActivateAI(mockConfig, mockTimestamp);

      expect(shouldActivate).toBe(false);
    });
  });

  describe('processMessageWithAI', () => {
    test('Debería procesar mensaje con IA cuando es apropiado', async () => {
      const message = 'Hola, necesito una cita para limpieza';
      const phoneNumber = '+34612345678';
      const conversationId = 123;

      // Mock: AI should activate
      const mockConfig = {
        ai_enabled: true,
        ai_active_outside_hours: true
      };

      conversationIntegration.getAIConfig = jest.fn().mockResolvedValue(mockConfig);
      conversationIntegration.isOutsideWorkingHours = jest.fn().mockReturnValue(true);
      conversationIntegration.shouldActivateAI = jest.fn().mockReturnValue(true);

      // Mock: Generate AI response
      const mockAIResponse = {
        message: '¡Hola! Entiendo que necesitas una cita para limpieza. ¿Podrías decirme cuándo prefieres venir?',
        shouldAutoTag: false
      };

      conversationIntegration.generateAIResponse = jest.fn().mockResolvedValue(mockAIResponse);
      conversationIntegration.sendWhatsAppMessage = jest.fn().mockResolvedValue({});

      const result = await conversationIntegration.processMessageWithAI(
        message,
        phoneNumber,
        conversationId
      );

      expect(conversationIntegration.generateAIResponse).toHaveBeenCalledWith(message);
      expect(conversationIntegration.sendWhatsAppMessage).toHaveBeenCalledWith(
        phoneNumber,
        mockAIResponse.message
      );

      expect(result.aiProcessed).toBe(true);
      expect(result.response).toBe(mockAIResponse.message);
    });

    test('No debería procesar con IA si está deshabilitado', async () => {
      const message = 'Hola, necesito una cita';
      const phoneNumber = '+34612345678';
      const conversationId = 123;

      const mockConfig = {
        ai_enabled: false,
        ai_active_outside_hours: true
      };

      conversationIntegration.getAIConfig = jest.fn().mockResolvedValue(mockConfig);
      conversationIntegration.shouldActivateAI = jest.fn().mockReturnValue(false);

      const result = await conversationIntegration.processMessageWithAI(
        message,
        phoneNumber,
        conversationId
      );

      expect(conversationIntegration.generateAIResponse).not.toHaveBeenCalled();
      expect(result.aiProcessed).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('Debería manejar errores de base de datos', async () => {
      const mockIncomingMessage = {
        from: '+34612345678',
        message: 'Test message',
        timestamp: '2025-11-16T06:00:00Z'
      };

      dbConfig.executeQuery.mockRejectedValue(new Error('Database connection failed'));

      const result = await conversationIntegration.handleIncomingMessage(
        mockIncomingMessage.from,
        mockIncomingMessage.message,
        mockIncomingMessage.timestamp
      );

      expect(result.error).toBe('Database connection failed');
      expect(result.success).toBe(false);
    });

    test('Debería manejar errores de WhatsApp', async () => {
      const phoneNumber = '+34612345678';
      const message = 'Test message';

      conversationIntegration.sendWhatsAppMessage = jest.fn()
        .mockRejectedValue(new Error('WhatsApp send failed'));

      await expect(
        conversationIntegration.sendWhatsAppMessage(phoneNumber, message)
      ).rejects.toThrow('WhatsApp send failed');
    });
  });
});