/**
 * Rutas del Sistema
 * Sistema de Gestión Dental - Rubio García Dental
 */

const express = require('express');
const { dbConfig } = require('../config/database');
const AuthMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/system/stats
 * @desc    Obtener estadísticas generales del sistema
 * @access  Private (Admin only)
 */
router.get('/stats', 
    AuthMiddleware.authenticateToken,
    AuthMiddleware.authorizeRoles('Administrador'),
    AuthMiddleware.logActivity('get_system_stats'),
    async (req, res) => {
        try {
            // Estadísticas de citas
            const appointmentsStats = await dbConfig.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN Status = 'Planificada' THEN 1 ELSE 0 END) as planificadas,
                    SUM(CASE WHEN Status = 'Confirmada' THEN 1 ELSE 0 END) as confirmadas,
                    SUM(CASE WHEN Status = 'Aceptada' THEN 1 ELSE 0 END) as aceptadas,
                    SUM(CASE WHEN Status = 'Cancelada' THEN 1 ELSE 0 END) as canceladas,
                    SUM(CASE WHEN Status = 'Anula' THEN 1 ELSE 0 END) as anuladas
                FROM DCitas
            `);

            // Estadísticas de pacientes
            const patientsStats = await dbConfig.query(`
                SELECT COUNT(*) as total FROM DPatients
            `);

            // Estadísticas de flujos de automatización
            const automationStats = await dbConfig.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN Status = 'active' THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN Status = 'completed' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN Status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
                FROM DAutomationFlows
            `);

            // Estadísticas de documentos legales
            const legalStats = await dbConfig.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN Accepted = 1 THEN 1 ELSE 0 END) as accepted
                FROM DLegalDocuments
            `);

            // Estadísticas de cuestionarios
            const questionnaireStats = await dbConfig.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN LOPDAccepted = 1 THEN 1 ELSE 0 END) as lopdAccepted
                FROM DQuestionnaireResponses
            `);

            // Citas del día
            const todayAppointments = await dbConfig.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN Status = 'Confirmada' THEN 1 ELSE 0 END) as confirmadas,
                    SUM(CASE WHEN Status = 'Aceptada' THEN 1 ELSE 0 END) as aceptadas
                FROM DCitas 
                WHERE Date = CAST(GETDATE() AS DATE)
            `);

            // Usuarios activos (simulado)
            const activeUsers = await dbConfig.query(`
                SELECT COUNT(*) as total FROM DUsers WHERE IsActive = 1
            `);

            const stats = {
                appointments: {
                    total: appointmentsStats.recordset[0].total || 0,
                    planificadas: appointmentsStats.recordset[0].planificadas || 0,
                    confirmadas: appointmentsStats.recordset[0].confirmadas || 0,
                    aceptadas: appointmentsStats.recordset[0].aceptadas || 0,
                    canceladas: appointmentsStats.recordset[0].canceladas || 0,
                    anuladas: appointmentsStats.recordset[0].anuladas || 0
                },
                patients: {
                    total: patientsStats.recordset[0].total || 0
                },
                automation: {
                    total: automationStats.recordset[0].total || 0,
                    active: automationStats.recordset[0].active || 0,
                    completed: automationStats.recordset[0].completed || 0,
                    cancelled: automationStats.recordset[0].cancelled || 0
                },
                legalDocuments: {
                    total: legalStats.recordset[0].total || 0,
                    accepted: legalStats.recordset[0].accepted || 0,
                    acceptanceRate: legalStats.recordset[0].total > 0 ? 
                        Math.round((legalStats.recordset[0].accepted / legalStats.recordset[0].total) * 100) : 0
                },
                questionnaires: {
                    total: questionnaireStats.recordset[0].total || 0,
                    lopdAccepted: questionnaireStats.recordset[0].lopdAccepted || 0,
                    lopdComplianceRate: questionnaireStats.recordset[0].total > 0 ? 
                        Math.round((questionnaireStats.recordset[0].lopdAccepted / questionnaireStats.recordset[0].total) * 100) : 0
                },
                today: {
                    appointments: todayAppointments.recordset[0].total || 0,
                    confirmed: todayAppointments.recordset[0].confirmadas || 0,
                    accepted: todayAppointments.recordset[0].aceptadas || 0
                },
                users: {
                    active: activeUsers.recordset[0].total || 0
                },
                lastUpdated: new Date().toISOString()
            };

            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('Error obteniendo estadísticas del sistema:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'GET_SYSTEM_STATS_ERROR'
            });
        }
    }
);

/**
 * @route   GET /api/system/health
 * @desc    Verificar estado de salud del sistema
 * @access  Private
 */
router.get('/health', 
    AuthMiddleware.authenticateToken,
    async (req, res) => {
        try {
            // Verificar conexión a base de datos
            const dbTest = await dbConfig.testConnection();
            
            // Obtener estadísticas de uso de memoria
            const memoryUsage = process.memoryUsage();
            
            // Verificar tiempo de actividad del servidor
            const uptime = process.uptime();

            const health = {
                status: dbTest ? 'healthy' : 'unhealthy',
                timestamp: new Date().toISOString(),
                database: {
                    connected: dbTest,
                    server: process.env.DB_SERVER,
                    database: process.env.DB_DATABASE
                },
                server: {
                    uptime: `${Math.floor(uptime / 60)} minutos`,
                    uptimeSeconds: Math.floor(uptime),
                    nodeVersion: process.version,
                    platform: process.platform,
                    memory: {
                        used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
                        total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
                        external: Math.round(memoryUsage.external / 1024 / 1024) + 'MB'
                    }
                },
                environment: {
                    nodeEnv: process.env.NODE_ENV || 'development',
                    port: process.env.PORT || 3000
                }
            };

            res.status(dbTest ? 200 : 503).json({
                success: dbTest,
                data: health
            });

        } catch (error) {
            console.error('Error verificando salud del sistema:', error);
            res.status(500).json({
                success: false,
                error: 'Error verificando estado del sistema',
                code: 'SYSTEM_HEALTH_ERROR'
            });
        }
    }
);

/**
 * @route   GET /api/system/logs
 * @desc    Obtener logs del sistema
 * @access  Private (Admin only)
 */
router.get('/logs', 
    AuthMiddleware.authenticateToken,
    AuthMiddleware.authorizeRoles('Administrador'),
    AuthMiddleware.logActivity('get_system_logs'),
    async (req, res) => {
        try {
            const { limit = 100, level = 'all', component = 'all' } = req.query;

            let query = `
                SELECT TOP @limit
                    LogID,
                    CreatedAt,
                    Level,
                    Component,
                    Message,
                    Details
                FROM DSystemLogs
                WHERE 1=1
            `;

            const params = [{ name: 'limit', value: parseInt(limit) }];

            if (level !== 'all') {
                query += ` AND Level = @level`;
                params.push({ name: 'level', value: level.toUpperCase() });
            }

            if (component !== 'all') {
                query += ` AND Component = @component`;
                params.push({ name: 'component', value: component });
            }

            query += ` ORDER BY CreatedAt DESC`;

            const result = await dbConfig.query(query, params);

            const logs = result.recordset.map(log => ({
                id: log.LogID,
                timestamp: log.CreatedAt,
                level: log.Level,
                component: log.Component,
                message: log.Message,
                details: log.Details ? JSON.parse(log.Details) : null
            }));

            res.json({
                success: true,
                data: {
                    logs,
                    count: logs.length,
                    filters: {
                        limit: parseInt(limit),
                        level,
                        component
                    }
                }
            });

        } catch (error) {
            console.error('Error obteniendo logs del sistema:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'GET_SYSTEM_LOGS_ERROR'
            });
        }
    }
);

/**
 * @route   GET /api/system/config
 * @desc    Obtener configuración del sistema (sin datos sensibles)
 * @access  Private (Admin only)
 */
router.get('/config', 
    AuthMiddleware.authenticateToken,
    AuthMiddleware.authorizeRoles('Administrador'),
    AuthMiddleware.logActivity('get_system_config'),
    async (req, res) => {
        try {
            const config = {
                database: {
                    server: process.env.DB_SERVER,
                    database: process.env.DB_DATABASE,
                    encryption: process.env.DB_ENCRYPT === 'true'
                },
                jwt: {
                    algorithm: 'HS256',
                    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
                },
                automation: {
                    enabled: process.env.AUTOMATION_ENABLED === 'true',
                    confirmationLeadTime: parseInt(process.env.CONFIRMATION_LEAD_TIME) || 24,
                    maxRetries: parseInt(process.env.MAX_AUTOMATION_RETRIES) || 3
                },
                legal: {
                    lopdEnabled: process.env.LOPD_ENABLED === 'true',
                    gdprVersion: process.env.GDPR_COMPLIANCE_VERSION || '1.0'
                },
                limits: {
                    rateLimitWindow: process.env.RATE_LIMIT_WINDOW_MS || '15m',
                    maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS || 100
                },
                environment: {
                    nodeEnv: process.env.NODE_ENV || 'development',
                    version: process.env.npm_package_version || '1.0.0'
                }
            };

            res.json({
                success: true,
                data: config
            });

        } catch (error) {
            console.error('Error obteniendo configuración del sistema:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'GET_SYSTEM_CONFIG_ERROR'
            });
        }
    }
);

/**
 * @route   POST /api/system/log
 * @desc    Registrar log del sistema
 * @access  Private
 */
router.post('/log', 
    AuthMiddleware.authenticateToken,
    async (req, res) => {
        try {
            const { level, component, message, details = null } = req.body;

            // Validar nivel
            const validLevels = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
            if (!validLevels.includes(level.toUpperCase())) {
                return res.status(400).json({
                    success: false,
                    error: 'Nivel de log inválido',
                    code: 'INVALID_LOG_LEVEL',
                    validLevels
                });
            }

            await dbConfig.query(`
                INSERT INTO DSystemLogs (Level, Component, Message, Details, UserID, CreatedAt)
                VALUES (@level, @component, @message, @details, @userId, GETDATE())
            `, [
                { name: 'level', value: level.toUpperCase() },
                { name: 'component', value: component || 'api' },
                { name: 'message', value: message },
                { name: 'details', value: details ? JSON.stringify(details) : null },
                { name: 'userId', value: req.user.UserID }
            ]);

            res.json({
                success: true,
                message: 'Log registrado exitosamente'
            });

        } catch (error) {
            console.error('Error registrando log del sistema:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'SYSTEM_LOG_ERROR'
            });
        }
    }
);

/**
 * @route   DELETE /api/system/logs
 * @desc    Limpiar logs antiguos (solo administradores)
 * @access  Private (Admin only)
 */
router.delete('/logs', 
    AuthMiddleware.authenticateToken,
    AuthMiddleware.authorizeRoles('Administrador'),
    async (req, res) => {
        try {
            const { daysToKeep = 30 } = req.body;

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysToKeep));

            const result = await dbConfig.query(`
                DELETE FROM DSystemLogs 
                WHERE CreatedAt < @cutoffDate
            `, [
                { name: 'cutoffDate', value: cutoffDate.toISOString() }
            ]);

            res.json({
                success: true,
                message: `Logs anteriores al ${cutoffDate.toDateString()} eliminados`,
                deletedCount: result.rowsAffected[0]
            });

        } catch (error) {
            console.error('Error limpiando logs del sistema:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'CLEAR_LOGS_ERROR'
            });
        }
    }
);

module.exports = router;