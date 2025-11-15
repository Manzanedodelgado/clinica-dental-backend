/**
 * Servidor Principal - Sistema de Gestión Dental
 * Rubio García Dental Clinic Management System
 * 
 * API RESTful con automatizaciones, cumplimiento LOPD y gestión de citas
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
require('dotenv').config();

// Importar configuraciones
const { dbConfig } = require('./config/database');
const AuthMiddleware = require('./middleware/auth');

// Importar rutas
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const patientRoutes = require('./routes/patients');
const legalRoutes = require('./routes/legal');
const questionnaireRoutes = require('./routes/questionnaires');
const automationRoutes = require('./routes/automation');
const systemRoutes = require('./routes/system');

// Configurar logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'dental-management-api' },
    transports: [
        new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: './logs/combined.log' }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configurar middleware de seguridad
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// Configurar CORS
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://tu-dominio.com'] 
        : ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Configurar rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // límite de solicitudes
    message: {
        success: false,
        error: 'Demasiadas solicitudes desde esta IP, intente más tarde',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', limiter);

// Middleware general
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging de requests
app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('Request completado', {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
    });
    
    next();
});

// Endpoint de salud del sistema
app.get('/health', async (req, res) => {
    try {
        // Verificar conexión a base de datos
        const dbStatus = await dbConfig.testConnection();
        
        const healthCheck = {
            status: dbStatus ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV,
            database: {
                connected: dbStatus,
                server: process.env.DB_SERVER,
                database: process.env.DB_DATABASE
            },
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
            }
        };

        res.status(dbStatus ? 200 : 503).json(healthCheck);
    } catch (error) {
        logger.error('Error en health check:', error);
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Error verificando estado del sistema'
        });
    }
});

// Endpoint de información de la API
app.get('/api', (req, res) => {
    res.json({
        name: 'Rubio García Dental Management API',
        version: '1.0.0',
        description: 'Sistema completo de gestión de citas dentales con automatizaciones y cumplimiento LOPD',
        endpoints: {
            auth: {
                'POST /api/auth/login': 'Autenticación de usuario',
                'POST /api/auth/logout': 'Cerrar sesión',
                'GET /api/auth/profile': 'Obtener perfil de usuario',
                'POST /api/auth/refresh': 'Renovar token'
            },
            appointments: {
                'GET /api/appointments': 'Obtener todas las citas',
                'GET /api/appointments/:id': 'Obtener cita específica',
                'POST /api/appointments': 'Crear nueva cita',
                'PUT /api/appointments/:id': 'Actualizar cita',
                'DELETE /api/appointments/:id': 'Eliminar cita',
                'PUT /api/appointments/:id/status': 'Actualizar estado de cita'
            },
            patients: {
                'GET /api/patients': 'Obtener todos los pacientes',
                'POST /api/patients': 'Crear nuevo paciente',
                'PUT /api/patients/:id': 'Actualizar paciente',
                'GET /api/patients/:id': 'Obtener paciente específico'
            },
            legal: {
                'POST /api/legal/documents': 'Registrar documento legal',
                'GET /api/legal/documents/patient/:patientId': 'Obtener documentos de paciente',
                'POST /api/legal/documents/:id/accept': 'Marcar documento como aceptado'
            },
            questionnaires: {
                'POST /api/questionnaires': 'Guardar respuestas de cuestionario',
                'GET /api/questionnaires/appointment/:appointmentId': 'Obtener cuestionarios de cita'
            },
            automation: {
                'POST /api/automation/flows': 'Crear flujo de automatización',
                'GET /api/automation/flows/:id': 'Obtener flujo específico',
                'POST /api/automation/flows/:id/steps/:stepId/response': 'Procesar respuesta de flujo'
            },
            system: {
                'GET /api/system/stats': 'Obtener estadísticas del sistema',
                'GET /api/system/logs': 'Obtener logs del sistema'
            }
        },
        features: [
            'Gestión completa de citas (CRUD)',
            'Sistema de automatizaciones con flujos dinámicos',
            'Cumplimiento automático LOPD/RGPD',
            'Registro de consentimientos informados',
            'Cuestionarios de primera visita',
            'Sistema de confirmación de citas 24h',
            'Integración WhatsApp Business API (preparado)',
            'Sistema de autenticación JWT',
            'Rate limiting y seguridad',
            'Logging y monitoreo'
        ],
        documentation: 'https://github.com/tu-usuario/rubio-garcia-dental-api',
        support: 'support@rubiogacialdental.com'
    });
});

// Configurar rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/legal', legalRoutes);
app.use('/api/questionnaires', questionnaireRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/system', systemRoutes);

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint no encontrado',
        code: 'ENDPOINT_NOT_FOUND',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// Manejo global de errores
app.use((error, req, res, next) => {
    logger.error('Error no manejado:', {
        error: error.message,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    // Errores de validación
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Error de validación de datos',
            code: 'VALIDATION_ERROR',
            details: error.details
        });
    }

    // Errores de SQL Server
    if (error.number) {
        return res.status(500).json({
            success: false,
            error: 'Error de base de datos',
            code: 'DATABASE_ERROR',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
        });
    }

    // Error genérico
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        code: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString()
    });
});

// Manejo graceful de cierre del servidor
process.on('SIGTERM', async () => {
    logger.info('SIGTERM recibido, cerrando servidor gracefully...');
    await dbConfig.closePool();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT recibido, cerrando servidor gracefully...');
    await dbConfig.closePool();
    process.exit(0);
});

// Inicializar servidor
async function startServer() {
    try {
        // Conectar a base de datos
        await dbConfig.createPool();
        logger.info('✅ Base de datos conectada');

        // Iniciar servidor
        const server = app.listen(PORT, () => {
            logger.info(`🚀 Servidor iniciado en puerto ${PORT}`);
            logger.info(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`📊 Health check: http://localhost:${PORT}/health`);
            logger.info(`📋 API Info: http://localhost:${PORT}/api`);
        });

        // Manejo de errores del servidor
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                logger.error(`❌ Puerto ${PORT} ya está en uso`);
            } else {
                logger.error('❌ Error del servidor:', error);
            }
            process.exit(1);
        });

    } catch (error) {
        logger.error('❌ Error iniciando servidor:', error);
        process.exit(1);
    }
}

// Iniciar el servidor
startServer();

module.exports = app;