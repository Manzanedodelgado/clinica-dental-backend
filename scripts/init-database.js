/**
 * Script de Inicialización de Base de Datos
 * Sistema de Gestión Dental - Rubio García Dental
 * 
 * Este script crea todas las tablas necesarias para el sistema
 */

const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'
    }
};

// SQL para crear todas las tablas
const createTablesSQL = `
-- ================================================
-- TABLA DE USUARIOS
-- ================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DUsers')
BEGIN
    CREATE TABLE DUsers (
        UserID INT IDENTITY(1,1) PRIMARY KEY,
        Username NVARCHAR(100) NOT NULL UNIQUE,
        Email NVARCHAR(255) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(255) NOT NULL,
        FirstName NVARCHAR(100) NOT NULL,
        LastName NVARCHAR(100) NOT NULL,
        Phone NVARCHAR(20),
        Role NVARCHAR(50) NOT NULL DEFAULT 'Recepcionista',
        IsActive BIT NOT NULL DEFAULT 1,
        LastLogin DATETIME2,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END

-- ================================================
-- TABLA DE PACIENTES
-- ================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DPatients')
BEGIN
    CREATE TABLE DPatients (
        PatientID INT IDENTITY(1,1) PRIMARY KEY,
        FirstName NVARCHAR(100) NOT NULL,
        LastName NVARCHAR(100) NOT NULL,
        Phone NVARCHAR(20) NOT NULL,
        Email NVARCHAR(255),
        DateOfBirth DATE NOT NULL,
        Address NVARCHAR(500),
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    
    CREATE INDEX IX_DPatients_Phone ON DPatients(Phone);
    CREATE INDEX IX_DPatients_Name ON DPatients(LastName, FirstName);
END

-- ================================================
-- TABLA DE CITAS
-- ================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DCitas')
BEGIN
    CREATE TABLE DCitas (
        CitaID INT IDENTITY(1,1) PRIMARY KEY,
        PatientID INT NOT NULL,
        Date DATE NOT NULL,
        Time TIME NOT NULL,
        Duration INT NOT NULL DEFAULT 60, -- duración en minutos
        Treatment NVARCHAR(255) NOT NULL,
        Status NVARCHAR(20) NOT NULL DEFAULT 'Planificada',
        Notes NVARCHAR(1000),
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        FOREIGN KEY (PatientID) REFERENCES DPatients(PatientID)
    );
    
    CREATE INDEX IX_DCitas_Date ON DCitas(Date);
    CREATE INDEX IX_DCitas_Status ON DCitas(Status);
    CREATE INDEX IX_DCitas_Patient ON DCitas(PatientID);
    CREATE INDEX IX_DCitas_DateTime ON DCitas(Date, Time);
END

-- ================================================
-- TABLA DE DOCUMENTOS LEGALES
-- ================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DLegalDocuments')
BEGIN
    CREATE TABLE DLegalDocuments (
        DocumentID INT IDENTITY(1,1) PRIMARY KEY,
        PatientID INT NOT NULL,
        CitaID INT NULL,
        DocumentType NVARCHAR(100) NOT NULL,
        DocumentContent NVARCHAR(MAX) NOT NULL,
        Accepted BIT NOT NULL DEFAULT 0,
        AcceptedAt DATETIME2 NULL,
        IPAddress NVARCHAR(45),
        UserAgent NVARCHAR(1000),
        Version NVARCHAR(50) NOT NULL DEFAULT '1.0',
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        FOREIGN KEY (PatientID) REFERENCES DPatients(PatientID),
        FOREIGN KEY (CitaID) REFERENCES DCitas(CitaID)
    );
    
    CREATE INDEX IX_DLegalDocuments_Patient ON DLegalDocuments(PatientID);
    CREATE INDEX IX_DLegalDocuments_Appointment ON DLegalDocuments(CitaID);
    CREATE INDEX IX_DLegalDocuments_Type ON DLegalDocuments(DocumentType);
    CREATE INDEX IX_DLegalDocuments_Accepted ON DLegalDocuments(Accepted);
END

-- ================================================
-- TABLA DE RESPUESTAS DE CUESTIONARIOS
-- ================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DQuestionnaireResponses')
BEGIN
    CREATE TABLE DQuestionnaireResponses (
        ResponseID INT IDENTITY(1,1) PRIMARY KEY,
        PatientID INT NOT NULL,
        CitaID INT NULL,
        QuestionnaireType NVARCHAR(100) NOT NULL,
        Responses NVARCHAR(MAX) NOT NULL, -- JSON con las respuestas
        LOPDAccepted BIT NOT NULL DEFAULT 0,
        LOPDAcceptedAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        FOREIGN KEY (PatientID) REFERENCES DPatients(PatientID),
        FOREIGN KEY (CitaID) REFERENCES DCitas(CitaID)
    );
    
    CREATE INDEX IX_DQuestionnaireResponses_Patient ON DQuestionnaireResponses(PatientID);
    CREATE INDEX IX_DQuestionnaireResponses_Appointment ON DQuestionnaireResponses(CitaID);
    CREATE INDEX IX_DQuestionnaireResponses_Type ON DQuestionnaireResponses(QuestionnaireType);
END

-- ================================================
-- TABLA DE FLUJOS DE AUTOMATIZACIÓN
-- ================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DAutomationFlows')
BEGIN
    CREATE TABLE DAutomationFlows (
        FlowID INT IDENTITY(1,1) PRIMARY KEY,
        AppointmentID INT NOT NULL,
        FlowType NVARCHAR(50) NOT NULL,
        FlowConfig NVARCHAR(MAX) NOT NULL, -- JSON con configuración del flujo
        CurrentStep INT NOT NULL DEFAULT 0,
        Status NVARCHAR(20) NOT NULL DEFAULT 'active',
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        FOREIGN KEY (AppointmentID) REFERENCES DCitas(CitaID)
    );
    
    CREATE INDEX IX_DAutomationFlows_Appointment ON DAutomationFlows(AppointmentID);
    CREATE INDEX IX_DAutomationFlows_Status ON DAutomationFlows(Status);
    CREATE INDEX IX_DAutomationFlows_Type ON DAutomationFlows(FlowType);
END

-- ================================================
-- TABLA DE LOGS DE AUTOMATIZACIÓN
-- ================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DAutomationLogs')
BEGIN
    CREATE TABLE DAutomationLogs (
        LogID INT IDENTITY(1,1) PRIMARY KEY,
        AppointmentID INT NULL,
        FlowID INT NULL,
        ActionType NVARCHAR(100) NOT NULL,
        ActionData NVARCHAR(MAX), -- JSON con datos de la acción
        Success BIT NOT NULL DEFAULT 1,
        ErrorMessage NVARCHAR(500) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        FOREIGN KEY (AppointmentID) REFERENCES DCitas(CitaID),
        FOREIGN KEY (FlowID) REFERENCES DAutomationFlows(FlowID)
    );
    
    CREATE INDEX IX_DAutomationLogs_Appointment ON DAutomationLogs(AppointmentID);
    CREATE INDEX IX_DAutomationLogs_Flow ON DAutomationLogs(FlowID);
    CREATE INDEX IX_DAutomationLogs_ActionType ON DAutomationLogs(ActionType);
END

-- ================================================
-- TABLA DE CAMBIOS DE ESTADO DE CITAS
-- ================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DAppointmentStatusChanges')
BEGIN
    CREATE TABLE DAppointmentStatusChanges (
        ChangeID INT IDENTITY(1,1) PRIMARY KEY,
        AppointmentID INT NOT NULL,
        OldStatus NVARCHAR(20) NOT NULL,
        NewStatus NVARCHAR(20) NOT NULL,
        Reason NVARCHAR(500) NULL,
        ChangedBy INT NULL,
        ChangedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        FOREIGN KEY (AppointmentID) REFERENCES DCitas(CitaID),
        FOREIGN KEY (ChangedBy) REFERENCES DUsers(UserID)
    );
    
    CREATE INDEX IX_DAppointmentStatusChanges_Appointment ON DAppointmentStatusChanges(AppointmentID);
    CREATE INDEX IX_DAppointmentStatusChanges_Date ON DAppointmentStatusChanges(ChangedAt);
END

-- ================================================
-- TABLA DE LOGS DEL SISTEMA
-- ================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DSystemLogs')
BEGIN
    CREATE TABLE DSystemLogs (
        LogID INT IDENTITY(1,1) PRIMARY KEY,
        Level NVARCHAR(10) NOT NULL,
        Component NVARCHAR(100) NOT NULL,
        Message NVARCHAR(1000) NOT NULL,
        Details NVARCHAR(MAX),
        UserID INT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        FOREIGN KEY (UserID) REFERENCES DUsers(UserID)
    );
    
    CREATE INDEX IX_DSystemLogs_Level ON DSystemLogs(Level);
    CREATE INDEX IX_DSystemLogs_Component ON DSystemLogs(Component);
    CREATE INDEX IX_DSystemLogs_Date ON DSystemLogs(CreatedAt);
END

-- ================================================
-- TABLA DE CONFIGURACIÓN DEL SISTEMA
-- ================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DSystemConfig')
BEGIN
    CREATE TABLE DSystemConfig (
        ConfigID INT IDENTITY(1,1) PRIMARY KEY,
        ConfigKey NVARCHAR(100) NOT NULL UNIQUE,
        ConfigValue NVARCHAR(MAX) NOT NULL,
        Description NVARCHAR(500),
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
`;

// Datos de inicialización
const insertInitialDataSQL = `
-- ================================================
-- CREAR USUARIO ADMINISTRADOR POR DEFECTO
-- ================================================
IF NOT EXISTS (SELECT * FROM DUsers WHERE Username = 'admin')
BEGIN
    -- La contraseña por defecto es 'Admin123!' (se debe cambiar en producción)
    INSERT INTO DUsers (
        Username, Email, PasswordHash, FirstName, LastName, 
        Phone, Role, IsActive, CreatedAt, UpdatedAt
    )
    VALUES (
        'admin', 'admin@rubiogacialdental.com', 
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj87J.HQeN1W', -- Admin123!
        'Administrador', 'Sistema',
        '912345678', 'Administrador', 1, GETDATE(), GETDATE()
    );
END

-- ================================================
-- INSERTAR CONFIGURACIONES INICIALES
-- ================================================
IF NOT EXISTS (SELECT * FROM DSystemConfig WHERE ConfigKey = 'appointment_confirmation_lead_time')
BEGIN
    INSERT INTO DSystemConfig (ConfigKey, ConfigValue, Description)
    VALUES 
        ('appointment_confirmation_lead_time', '24', 'Tiempo en horas antes de la cita para enviar confirmación'),
        ('automation_enabled', 'true', 'Si el sistema de automatizaciones está habilitado'),
        ('lopd_compliance_enabled', 'true', 'Si el cumplimiento LOPD está habilitado'),
        ('max_automation_retries', '3', 'Máximo número de reintentos para automatizaciones'),
        ('confirmation_response_timeout', '3600', 'Tiempo límite en segundos para respuesta de confirmación');
END

-- ================================================
-- CREAR PACIENTES DE EJEMPLO
-- ================================================
IF NOT EXISTS (SELECT * FROM DPatients)
BEGIN
    INSERT INTO DPatients (FirstName, LastName, Phone, Email, DateOfBirth, Address)
    VALUES 
        ('María', 'García López', '666123456', 'maria.garcia@email.com', '1985-03-15', 'Calle Principal 123, Madrid'),
        ('Juan', 'Pérez Martín', '666789123', 'juan.perez@email.com', '1978-11-22', 'Avenida Libertad 456, Madrid'),
        ('Ana', 'Fernández Silva', '666987654', 'ana.fernandez@email.com', '1990-07-08', 'Plaza Mayor 789, Madrid'),
        ('Carlos', 'Rodríguez González', '666456789', 'carlos.rodriguez@email.com', '1982-12-03', 'Calle Sol 321, Madrid');
END

-- ================================================
-- CREAR CITAS DE EJEMPLO
-- ================================================
IF NOT EXISTS (SELECT * FROM DCitas)
BEGIN
    DECLARE @PatientID1 INT = (SELECT TOP 1 PatientID FROM DPatients WHERE FirstName = 'María');
    DECLARE @PatientID2 INT = (SELECT TOP 1 PatientID FROM DPatients WHERE FirstName = 'Juan');
    DECLARE @PatientID3 INT = (SELECT TOP 1 PatientID FROM DPatients WHERE FirstName = 'Ana');
    
    INSERT INTO DCitas (PatientID, Date, Time, Duration, Treatment, Status, Notes)
    VALUES 
        (@PatientID1, CAST(GETDATE() + 1 AS DATE), '09:00', 60, 'Limpieza dental', 'Planificada', 'Primera cita'),
        (@PatientID2, CAST(GETDATE() + 1 AS DATE), '10:30', 45, 'Revisión anual', 'Confirmada', 'Control rutinario'),
        (@PatientID3, CAST(GETDATE() + 2 AS DATE), '11:00', 90, 'Tratamiento de caries', 'Planificada', 'Paciente nuevo'),
        (@PatientID1, CAST(GETDATE() + 7 AS DATE), '15:30', 60, 'Seguimiento limpieza', 'Planificada', 'Cita de seguimiento');
END
`;

// Triggers para updatedAt
const createTriggersSQL = `
-- ================================================
-- TRIGGERS PARA ACTUALIZAR UpdatedAt AUTOMÁTICAMENTE
-- ================================================
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_DUsers_UpdatedAt')
BEGIN
    EXEC('
    CREATE TRIGGER TR_DUsers_UpdatedAt ON DUsers
    AFTER UPDATE
    AS
    BEGIN
        UPDATE DUsers 
        SET UpdatedAt = GETDATE() 
        FROM DUsers u 
        INNER JOIN inserted i ON u.UserID = i.UserID
    END');
END

IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_DPatients_UpdatedAt')
BEGIN
    EXEC('
    CREATE TRIGGER TR_DPatients_UpdatedAt ON DPatients
    AFTER UPDATE
    AS
    BEGIN
        UPDATE DPatients 
        SET UpdatedAt = GETDATE() 
        FROM DPatients p 
        INNER JOIN inserted i ON p.PatientID = i.PatientID
    END');
END

IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_DCitas_UpdatedAt')
BEGIN
    EXEC('
    CREATE TRIGGER TR_DCitas_UpdatedAt ON DCitas
    AFTER UPDATE
    AS
    BEGIN
        UPDATE DCitas 
        SET UpdatedAt = GETDATE() 
        FROM DCitas c 
        INNER JOIN inserted i ON c.CitaID = i.CitaID
    END');
END

IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_DAutomationFlows_UpdatedAt')
BEGIN
    EXEC('
    CREATE TRIGGER TR_DAutomationFlows_UpdatedAt ON DAutomationFlows
    AFTER UPDATE
    AS
    BEGIN
        UPDATE DAutomationFlows 
        SET UpdatedAt = GETDATE() 
        FROM DAutomationFlows af 
        INNER JOIN inserted i ON af.FlowID = i.FlowID
    END');
END

IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_DSystemConfig_UpdatedAt')
BEGIN
    EXEC('
    CREATE TRIGGER TR_DSystemConfig_UpdatedAt ON DSystemConfig
    AFTER UPDATE
    AS
    BEGIN
        UPDATE DSystemConfig 
        SET UpdatedAt = GETDATE() 
        FROM DSystemConfig sc 
        INNER JOIN inserted i ON sc.ConfigID = i.ConfigID
    END');
END
`;

async function initializeDatabase() {
    let pool = null;
    
    try {
        console.log('🚀 Iniciando configuración de la base de datos...');
        
        // Conectar a la base de datos
        pool = await sql.connect(dbConfig);
        console.log('✅ Conexión a SQL Server establecida');
        
        // Crear tablas
        console.log('📊 Creando tablas...');
        await pool.request().batch(createTablesSQL);
        console.log('✅ Tablas creadas exitosamente');
        
        // Crear triggers
        console.log('⚡ Configurando triggers...');
        await pool.request().batch(createTriggersSQL);
        console.log('✅ Triggers configurados exitosamente');
        
        // Insertar datos iniciales
        console.log('📝 Insertando datos iniciales...');
        await pool.request().batch(insertInitialDataSQL);
        console.log('✅ Datos iniciales insertados exitosamente');
        
        // Verificar que todo está creado
        console.log('🔍 Verificando configuración...');
        const checkTables = await pool.request().query(`
            SELECT 
                t.name as TableName,
                (SELECT COUNT(*) FROM sys.columns WHERE object_id = t.object_id) as ColumnCount
            FROM sys.tables t
            WHERE t.name IN (
                'DUsers', 'DPatients', 'DCitas', 'DLegalDocuments', 
                'DQuestionnaireResponses', 'DAutomationFlows', 'DAutomationLogs',
                'DAppointmentStatusChanges', 'DSystemLogs', 'DSystemConfig'
            )
            ORDER BY t.name
        `);
        
        console.log('\n📋 Tablas creadas:');
        checkTables.recordset.forEach(table => {
            console.log(`   - ${table.TableName} (${table.ColumnCount} columnas)`);
        });
        
        // Verificar usuario administrador
        const adminCheck = await pool.request().query(`
            SELECT Username, Email, Role FROM DUsers WHERE Username = 'admin'
        `);
        
        if (adminCheck.recordset.length > 0) {
            const admin = adminCheck.recordset[0];
            console.log(`\n👤 Usuario administrador creado:`);
            console.log(`   - Usuario: ${admin.Username}`);
            console.log(`   - Email: ${admin.Email}`);
            console.log(`   - Rol: ${admin.Role}`);
            console.log(`   - Contraseña por defecto: Admin123! (CAMBIAR EN PRODUCCIÓN)`);
        }
        
        console.log('\n🎉 ¡Configuración de base de datos completada exitosamente!');
        console.log('\n📌 IMPORTANTE:');
        console.log('   1. Cambie la contraseña del usuario administrador inmediatamente');
        console.log('   2. Configure las variables de entorno en producción');
        console.log('   3. Configure los backups automáticos de la base de datos');
        console.log('   4. Configure SSL/TLS para conexiones seguras');
        
    } catch (error) {
        console.error('❌ Error configurando la base de datos:', error);
        throw error;
    } finally {
        if (pool) {
            await pool.close();
            console.log('🔌 Conexión cerrada');
        }
    }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
    initializeDatabase()
        .then(() => {
            console.log('\n✅ Script completado exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Error en el script:', error);
            process.exit(1);
        });
}

module.exports = { initializeDatabase };