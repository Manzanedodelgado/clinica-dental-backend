-- ================================================
-- TABLAS PARA CONVERSACIONES WHATSAPP Y CODIFICACIÓN
-- Sistema Rubio García Dental
-- ================================================

-- Tabla de conversaciones WhatsApp
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'WhatsAppConversations')
BEGIN
    CREATE TABLE WhatsAppConversations (
        ConversationID INT IDENTITY(1,1) PRIMARY KEY,
        PatientPhone NVARCHAR(20) NOT NULL,
        PatientName NVARCHAR(200),
        LastMessageAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        MessageCount INT NOT NULL DEFAULT 1,
        ConversationStartedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        LastMessageSnippet NVARCHAR(500),
        HasUrgencyTag BIT NOT NULL DEFAULT 0, -- 1 = urgente (color naranja)
        TagColor VARCHAR(20) DEFAULT 'normal', -- normal, orange (urgente)
        TagNotes NVARCHAR(500), -- Notas del tag
        TaggedBy NVARCHAR(100), -- Usuario que etiquetó
        TaggedAt DATETIME2,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        IsActive BIT NOT NULL DEFAULT 1
    );
END

-- Tabla de mensajes individuales
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'WhatsAppMessages')
BEGIN
    CREATE TABLE WhatsAppMessages (
        MessageID INT IDENTITY(1,1) PRIMARY KEY,
        ConversationID INT NOT NULL,
        MessageText NVARCHAR(MAX),
        MessageType NVARCHAR(50) DEFAULT 'text', -- text, image, document, etc.
        FromPhone NVARCHAR(20) NOT NULL, -- patient phone or clinic phone
        FromName NVARCHAR(200),
        IsFromPatient BIT NOT NULL DEFAULT 1, -- 1 = paciente, 0 = clínica
        MessageTimestamp DATETIME2 NOT NULL DEFAULT GETDATE(),
        HasMedia BIT NOT NULL DEFAULT 0,
        MediaUrl NVARCHAR(500),
        MediaCaption NVARCHAR(500),
        AIProcessed BIT NOT NULL DEFAULT 0,
        AIAutoReplySent BIT NOT NULL DEFAULT 0,
        ContainsEmergencyKeywords BIT NOT NULL DEFAULT 0, -- Detección automática
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (ConversationID) REFERENCES WhatsAppConversations(ConversationID)
    );
END

-- Configuración del agente IA
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AIConfiguration')
BEGIN
    CREATE TABLE AIConfiguration (
        ConfigID INT IDENTITY(1,1) PRIMARY KEY,
        IsEnabled BIT NOT NULL DEFAULT 1, -- IA activa por defecto
        IsActiveOutsideHours BIT NOT NULL DEFAULT 1, -- IA activa fuera de horario
        WorkingHoursStart TIME NOT NULL DEFAULT '10:00:00',
        WorkingHoursEnd TIME NOT NULL DEFAULT '20:00:00',
        WorkingDays NVARCHAR(100) NOT NULL DEFAULT '1,2,3,4,5', -- Lunes a Viernes
        AutoResponseEnabled BIT NOT NULL DEFAULT 1,
        EmergencyKeywords NVARCHAR(MAX) DEFAULT 'dolor,urgen,emergencia,me duele,muy mal,grave,grave',
        AutoResponseMessage NVARCHAR(MAX) DEFAULT 'Gracias por contactar con Rubio García Dental. Hemos recibido tu mensaje y te responderemos lo antes posible. Si es una emergencia, llama al 664218253.',
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END

-- Insertar configuración inicial de IA
INSERT INTO AIConfiguration (IsEnabled, IsActiveOutsideHours) 
VALUES (1, 1);

-- Tabla de logs de etiquetas (para auditoría)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ConversationTags')
BEGIN
    CREATE TABLE ConversationTags (
        TagID INT IDENTITY(1,1) PRIMARY KEY,
        ConversationID INT NOT NULL,
        TagColor VARCHAR(20) NOT NULL, -- orange, normal, etc.
        TagNotes NVARCHAR(500),
        TaggedBy NVARCHAR(100) NOT NULL, -- usuario o 'AI_SYSTEM'
        ActionType VARCHAR(20) NOT NULL, -- 'tagged', 'untagged', 'updated'
        Timestamp DATETIME2 NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (ConversationID) REFERENCES WhatsAppConversations(ConversationID)
    );
END

-- ================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ================================================

-- Índices para conversaciones
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_WhatsAppConversations_Phone')
BEGIN
    CREATE INDEX IX_WhatsAppConversations_Phone ON WhatsAppConversations(PatientPhone);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_WhatsAppConversations_LastMessage')
BEGIN
    CREATE INDEX IX_WhatsAppConversations_LastMessage ON WhatsAppConversations(LastMessageAt DESC);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_WhatsAppConversations_Active')
BEGIN
    CREATE INDEX IX_WhatsAppConversations_Active ON WhatsAppConversations(IsActive, HasUrgencyTag);
END

-- Índices para mensajes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_WhatsAppMessages_Conversation')
BEGIN
    CREATE INDEX IX_WhatsAppMessages_Conversation ON WhatsAppMessages(ConversationID);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_WhatsAppMessages_Timestamp')
BEGIN
    CREATE INDEX IX_WhatsAppMessages_Timestamp ON WhatsAppMessages(MessageTimestamp DESC);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_WhatsAppMessages_Patient')
BEGIN
    CREATE INDEX IX_WhatsAppMessages_Patient ON WhatsAppMessages(FromPhone);
END

PRINT '✅ Tablas de conversaciones WhatsApp creadas correctamente';
PRINT '✅ Sistema de codificación de conversaciones implementado';
PRINT '✅ IA configurada por defecto (activa fuera de horario)';
PRINT '✅ Tablas optimizadas con índices para rendimiento';