/**
 * Rutas de Citas
 * Sistema de Gestión Dental - Rubio García Dental
 */

const express = require('express');
const AppointmentController = require('../controllers/appointmentController');
const AuthMiddleware = require('../middleware/auth');
const ValidationMiddleware = require('../middleware/validation');

const router = express.Router();

/**
 * @route   GET /api/appointments
 * @desc    Obtener todas las citas con paginación y filtros
 * @access  Private
 */
router.get('/', 
    AuthMiddleware.authenticateToken,
    ValidationMiddleware.validateQueryParams(),
    AuthMiddleware.logActivity('get_appointments'),
    AppointmentController.getAppointments
);

/**
 * @route   GET /api/appointments/:id
 * @desc    Obtener cita específica por ID
 * @access  Private
 */
router.get('/:id', 
    AuthMiddleware.authenticateToken,
    AuthMiddleware.logActivity('get_appointment', { appointmentId: ':id' }),
    AppointmentController.getAppointmentById
);

/**
 * @route   POST /api/appointments
 * @desc    Crear nueva cita
 * @access  Private
 */
router.post('/', 
    AuthMiddleware.authenticateToken,
    ValidationMiddleware.validateAppointmentCreation(),
    AuthMiddleware.logActivity('create_appointment'),
    AppointmentController.createAppointment
);

/**
 * @route   PUT /api/appointments/:id
 * @desc    Actualizar cita existente
 * @access  Private
 */
router.put('/:id', 
    AuthMiddleware.authenticateToken,
    ValidationMiddleware.validateAppointmentUpdate(),
    AuthMiddleware.logActivity('update_appointment', { appointmentId: ':id' }),
    AppointmentController.updateAppointment
);

/**
 * @route   DELETE /api/appointments/:id
 * @desc    Eliminar cita
 * @access  Private (Admin/Dentista only)
 */
router.delete('/:id', 
    AuthMiddleware.authenticateToken,
    AuthMiddleware.authorizeRoles('Administrador', 'Dentista'),
    AuthMiddleware.logActivity('delete_appointment', { appointmentId: ':id' }),
    AppointmentController.deleteAppointment
);

/**
 * @route   PUT /api/appointments/:id/status
 * @desc    Actualizar estado de cita (Planificada, Confirmada, Aceptada, Cancelada, Anula)
 * @access  Private
 */
router.put('/:id/status', 
    AuthMiddleware.authenticateToken,
    (req, res, next) => {
        const Joi = require('joi');
        const schema = Joi.object({
            status: Joi.string().valid('Planificada', 'Confirmada', 'Aceptada', 'Cancelada', 'Anula').required(),
            reason: Joi.string().max(500).allow('', null).optional()
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
    AuthMiddleware.logActivity('update_appointment_status', { appointmentId: ':id' }),
    AppointmentController.updateAppointmentStatus
);

/**
 * @route   GET /api/appointments/pending/automations
 * @desc    Obtener citas pendientes para automatización (24h antes)
 * @access  Private
 */
router.get('/pending/automations', 
    AuthMiddleware.authenticateToken,
    AuthMiddleware.logActivity('get_pending_automations'),
    AppointmentController.getPendingAutomations
);

/**
 * @route   GET /api/appointments/stats
 * @desc    Obtener estadísticas de citas
 * @access  Private (Admin only)
 */
router.get('/stats', 
    AuthMiddleware.authenticateToken,
    AuthMiddleware.authorizeRoles('Administrador'),
    ValidationMiddleware.validateQueryParams(),
    AuthMiddleware.logActivity('get_appointment_stats'),
    AppointmentController.getAppointmentStats
);

/**
 * @route   GET /api/appointments/date/:date
 * @desc    Obtener citas por fecha específica
 * @access  Private
 */
router.get('/date/:date', 
    AuthMiddleware.authenticateToken,
    (req, res, next) => {
        const Joi = require('joi');
        const schema = Joi.object({
            date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required()
        });
        
        const { error } = schema.validate(req.params);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Fecha inválida. Formato requerido: YYYY-MM-DD',
                code: 'INVALID_DATE_FORMAT'
            });
        }
        next();
    },
    AuthMiddleware.logActivity('get_appointments_by_date', { date: ':date' }),
    AppointmentController.getAppointments
);

module.exports = router;