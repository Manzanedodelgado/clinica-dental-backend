/**
 * Middleware de Autenticación y Autorización
 * Sistema de Gestión Dental - Rubio García Dental
 */

const jwt = require('jsonwebtoken');
const { dbConfig } = require('../config/database');

class AuthMiddleware {
    /**
     * Verificar token JWT
     */
    static async authenticateToken(req, res, next) {
        try {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];

            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'Token de acceso requerido',
                    code: 'TOKEN_REQUIRED'
                });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Verificar que el usuario aún existe y está activo
            const userQuery = `
                SELECT UserID, Username, Email, Role, IsActive
                FROM DUsers 
                WHERE UserID = @userId AND IsActive = 1
            `;
            
            const result = await dbConfig.query(userQuery, [
                { name: 'userId', value: decoded.userId }
            ]);

            if (result.recordset.length === 0) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuario no válido o inactivo',
                    code: 'USER_INVALID'
                });
            }

            req.user = result.recordset[0];
            next();
        } catch (error) {
            console.error('Error de autenticación:', error);
            
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token expirado',
                    code: 'TOKEN_EXPIRED'
                });
            }
            
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token inválido',
                    code: 'TOKEN_INVALID'
                });
            }

            return res.status(500).json({
                success: false,
                error: 'Error de servidor en autenticación',
                code: 'AUTH_SERVER_ERROR'
            });
        }
    }

    /**
     * Verificar rol de usuario
     */
    static authorizeRoles(...allowedRoles) {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuario no autenticado',
                    code: 'USER_NOT_AUTHENTICATED'
                });
            }

            if (!allowedRoles.includes(req.user.Role)) {
                return res.status(403).json({
                    success: false,
                    error: 'Permisos insuficientes',
                    code: 'INSUFFICIENT_PERMISSIONS',
                    required: allowedRoles,
                    current: req.user.Role
                });
            }

            next();
        };
    }

    /**
     * Verificar si es el propio usuario o tiene rol de administrador
     */
    static async authorizeOwnerOrAdmin(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuario no autenticado',
                    code: 'USER_NOT_AUTHENTICATED'
                });
            }

            const targetUserId = req.params.userId || req.body.userId;
            
            // Permitir si es el mismo usuario o tiene rol de administrador
            if (req.user.UserID === targetUserId || req.user.Role === 'Administrador') {
                return next();
            }

            return res.status(403).json({
                success: false,
                error: 'Solo puede acceder a sus propios datos',
                code: 'ACCESS_DENIED'
            });
        } catch (error) {
            console.error('Error en autorización:', error);
            return res.status(500).json({
                success: false,
                error: 'Error de servidor en autorización',
                code: 'AUTHORIZATION_SERVER_ERROR'
            });
        }
    }

    /**
     * Verificar límites de velocidad
     */
    static createRateLimit(maxRequests = 100, windowMs = 15 * 60 * 1000) {
        const requests = new Map();

        return (req, res, next) => {
            const key = req.ip + (req.user ? req.user.UserID : '');
            const now = Date.now();
            const windowStart = now - windowMs;

            // Limpiar registros antiguos
            for (const [k, timestamps] of requests.entries()) {
                requests.set(k, timestamps.filter(t => t > windowStart));
                if (requests.get(k).length === 0) {
                    requests.delete(k);
                }
            }

            // Verificar límite
            const userRequests = requests.get(key) || [];
            if (userRequests.length >= maxRequests) {
                return res.status(429).json({
                    success: false,
                    error: 'Demasiadas solicitudes, intente más tarde',
                    code: 'RATE_LIMIT_EXCEEDED',
                    retryAfter: Math.ceil(windowMs / 1000)
                });
            }

            // Agregar solicitud actual
            userRequests.push(now);
            requests.set(key, userRequests);

            next();
        };
    }

    /**
     * Validar datos de entrada
     */
    static validateInput(schema) {
        return (req, res, next) => {
            const { error } = schema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos de entrada inválidos',
                    code: 'INVALID_INPUT',
                    details: error.details.map(detail => ({
                        field: detail.path.join('.'),
                        message: detail.message
                    }))
                });
            }
            next();
        };
    }

    /**
     * Log de actividad de usuario
     */
    static logActivity(action, details = {}) {
        return (req, res, next) => {
            const originalSend = res.send;
            
            res.send = function(data) {
                // Log solo en caso de éxito (códigos 2xx)
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const logEntry = {
                        timestamp: new Date().toISOString(),
                        userId: req.user ? req.user.UserID : null,
                        action,
                        method: req.method,
                        path: req.path,
                        ip: req.ip,
                        userAgent: req.get('User-Agent'),
                        statusCode: res.statusCode,
                        details
                    };

                    console.log('📊 Actividad de usuario:', logEntry);
                    
                    // Aquí se podría guardar en base de datos si se requiere
                    // dbConfig.query('INSERT INTO ActivityLogs ...', [logEntry]);
                }
                
                originalSend.call(this, data);
            };
            
            next();
        };
    }
}

module.exports = AuthMiddleware;