/**
 * Configuración de Base de Datos SQL Server
 * Rubio García Dental Clinic Management System
 */

const sql = require('mssql');
require('dotenv').config();

class DatabaseConfig {
    constructor() {
        this.config = {
            server: process.env.DB_SERVER,
            database: process.env.DB_DATABASE,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30000
            },
            options: {
                encrypt: process.env.DB_ENCRYPT === 'true',
                trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
                enableArithAbort: true,
                useUTC: false
            },
            requestTimeout: 60000,
            connectionTimeout: 60000,
            server: process.env.DB_SERVER
        };
        
        this.pool = null;
        this.isConnected = false;
    }

    /**
     * Crear pool de conexiones
     */
    async createPool() {
        try {
            this.pool = await sql.connect(this.config);
            this.isConnected = true;
            console.log('✅ Conectado a SQL Server:', process.env.DB_SERVER);
            
            // Configurar event listeners
            this.pool.on('error', (err) => {
                console.error('❌ Error en pool SQL Server:', err);
                this.isConnected = false;
            });

            return this.pool;
        } catch (error) {
            console.error('❌ Error conectando a SQL Server:', error);
            this.isConnected = false;
            throw error;
        }
    }

    /**
     * Obtener pool de conexiones
     */
    async getPool() {
        if (!this.pool || !this.isConnected) {
            await this.createPool();
        }
        return this.pool;
    }

    /**
     * Ejecutar consulta con pool
     */
    async query(queryString, parameters = []) {
        try {
            const pool = await this.getPool();
            const request = pool.request();

            // Agregar parámetros si existen
            parameters.forEach((param, index) => {
                if (param.name && param.value !== undefined) {
                    request.input(param.name, param.value);
                } else {
                    request.input(`param${index}`, param);
                }
            });

            const result = await request.query(queryString);
            return result;
        } catch (error) {
            console.error('❌ Error ejecutando consulta:', error);
            throw error;
        }
    }

    /**
     * Ejecutar transacción
     */
    async transaction(callback) {
        const pool = await this.getPool();
        const transaction = new sql.Transaction(pool);
        
        try {
            await transaction.begin();
            const request = new sql.Request(transaction);
            
            const result = await callback(request);
            await transaction.commit();
            
            return result;
        } catch (error) {
            await transaction.rollback();
            console.error('❌ Error en transacción:', error);
            throw error;
        }
    }

    /**
     * Verificar conexión
     */
    async testConnection() {
        try {
            const result = await this.query('SELECT 1 as test');
            console.log('✅ Prueba de conexión SQL Server exitosa');
            return true;
        } catch (error) {
            console.error('❌ Error en prueba de conexión:', error);
            return false;
        }
    }

    /**
     * Cerrar pool de conexiones
     */
    async closePool() {
        if (this.pool) {
            await this.pool.close();
            this.pool = null;
            this.isConnected = false;
            console.log('🔌 Pool de conexiones SQL Server cerrado');
        }
    }

    /**
     * Obtener estado de conexión
     */
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            server: this.config.server,
            database: this.config.database,
            pool: this.pool ? {
                connected: this.pool.connected,
                connecting: this.pool.connecting,
                err: this.pool.err ? this.pool.err.message : null
            } : null
        };
    }
}

// Queries predefinidas para operaciones comunes
const SQL_QUERIES = {
    // Citas (DCitas)
    GET_APPOINTMENTS: `
        SELECT 
            a.*,
            p.FirstName,
            p.LastName,
            p.Phone,
            p.Email,
            p.DateOfBirth
        FROM DCitas a
        LEFT JOIN DPatients p ON a.PatientID = p.PatientID
        WHERE (@date IS NULL OR a.Date = @date)
        AND (@status IS NULL OR a.Status = @status)
        ORDER BY a.Date DESC, a.Time ASC
    `,
    
    GET_APPOINTMENT_BY_ID: `
        SELECT 
            a.*,
            p.FirstName,
            p.LastName,
            p.Phone,
            p.Email,
            p.DateOfBirth
        FROM DCitas a
        LEFT JOIN DPatients p ON a.PatientID = p.PatientID
        WHERE a.CitaID = @appointmentId
    `,
    
    CREATE_APPOINTMENT: `
        INSERT INTO DCitas (
            PatientID, Date, Time, Duration, Treatment, 
            Status, Notes, CreatedAt, UpdatedAt
        )
        VALUES (
            @patientId, @date, @time, @duration, @treatment,
            @status, @notes, GETDATE(), GETDATE()
        )
        SELECT SCOPE_IDENTITY() as CitaID
    `,
    
    UPDATE_APPOINTMENT: `
        UPDATE DCitas SET
            Date = @date,
            Time = @time,
            Duration = @duration,
            Treatment = @treatment,
            Status = @status,
            Notes = @notes,
            UpdatedAt = GETDATE()
        WHERE CitaID = @appointmentId
    `,
    
    DELETE_APPOINTMENT: `
        DELETE FROM DCitas WHERE CitaID = @appointmentId
    `,
    
    UPDATE_APPOINTMENT_STATUS: `
        UPDATE DCitas SET
            Status = @status,
            UpdatedAt = GETDATE()
        WHERE CitaID = @appointmentId
    `,
    
    GET_PENDING_AUTOMATIONS: `
        SELECT 
            a.*,
            p.FirstName,
            p.LastName,
            p.Phone,
            p.Email
        FROM DCitas a
        LEFT JOIN DPatients p ON a.PatientID = p.PatientID
        WHERE a.Status = 'Planificada'
        AND a.Date >= CAST(GETDATE() AS DATE)
        AND a.Date <= DATEADD(DAY, 1, CAST(GETDATE() AS DATE))
        AND NOT EXISTS (
            SELECT 1 FROM DAutomationLogs al 
            WHERE al.AppointmentID = a.CitaID 
            AND al.ActionType = 'confirmation_sent'
            AND al.CreatedAt >= DATEADD(DAY, -1, GETDATE())
        )
        ORDER BY a.Date ASC, a.Time ASC
    `,

    // Pacientes (DPatients)
    GET_PATIENTS: `
        SELECT * FROM DPatients
        WHERE (@search IS NULL OR FirstName LIKE '%' + @search + '%' OR LastName LIKE '%' + @search + '%' OR Phone LIKE '%' + @search + '%')
        ORDER BY LastName, FirstName
    `,
    
    CREATE_PATIENT: `
        INSERT INTO DPatients (
            FirstName, LastName, Phone, Email, DateOfBirth, 
            Address, CreatedAt, UpdatedAt
        )
        VALUES (
            @firstName, @lastName, @phone, @email, @dateOfBirth,
            @address, GETDATE(), GETDATE()
        )
        SELECT SCOPE_IDENTITY() as PatientID
    `,
    
    UPDATE_PATIENT: `
        UPDATE DPatients SET
            FirstName = @firstName,
            LastName = @lastName,
            Phone = @phone,
            Email = @email,
            DateOfBirth = @dateOfBirth,
            Address = @address,
            UpdatedAt = GETDATE()
        WHERE PatientID = @patientId
    `,

    // Documentos Legales (DLegalDocuments)
    CREATE_LEGAL_DOCUMENT: `
        INSERT INTO DLegalDocuments (
            PatientID, CitaID, DocumentType, DocumentContent,
            Accepted, AcceptedAt, IPAddress, UserAgent,
            Version, CreatedAt
        )
        VALUES (
            @patientId, @appointmentId, @documentType, @documentContent,
            @accepted, @acceptedAt, @ipAddress, @userAgent,
            @version, GETDATE()
        )
        SELECT SCOPE_IDENTITY() as DocumentID
    `,
    
    GET_LEGAL_DOCUMENTS: `
        SELECT * FROM DLegalDocuments
        WHERE (@patientId IS NULL OR PatientID = @patientId)
        AND (@appointmentId IS NULL OR CitaID = @appointmentId)
        AND (@documentType IS NULL OR DocumentType = @documentType)
        ORDER BY CreatedAt DESC
    `,

    // Cuestionarios (DQuestionnaireResponses)
    CREATE_QUESTIONNAIRE_RESPONSE: `
        INSERT INTO DQuestionnaireResponses (
            PatientID, CitaID, QuestionnaireType, Responses,
            LOPDAccepted, LOPDAcceptedAt, CreatedAt
        )
        VALUES (
            @patientId, @appointmentId, @questionnaireType, @responses,
            @lopdAccepted, @lopdAcceptedAt, GETDATE()
        )
        SELECT SCOPE_IDENTITY() as ResponseID
    `,
    
    GET_QUESTIONNAIRE_RESPONSES: `
        SELECT * FROM DQuestionnaireResponses
        WHERE (@patientId IS NULL OR PatientID = @patientId)
        AND (@appointmentId IS NULL OR CitaID = @appointmentId)
        ORDER BY CreatedAt DESC
    `,

    // Flujos de Automatización (DAutomationFlows)
    CREATE_AUTOMATION_FLOW: `
        INSERT INTO DAutomationFlows (
            AppointmentID, FlowType, FlowConfig, CurrentStep,
            Status, CreatedAt
        )
        VALUES (
            @appointmentId, @flowType, @flowConfig, @currentStep,
            @status, GETDATE()
        )
        SELECT SCOPE_IDENTITY() as FlowID
    `,
    
    UPDATE_AUTOMATION_FLOW: `
        UPDATE DAutomationFlows SET
            CurrentStep = @currentStep,
            Status = @status,
            UpdatedAt = GETDATE()
        WHERE FlowID = @flowId
    `,

    // Log de Automatizaciones (DAutomationLogs)
    CREATE_AUTOMATION_LOG: `
        INSERT INTO DAutomationLogs (
            AppointmentID, FlowID, ActionType, ActionData,
            Success, ErrorMessage, CreatedAt
        )
        VALUES (
            @appointmentId, @flowId, @actionType, @actionData,
            @success, @errorMessage, GETDATE()
        )
    `
};

// Crear instancia singleton
const dbConfig = new DatabaseConfig();

module.exports = {
    dbConfig,
    sql,
    SQL_QUERIES
};