/**
 * TEST DATABASE - Schema and Operations
 * Verifica el esquema de base de datos y operaciones CRUD
 */

const dbConfig = require('../../config/database');

describe('Database Tests - WhatsApp Conversations System', () => {
  beforeAll(async () => {
    // Mock de connection pool
    const mockPool = {
      request: jest.fn().mockReturnThis(),
      query: jest.fn(),
      batch: jest.fn(),
      transaction: jest.fn().mockReturnThis(),
      commit: jest.fn(),
      rollback: jest.fn(),
      close: jest.fn()
    };

    dbConfig.pool = mockPool;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Validation', () => {
    test('Debería tener la tabla WhatsAppConversations', async () => {
      const mockSchema = [
        { COLUMN_NAME: 'conversationid', DATA_TYPE: 'int' },
        { COLUMN_NAME: 'patientid', DATA_TYPE: 'int' },
        { COLUMN_NAME: 'phone_number', DATA_TYPE: 'varchar' },
        { COLUMN_NAME: 'status', DATA_TYPE: 'varchar' },
        { COLUMN_NAME: 'priority', DATA_TYPE: 'varchar' },
        { COLUMN_NAME: 'color_tag', DATA_TYPE: 'varchar' },
        { COLUMN_NAME: 'last_message_at', DATA_TYPE: 'datetime2' },
        { COLUMN_NAME: 'created_at', DATA_TYPE: 'datetime2' },
        { COLUMN_NAME: 'closed_at', DATA_TYPE: 'datetime2' },
        { COLUMN_NAME: 'assigned_to', DATA_TYPE: 'int' }
      ];

      dbConfig.pool.request.mockReturnThis();
      dbConfig.pool.query.mockResolvedValue({ recordset: mockSchema });

      const result = await dbConfig.executeQuery(
        "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'WhatsAppConversations'"
      );

      const columns = result.recordset.map(col => col.COLUMN_NAME);
      
      expect(columns).toContain('conversationid');
      expect(columns).toContain('phone_number');
      expect(columns).toContain('color_tag');
      expect(columns).toContain('priority');
      expect(columns).toContain('status');
      expect(columns).toContain('last_message_at');
    });

    test('Debería tener la tabla WhatsAppMessages', async () => {
      const mockMessageSchema = [
        { COLUMN_NAME: 'messageid', DATA_TYPE: 'int' },
        { COLUMN_NAME: 'conversationid', DATA_TYPE: 'int' },
        { COLUMN_NAME: 'content', DATA_TYPE: 'text' },
        { COLUMN_NAME: 'direction', DATA_TYPE: 'varchar' },
        { COLUMN_NAME: 'timestamp', DATA_TYPE: 'datetime2' },
        { COLUMN_NAME: 'message_type', DATA_TYPE: 'varchar' },
        { COLUMN_NAME: 'media_url', DATA_TYPE: 'varchar' }
      ];

      dbConfig.pool.request.mockReturnThis();
      dbConfig.pool.query.mockResolvedValue({ recordset: mockMessageSchema });

      const result = await dbConfig.executeQuery(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'WhatsAppMessages'"
      );

      const columns = result.recordset.map(col => col.COLUMN_NAME);
      
      expect(columns).toContain('messageid');
      expect(columns).toContain('conversationid');
      expect(columns).toContain('content');
      expect(columns).toContain('direction');
      expect(columns).toContain('timestamp');
    });

    test('Debería tener la tabla WhatsAppConversationTags', async () => {
      const mockTagsSchema = [
        { COLUMN_NAME: 'tagid', DATA_TYPE: 'int' },
        { COLUMN_NAME: 'conversationid', DATA_TYPE: 'int' },
        { COLUMN_NAME: 'tag_type', DATA_TYPE: 'varchar' },
        { COLUMN_NAME: 'tagged_by', DATA_TYPE: 'varchar' },
        { COLUMN_NAME: 'tagged_at', DATA_TYPE: 'datetime2' },
        { COLUMN_NAME: 'untagged_at', DATA_TYPE: 'datetime2' },
        { COLUMN_NAME: 'notes', DATA_TYPE: 'text' }
      ];

      dbConfig.pool.request.mockReturnThis();
      dbConfig.pool.query.mockResolvedValue({ recordset: mockTagsSchema });

      const result = await dbConfig.executeQuery(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'WhatsAppConversationTags'"
      );

      const columns = result.recordset.map(col => col.COLUMN_NAME);
      
      expect(columns).toContain('tagid');
      expect(columns).toContain('conversationid');
      expect(columns).toContain('tag_type');
      expect(columns).toContain('tagged_by');
      expect(columns).toContain('tagged_at');
      expect(columns).toContain('notes');
    });

    test('Debería tener la tabla WhatsAppAIConfig', async () => {
      const mockConfigSchema = [
        { COLUMN_NAME: 'configid', DATA_TYPE: 'int' },
        { COLUMN_NAME: 'ai_enabled', DATA_TYPE: 'bit' },
        { COLUMN_NAME: 'ai_active_outside_hours', DATA_TYPE: 'bit' },
        { COLUMN_NAME: 'working_hours', DATA_TYPE: 'json' },
        { COLUMN_NAME: 'urgent_keywords', DATA_TYPE: 'text' },
        { COLUMN_NAME: 'updated_at', DATA_TYPE: 'datetime2' }
      ];

      dbConfig.pool.request.mockReturnThis();
      dbConfig.pool.query.mockResolvedValue({ recordset: mockConfigSchema });

      const result = await dbConfig.executeQuery(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'WhatsAppAIConfig'"
      );

      const columns = result.recordset.map(col => col.COLUMN_NAME);
      
      expect(columns).toContain('configid');
      expect(columns).toContain('ai_enabled');
      expect(columns).toContain('ai_active_outside_hours');
      expect(columns).toContain('working_hours');
    });
  });

  describe('CRUD Operations - WhatsAppConversations', () => {
    test('Debería crear una nueva conversación', async () => {
      const conversationData = {
        patientid: 1,
        phone_number: '+34612345678',
        status: 'active',
        priority: 'normal',
        last_message_at: new Date('2025-11-16T06:00:00Z')
      };

      const mockInsertResult = {
        recordset: [{ conversationid: 123 }]
      };

      dbConfig.pool.request.mockReturnThis();
      dbConfig.pool.query.mockResolvedValue(mockInsertResult);

      const result = await dbConfig.executeQueryWithParams(
        "INSERT INTO WhatsAppConversations OUTPUT INSERTED.conversationid VALUES (@patientid, @phone, @status, @priority, @lastMessage)",
        conversationData
      );

      expect(dbConfig.pool.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO WhatsAppConversations'));
      expect(result.recordset[0].conversationid).toBe(123);
    });

    test('Debería obtener todas las conversaciones', async () => {
      const mockConversations = [
        {
          conversationid: 1,
          phone_number: '+34664218253',
          status: 'active',
          color_tag: 'orange',
          priority: 'high',
          patient_name: 'Juan Pérez'
        }
      ];

      dbConfig.pool.request.mockReturnThis();
      dbConfig.pool.query.mockResolvedValue({ recordset: mockConversations });

      const result = await dbConfig.executeQuery(
        "SELECT c.*, p.Name as patient_name FROM WhatsAppConversations c LEFT JOIN dPatients p ON c.PatientID = p.PatientID"
      );

      expect(result.recordset).toHaveLength(1);
      expect(result.recordset[0].color_tag).toBe('orange');
    });

    test('Debería filtrar conversaciones por color_tag', async () => {
      const mockUrgentConversations = [
        {
          conversationid: 1,
          phone_number: '+34664218253',
          color_tag: 'orange',
          priority: 'high'
        }
      ];

      dbConfig.pool.request.mockReturnThis();
      dbConfig.pool.query.mockResolvedValue({ recordset: mockUrgentConversations });

      const result = await dbConfig.executeQuery(
        "SELECT * FROM WhatsAppConversations WHERE color_tag = 'orange'"
      );

      expect(result.recordset[0].color_tag).toBe('orange');
    });

    test('Debería actualizar color_tag de conversación', async () => {
      const updateParams = {
        conversationid: 1,
        color_tag: 'orange',
        priority: 'high'
      };

      const mockUpdateResult = { rowsAffected: [1] };

      dbConfig.pool.request.mockReturnThis();
      dbConfig.pool.query.mockResolvedValue(mockUpdateResult);

      const result = await dbConfig.executeQueryWithParams(
        "UPDATE WhatsAppConversations SET color_tag = @color_tag, priority = @priority WHERE conversationid = @conversationid",
        updateParams
      );

      expect(dbConfig.pool.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE WhatsAppConversations'));
      expect(result.rowsAffected[0]).toBe(1);
    });

    test('Debería cerrar conversación', async () => {
      const closeParams = {
        conversationid: 1,
        closed_at: new Date()
      };

      const mockCloseResult = { rowsAffected: [1] };

      dbConfig.pool.request.mockReturnThis();
      dbConfig.pool.query.mockResolvedValue(mockCloseResult);

      const result = await dbConfig.executeQueryWithParams(
        "UPDATE WhatsAppConversations SET status = 'closed', closed_at = @closed_at WHERE conversationid = @conversationid",
        closeParams
      );

      expect(result.rowsAffected[0]).toBe(1);
    });
  });

  describe('CRUD Operations - WhatsAppMessages', () => {
    test('Debería insertar nuevo mensaje', async () => {
      const messageData = {
        conversationid: 1,
        content: 'Hola, tengo un dolor muy fuerte',
        direction: 'inbound',
        timestamp: new Date('2025-11-16T06:00:00Z'),
        message_type: 'text'
      };

      const mockInsertResult = {
        recordset: [{ messageid: 456 }]
      };

      dbConfig.pool.request.mockReturnThis();
      dbConfig.pool.query.mockResolvedValue(mockInsertResult);

      const result = await dbConfig.executeQueryWithParams(
        "INSERT INTO WhatsAppMessages OUTPUT INSERTED.messageid VALUES (@conversationid, @content, @direction, @timestamp, @messageType)",
        messageData
      );

      expect(dbConfig.pool.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO WhatsAppMessages'));
      expect(result.recordset[0].messageid).toBe(456);
    });

    test('Debería obtener mensajes de conversación', async () => {
      const mockMessages = [
        {
          messageid: 1,
          content: 'Tengo dolor',
          direction: 'inbound',
          timestamp: '2025-11-16T06:00:00Z'
        },
        {
          messageid: 2,
          content: 'Le atenderemos pronto',
          direction: 'outbound',
          timestamp: '2025-11-16T06:05:00Z'
        }
      ];

      dbConfig.pool.request.mockReturnThis();
      dbConfig.pool.query.mockResolvedValue({ recordset: mockMessages });

      const result = await dbConfig.executeQuery(
        "SELECT * FROM WhatsAppMessages WHERE conversationid = 1 ORDER BY timestamp ASC"
      );

      expect(result.recordset).toHaveLength(2);
      expect(result.recordset[0].direction).toBe('inbound');
      expect(result.recordset[1].direction).toBe('outbound');
    });
  });

  describe('CRUD Operations - WhatsAppConversationTags', () => {
    test('Debería insertar nuevo tag', async () => {
      const tagData = {
        conversationid: 1,
        tag_type: 'urgent',
        tagged_by: 'AI',
        tagged_at: new Date(),
        notes: 'Detected urgent keywords: dolor, emergencia'
      };

      const mockInsertResult = {
        recordset: [{ tagid: 789 }]
      };

      dbConfig.pool.request.mockReturnThis();
      dbConfig.pool.query.mockResolvedValue(mockInsertResult);

      const result = await dbConfig.executeQueryWithParams(
        "INSERT INTO WhatsAppConversationTags OUTPUT INSERTED.tagid VALUES (@conversationid, @tagType, @taggedBy, @taggedAt, @notes)",
        tagData
      );

      expect(dbConfig.pool.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO WhatsAppConversationTags'));
      expect(result.recordset[0].tagid).toBe(789);
    });

    test('Debería obtener historial de tags', async () => {
      const mockTags = [
        {
          tagid: 1,
          tag_type: 'urgent',
          tagged_by: 'AI',
          tagged_at: '2025-11-16T06:00:00Z',
          notes: 'Auto-detected urgency'
        },
        {
          tagid: 2,
          tag_type: 'urgent',
          tagged_by: 'Dr. Mario Rubio',
          tagged_at: '2025-11-16T06:10:00Z',
          notes: 'Manual review required',
          untagged_at: '2025-11-16T08:00:00Z'
        }
      ];

      dbConfig.pool.request.mockReturnThis();
      dbConfig.pool.query.mockResolvedValue({ recordset: mockTags });

      const result = await dbConfig.executeQuery(
        "SELECT * FROM WhatsAppConversationTags WHERE conversationid = 1 ORDER BY tagged_at DESC"
      );

      expect(result.recordset).toHaveLength(2);
      expect(result.recordset[0].tagged_by).toBe('Dr. Mario Rubio');
    });
  });

  describe('CRUD Operations - WhatsAppAIConfig', () => {
    test('Debería obtener configuración de IA', async () => {
      const mockConfig = {
        configid: 1,
        ai_enabled: true,
        ai_active_outside_hours: true,
        working_hours: JSON.stringify({
          monday: { start: '10:00', end: '20:00' },
          tuesday: { start: '10:00', end: '20:00' }
        }),
        urgent_keywords: 'urgente,emergencia,dolor,sangrado'
      };

      dbConfig.pool.request.mockReturnThis();
      dbConfig.pool.query.mockResolvedValue({ recordset: [mockConfig] });

      const result = await dbConfig.executeQuery(
        "SELECT TOP 1 * FROM WhatsAppAIConfig"
      );

      expect(result.recordset[0].ai_enabled).toBe(true);
      expect(result.recordset[0].ai_active_outside_hours).toBe(true);
    });

    test('Debería actualizar configuración de IA', async () => {
      const configData = {
        ai_enabled: false,
        ai_active_outside_hours: true,
        working_hours: JSON.stringify({
          monday: { start: '09:00', end: '19:00' }
        }),
        updated_at: new Date()
      };

      const mockUpdateResult = { rowsAffected: [1] };

      dbConfig.pool.request.mockReturnThis();
      dbConfig.pool.query.mockResolvedValue(mockUpdateResult);

      const result = await dbConfig.executeQueryWithParams(
        "UPDATE WhatsAppAIConfig SET ai_enabled = @ai_enabled, ai_active_outside_hours = @activeOutside, working_hours = @workingHours, updated_at = @updated_at",
        configData
      );

      expect(dbConfig.pool.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE WhatsAppAIConfig'));
      expect(result.rowsAffected[0]).toBe(1);
    });
  });

  describe('Complex Queries', () => {
    test('Debería obtener conversaciones con estadísticas', async () => {
      const mockStats = [
        {
          conversationid: 1,
          phone_number: '+34664218253',
          total_messages: 5,
          last_message: '2025-11-16T06:00:00Z',
          is_urgent: 1,
          status: 'active'
        }
      ];

      dbConfig.pool.request.mockReturnThis();
      dbConfig.pool.query.mockResolvedValue({ recordset: mockStats });

      const result = await dbConfig.executeQuery(
        `SELECT 
          c.conversationid,
          c.phone_number,
          COUNT(m.messageid) as total_messages,
          MAX(m.timestamp) as last_message,
          CASE WHEN c.color_tag = 'orange' THEN 1 ELSE 0 END as is_urgent,
          c.status
        FROM WhatsAppConversations c
        LEFT JOIN WhatsAppMessages m ON c.conversationid = m.conversationid
        GROUP BY c.conversationid, c.phone_number, c.color_tag, c.status`
      );

      expect(result.recordset[0].total_messages).toBe(5);
      expect(result.recordset[0].is_urgent).toBe(1);
    });

    test('Debería detectar conversaciones sin actividad > 24h', async () => {
      const mockStaleConversations = [
        {
          conversationid: 3,
          phone_number: '+34698765432',
          last_message_at: '2025-11-15T05:00:00Z', // 25+ hours ago
          status: 'active'
        }
      ];

      dbConfig.pool.request.mockReturnThis();
      dbConfig.pool.query.mockResolvedValue({ recordset: mockStaleConversations });

      const result = await dbConfig.executeQuery(
        `SELECT * FROM WhatsAppConversations 
         WHERE status = 'active' 
         AND DATEDIFF(hour, last_message_at, GETDATE()) > 24`
      );

      expect(result.recordset).toHaveLength(1);
      expect(result.recordset[0].last_message_at).toBe('2025-11-15T05:00:00Z');
    });
  });

  describe('Data Integrity', () => {
    test('Debería validar foreign key constraints', async () => {
      // Test invalid conversation ID for message
      dbConfig.pool.request.mockReturnThis();
      dbConfig.pool.query.mockRejectedValue(new Error('FOREIGN KEY CONSTRAINT FAILED'));

      await expect(
        dbConfig.executeQueryWithParams(
          "INSERT INTO WhatsAppMessages (conversationid, content, direction) VALUES (@convId, @content, @direction)",
          { convId: 999, content: 'Test', direction: 'inbound' }
        )
      ).rejects.toThrow('FOREIGN KEY CONSTRAINT FAILED');
    });

    test('Debería validar unique constraints', async () => {
      // Test duplicate phone number in active conversations
      dbConfig.pool.request.mockReturnThis();
      dbConfig.pool.query.mockRejectedValue(new Error('UNIQUE CONSTRAINT VIOLATION'));

      await expect(
        dbConfig.executeQueryWithParams(
          "INSERT INTO WhatsAppConversations (phone_number, status) VALUES (@phone, @status)",
          { phone: '+34612345678', status: 'active' }
        )
      ).rejects.toThrow('UNIQUE CONSTRAINT VIOLATION');
    });
  });

  describe('Transaction Tests', () => {
    test('Debería manejar transacciones de conversación completa', async () => {
      const mockTransaction = {
        request: jest.fn().mockReturnThis(),
        query: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn()
      };

      dbConfig.pool.transaction.mockReturnValue(mockTransaction);

      const conversationData = {
        patientid: 1,
        phone_number: '+34612345678'
      };

      const messageData = {
        content: 'Mensaje inicial',
        direction: 'inbound'
      };

      // Simulate successful transaction
      mockTransaction.query
        .mockResolvedValueOnce({ recordset: [{ conversationid: 123 }] })
        .mockResolvedValueOnce({ recordset: [{ messageid: 456 }] });

      await dbConfig.executeQueryWithParams(
        "BEGIN TRANSACTION; INSERT INTO WhatsAppConversations OUTPUT INSERTED.conversationid VALUES (@patientid, @phone, 'active', 'normal', GETDATE()); INSERT INTO WhatsAppMessages (conversationid, content, direction, timestamp) VALUES (@conversationid, @content, @direction, GETDATE()); COMMIT;",
        { ...conversationData, conversationid: 123, ...messageData }
      );

      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    test('Debería hacer rollback en caso de error', async () => {
      const mockTransaction = {
        request: jest.fn().mockReturnThis(),
        query: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn()
      };

      dbConfig.pool.transaction.mockReturnValue(mockTransaction);

      // Simulate error on second query
      mockTransaction.query
        .mockResolvedValueOnce({ recordset: [{ conversationid: 123 }] })
        .mockRejectedValueOnce(new Error('Insert failed'));

      await expect(
        dbConfig.executeQueryWithParams(
          "BEGIN TRANSACTION; INSERT INTO WhatsAppConversations; INSERT INTO WhatsAppMessages; COMMIT;",
          {}
        )
      ).rejects.toThrow('Insert failed');

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });
});