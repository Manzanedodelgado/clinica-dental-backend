/**
 * Configuración de Base de Datos SQL Server
 * Rubio García Dental - Sistema de Gestión
 */

// Configuración de conexión SQL Server
const SQL_CONFIG = {
    // Configuración de conexión Windows Authentication
    server: 'localhost',
    database: 'DentalClinicDB',
    authentication: {
        type: 'Windows',
        user: 'gabinete2\\box2'
    },
    
    // Configuración de tabla de citas
    tables: {
        appointments: {
            name: 'dbo.DCitas',
            primaryKey: 'Id',
            fields: {
                id: 'Id',
                patientId: 'IdPaciente',
                date: 'Fecha',
                time: 'Hora',
                duration: 'DuracionMinutos',
                treatment: 'Tratamiento',
                status: 'Estado',
                notes: 'Notas',
                createdAt: 'FechaCreacion',
                updatedAt: 'FechaModificacion'
            }
        },
        patients: {
            name: 'dbo.DPacientes',
            primaryKey: 'Id',
            fields: {
                id: 'Id',
                firstName: 'Nombre',
                lastName: 'Apellidos',
                phone: 'Telefono',
                email: 'Email',
                address: 'Direccion',
                dateOfBirth: 'FechaNacimiento',
                createdAt: 'FechaCreacion'
            }
        },
        treatments: {
            name: 'dbo.DTratamientos',
            primaryKey: 'Id',
            fields: {
                id: 'Id',
                name: 'Nombre',
                price: 'Precio',
                duration: 'DuracionMinutos',
                description: 'Descripcion'
            }
        }
    },
    
    // SQL Queries
    queries: {
        // Obtener todas las citas
        getAllAppointments: `
            SELECT 
                c.Id, c.IdPaciente, c.Fecha, c.Hora, c.DuracionMinutos,
                c.Tratamiento, c.Estado, c.Notas,
                p.Nombre + ' ' + p.Apellidos as PacienteNombre,
                p.Telefono, p.Email
            FROM dbo.DCitas c
            LEFT JOIN dbo.DPacientes p ON c.IdPaciente = p.Id
            ORDER BY c.Fecha DESC, c.Hora DESC
        `,
        
        // Obtener citas de una fecha específica
        getAppointmentsByDate: `
            SELECT 
                c.Id, c.IdPaciente, c.Fecha, c.Hora, c.DuracionMinutos,
                c.Tratamiento, c.Estado, c.Notas,
                p.Nombre + ' ' + p.Apellidos as PacienteNombre,
                p.Telefono, p.Email
            FROM dbo.DCitas c
            LEFT JOIN dbo.DPacientes p ON c.IdPaciente = p.Id
            WHERE CAST(c.Fecha AS DATE) = CAST(? AS DATE)
            ORDER BY c.Hora ASC
        `,
        
        // Crear nueva cita
        createAppointment: `
            INSERT INTO dbo.DCitas 
            (IdPaciente, Fecha, Hora, DuracionMinutos, Tratamiento, Estado, Notas, FechaCreacion, FechaModificacion)
            VALUES (?, ?, ?, ?, ?, 'Programada', ?, GETDATE(), GETDATE())
        `,
        
        // Actualizar cita
        updateAppointment: `
            UPDATE dbo.DCitas 
            SET Fecha = ?, Hora = ?, DuracionMinutos = ?, Tratamiento = ?, 
                Estado = ?, Notas = ?, FechaModificacion = GETDATE()
            WHERE Id = ?
        `,
        
        // Eliminar cita
        deleteAppointment: `
            DELETE FROM dbo.DCitas WHERE Id = ?
        `,
        
        // Obtener todos los pacientes
        getAllPatients: `
            SELECT * FROM dbo.DPacientes ORDER BY Apellidos, Nombre
        `,
        
        // Buscar paciente por nombre
        searchPatient: `
            SELECT * FROM dbo.DPacientes 
            WHERE Nombre LIKE ? OR Apellidos LIKE ? OR Telefono LIKE ?
            ORDER BY Apellidos, Nombre
        `
    }
};

// Configuración de sincronización local
const LOCAL_SYNC = {
    enabled: true,
    syncInterval: 30000, // 30 segundos
    cacheSize: 100, // Máximo 100 registros en caché
    lastSyncTime: null,
    
    // Configuración de almacenamiento local
    storage: {
        key: 'dental_clinic_data',
        version: '1.0',
        expiry: 86400000 // 24 horas
    }
};

// API Endpoints (para futura implementación backend)
const API_ENDPOINTS = {
    baseUrl: 'http://localhost:3000/api',
    endpoints: {
        appointments: '/appointments',
        patients: '/patients',
        treatments: '/treatments',
        sync: '/sync'
    }
};

// Configuración de logging
const LOGGING = {
    enabled: true,
    level: 'info', // 'debug', 'info', 'warn', 'error'
    maxEntries: 1000
};

// Exportar configuraciones
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SQL_CONFIG,
        LOCAL_SYNC,
        API_ENDPOINTS,
        LOGGING
    };
} else {
    window.SQL_CONFIG = SQL_CONFIG;
    window.LOCAL_SYNC = LOCAL_SYNC;
    window.API_ENDPOINTS = API_ENDPOINTS;
    window.LOGGING = LOGGING;
}