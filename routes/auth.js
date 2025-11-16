/**
 * Rutas de Autenticación
 * Sistema de Gestión Dental - Rubio García Dental
 */

const express = require('express');
const AuthController = require('../controllers/authController');
const AuthMiddleware = require('../middleware/auth');
const ValidationMiddleware = require('../middleware/validation');

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión de usuario
 * @access  Public
 */
router.post('/login', 
    ValidationMiddleware.validateLogin(),
    AuthController.login
);

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión
 * @access  Private
 */
router.post('/logout', 
    AuthMiddleware.authenticateToken,
    AuthController.logout
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Renovar token de acceso
 * @access  Public
 */
router.post('/refresh', 
    AuthController.refreshToken
);

/**
 * @route   GET /api/auth/profile
 * @desc    Obtener perfil de usuario
 * @access  Private
 */
router.get('/profile', 
    AuthMiddleware.authenticateToken,
    AuthController.getProfile
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Cambiar contraseña
 * @access  Private
 */
router.put('/change-password', 
    AuthMiddleware.authenticateToken,
    (req, res, next) => {
        const Joi = require('joi');
        const schema = Joi.object({
            currentPassword: Joi.string().min(6).required(),
            newPassword: Joi.string().min(6).required()
        });
        
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Datos de entrada inválidos',
                code: 'VALIDATION_ERROR',
                details: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                    value: detail.context.value
                }))
            });
        }
        next();
    },
    AuthController.changePassword
);

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario (solo administradores)
 * @access  Private (Admin only)
 */
router.post('/register', 
    AuthMiddleware.authenticateToken,
    AuthMiddleware.authorizeRoles('Administrador'),
    ValidationMiddleware.validateUserRegistration(),
    AuthController.register
);

/**
 * @route   GET /api/auth/verify
 * @desc    Verificar token de acceso
 * @access  Private
 */
router.get('/verify', 
    AuthMiddleware.authenticateToken,
    (req, res) => {
        res.json({
            success: true,
            message: 'Token válido',
            data: {
                userId: req.user.UserID,
                username: req.user.Username,
                role: req.user.Role
            }
        });
    }
);

module.exports = router;