/**
 * Rutas Doctores y Tratamientos
 * Sistema de Gestión Dental - Rubio García Dental
 * 
 * Endpoints para gestión de personal médico y tipos de tratamiento
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const doctorController = require('../controllers/doctorController');
const AuthMiddleware = require('../middleware/auth');

const router = express.Router();

// ========== DOCTORES ==========

/**
 * @route   GET /api/doctors
 * @desc    Obtener lista de doctores
 * @access  Private
 */
router.get('/', AuthMiddleware.authenticateToken, [
    query('active').optional().isBoolean(),
    query('specialty').optional().isLength({ min: 1 }),
    query('search').optional().isLength({ min: 1 })
], doctorController.getDoctors);

/**
 * @route   GET /api/doctors/:id
 * @desc    Obtener doctor específico
 * @access  Private
 */
router.get('/:id', AuthMiddleware.authenticateToken, [
    param('id').isInt({ min: 1 }).withMessage('ID de doctor inválido')
], doctorController.getDoctor);

/**
 * @route   GET /api/doctors/:id/schedule
 * @desc    Obtener horarios del doctor
 * @access  Private
 */
router.get('/:id/schedule', AuthMiddleware.authenticateToken, [
    param('id').isInt({ min: 1 }).withMessage('ID de doctor inválido'),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
], doctorController.getDoctorSchedule);

/**
 * @route   GET /api/doctors/:id/appointments
 * @desc    Obtener citas del doctor
 * @access  Private
 */
router.get('/:id/appointments', AuthMiddleware.authenticateToken, [
    param('id').isInt({ min: 1 }).withMessage('ID de doctor inválido'),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('status').optional().isIn(['pending', 'confirmed', 'completed', 'cancelled']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
], doctorController.getDoctorAppointments);

/**
 * @route   GET /api/doctors/:id/statistics
 * @desc    Obtener estadísticas del doctor
 * @access  Private
 */
router.get('/:id/statistics', AuthMiddleware.authenticateToken, [
    param('id').isInt({ min: 1 }).withMessage('ID de doctor inválido'),
    query('period').optional().isIn(['today', 'week', 'month', 'quarter', 'year', 'custom']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
], doctorController.getDoctorStatistics);

/**
 * @route   GET /api/doctors/:id/performance
 * @desc    Obtener rendimiento del doctor
 * @access  Private
 */
router.get('/:id/performance', AuthMiddleware.authenticateToken, [
    param('id').isInt({ min: 1 }).withMessage('ID de doctor inválido'),
    query('period').optional().isIn(['month', 'quarter', 'year']),
    query('metrics').optional().isIn(['appointments', 'revenue', 'satisfaction', 'all'])
], doctorController.getDoctorPerformance);

// ========== TRATAMIENTOS ==========

/**
 * @route   GET /api/treatments
 * @desc    Obtener lista de tratamientos
 * @access  Private
 */
router.get('/', AuthMiddleware.authenticateToken, [
    query('active').optional().isBoolean(),
    query('category').optional().isLength({ min: 1 }),
    query('priceRange').optional().isIn(['low', 'medium', 'high']),
    query('duration').optional().isIn(['short', 'medium', 'long']),
    query('search').optional().isLength({ min: 1 })
], doctorController.getTreatments);

/**
 * @route   GET /api/treatments/:id
 * @desc    Obtener tratamiento específico
 * @access  Private
 */
router.get('/:id', AuthMiddleware.authenticateToken, [
    param('id').isInt({ min: 1 }).withMessage('ID de tratamiento inválido')
], doctorController.getTreatment);

/**
 * @route   GET /api/treatments/:id/availability
 * @desc    Ver disponibilidad de tratamientos por fecha
 * @access  Private
 */
router.get('/:id/availability', AuthMiddleware.authenticateToken, [
    param('id').isInt({ min: 1 }).withMessage('ID de tratamiento inválido'),
    query('startDate').isISO8601().withMessage('Fecha de inicio requerida'),
    query('endDate').isISO8601().withMessage('Fecha de fin requerida'),
    query('doctorId').optional().isInt({ min: 1 })
], doctorController.getTreatmentAvailability);

/**
 * @route   GET /api/treatments/:id/appointments
 * @desc    Obtener citas de un tratamiento específico
 * @access  Private
 */
router.get('/:id/appointments', AuthMiddleware.authenticateToken, [
    param('id').isInt({ min: 1 }).withMessage('ID de tratamiento inválido'),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('status').optional().isIn(['pending', 'confirmed', 'completed', 'cancelled']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
], doctorController.getTreatmentAppointments);

/**
 * @route   GET /api/treatments/:id/statistics
 * @desc    Obtener estadísticas de tratamiento
 * @access  Private
 */
router.get('/:id/statistics', AuthMiddleware.authenticateToken, [
    param('id').isInt({ min: 1 }).withMessage('ID de tratamiento inválido'),
    query('period').optional().isIn(['month', 'quarter', 'year', 'custom']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
], doctorController.getTreatmentStatistics);

/**
 * @route   GET /api/treatments/categories
 * @desc    Obtener categorías de tratamientos
 * @access  Private
 */
router.get('/categories', AuthMiddleware.authenticateToken, doctorController.getTreatmentCategories);

/**
 * @route   GET /api/treatments/popular
 * @desc    Obtener tratamientos más populares
 * @access  Private
 */
router.get('/popular', AuthMiddleware.authenticateToken, [
    query('period').optional().isIn(['month', 'quarter', 'year']),
    query('limit').optional().isInt({ min: 1, max: 50 })
], doctorController.getPopularTreatments);

/**
 * @route   GET /api/treatments/recommended
 * @desc    Obtener tratamientos recomendados para paciente
 * @access  Private
 */
router.get('/recommended', AuthMiddleware.authenticateToken, [
    query('patientId').isInt({ min: 1 }).withMessage('ID de paciente requerido'),
    query('conditions').optional().isArray(),
    query('age').optional().isInt({ min: 0, max: 150 }),
    query('medicalHistory').optional().isArray()
], doctorController.getRecommendedTreatments);

// ========== ASIGNACIÓN DOCTOR-TRATAMIENTO ==========

/**
 * @route   GET /api/assignments
 * @desc    Obtener asignaciones doctor-tratamiento
 * @access  Private
 */
router.get('/assignments', AuthMiddleware.authenticateToken, [
    query('doctorId').optional().isInt({ min: 1 }),
    query('treatmentId').optional().isInt({ min: 1 }),
    query('active').optional().isBoolean()
], doctorController.getAssignments);

/**
 * @route   POST /api/assignments
 * @desc    Asignar tratamiento a doctor
 * @access  Private
 */
router.post('/assignments', AuthMiddleware.authenticateToken, [
    body('doctorId').isInt({ min: 1 }).withMessage('ID de doctor requerido'),
    body('treatmentId').isInt({ min: 1 }).withMessage('ID de tratamiento requerido'),
    body('duration').isInt({ min: 15, max: 480 }).withMessage('Duración entre 15 y 480 minutos'),
    body('price').isFloat({ min: 0 }).withMessage('Precio debe ser >= 0'),
    body('specialInstructions').optional().isLength({ max: 500 }),
    body('requiredEquipment').optional().isArray(),
    body('preparationTime').optional().isInt({ min: 0, max: 120 }),
    body('followUpRequired').optional().isBoolean()
], doctorController.createAssignment);

/**
 * @route   PUT /api/assignments/:id
 * @desc    Actualizar asignación doctor-tratamiento
 * @access  Private
 */
router.put('/assignments/:id', AuthMiddleware.authenticateToken, [
    param('id').isInt({ min: 1 }).withMessage('ID de asignación inválido'),
    body('duration').optional().isInt({ min: 15, max: 480 }),
    body('price').optional().isFloat({ min: 0 }),
    body('specialInstructions').optional().isLength({ max: 500 }),
    body('requiredEquipment').optional().isArray(),
    body('preparationTime').optional().isInt({ min: 0, max: 120 }),
    body('followUpRequired').optional().isBoolean(),
    body('active').optional().isBoolean()
], doctorController.updateAssignment);

/**
 * @route   DELETE /api/assignments/:id
 * @desc    Eliminar asignación doctor-tratamiento
 * @access  Private
 */
router.delete('/assignments/:id', AuthMiddleware.authenticateToken, [
    param('id').isInt({ min: 1 }).withMessage('ID de asignación inválido')
], doctorController.deleteAssignment);

// ========== HORARIOS Y DISPONIBILIDAD ==========

/**
 * @route   GET /api/schedule/availability
 * @desc    Verificar disponibilidad de horarios
 * @access  Private
 */
router.get('/schedule/availability', AuthMiddleware.authenticateToken, [
    query('doctorId').isInt({ min: 1 }).withMessage('ID de doctor requerido'),
    query('date').isISO8601().withMessage('Fecha requerida'),
    query('duration').isInt({ min: 15, max: 480 }).withMessage('Duración requerida'),
    query('treatmentId').optional().isInt({ min: 1 })
], doctorController.checkAvailability);

/**
 * @route   GET /api/schedule/slots
 * @desc    Obtener slots de tiempo disponibles
 * @access  Private
 */
router.get('/schedule/slots', AuthMiddleware.authenticateToken, [
    query('doctorId').isInt({ min: 1 }).withMessage('ID de doctor requerido'),
    query('date').isISO8601().withMessage('Fecha requerida'),
    query('treatmentId').optional().isInt({ min: 1 }),
    query('duration').optional().isInt({ min: 15, max: 480 })
], doctorController.getAvailableSlots);

/**
 * @route   GET /api/schedule/working-hours
 * @desc    Obtener horarios de trabajo del doctor
 * @access  Private
 */
router.get('/schedule/working-hours', AuthMiddleware.authenticateToken, [
    query('doctorId').isInt({ min: 1 }).withMessage('ID de doctor requerido'),
    query('weekStart').optional().isISO8601()
], doctorController.getWorkingHours);

/**
 * @route   POST /api/schedule/working-hours
 * @desc    Establecer horarios de trabajo del doctor
 * @access  Private
 */
router.post('/schedule/working-hours', AuthMiddleware.authenticateToken, [
    body('doctorId').isInt({ min: 1 }).withMessage('ID de doctor requerido'),
    body('schedule').isArray({ min: 1 }).withMessage('Horario requerido'),
    body('schedule.*.dayOfWeek').isInt({ min: 0, max: 6 }).withMessage('Día de semana inválido'),
    body('schedule.*.startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Hora de inicio inválida'),
    body('schedule.*.endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Hora de fin inválida'),
    body('schedule.*.isWorking').isBoolean().withMessage('Estado de trabajo requerido')
], doctorController.setWorkingHours);

// ========== REPORTES Y ESTADÍSTICAS ==========

/**
 * @route   GET /api/reports/doctor-utilization
 * @desc    Reporte de utilización de doctores
 * @access  Private
 */
router.get('/reports/doctor-utilization', AuthMiddleware.authenticateToken, [
    query('period').optional().isIn(['week', 'month', 'quarter', 'year', 'custom']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('doctorId').optional().isInt({ min: 1 })
], doctorController.getDoctorUtilizationReport);

/**
 * @route   GET /api/reports/treatment-popularity
 * @desc    Reporte de popularidad de tratamientos
 * @access  Private
 */
router.get('/reports/treatment-popularity', AuthMiddleware.authenticateToken, [
    query('period').optional().isIn(['month', 'quarter', 'year', 'custom']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('category').optional().isLength({ min: 1 })
], doctorController.getTreatmentPopularityReport);

/**
 * @route   GET /api/reports/revenue-by-doctor
 * @desc    Reporte de ingresos por doctor
 * @access  Private
 */
router.get('/reports/revenue-by-doctor', AuthMiddleware.authenticateToken, [
    query('period').optional().isIn(['month', 'quarter', 'year', 'custom']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('doctorId').optional().isInt({ min: 1 }),
    query('groupBy').optional().isIn(['doctor', 'treatment', 'month', 'day'])
], doctorController.getRevenueByDoctorReport);

/**
 * @route   GET /api/statistics/overview
 * @desc    Estadísticas generales de doctores y tratamientos
 * @access  Private
 */
router.get('/statistics/overview', AuthMiddleware.authenticateToken, [
    query('period').optional().isIn(['month', 'quarter', 'year'])
], doctorController.getOverviewStatistics);

/**
 * @route   GET /api/statistics/trends
 * @desc    Tendencias de tratamientos y doctores
 * @access  Private
 */
router.get('/statistics/trends', AuthMiddleware.authenticateToken, [
    query('period').optional().isIn(['month', 'quarter', 'year']),
    query('treatmentId').optional().isInt({ min: 1 }),
    query('doctorId').optional().isInt({ min: 1 }),
    query('metric').optional().isIn(['appointments', 'revenue', 'duration', 'satisfaction'])
], doctorController.getTrends);

// ========== CONFIGURACIÓN ==========

/**
 * @route   GET /api/config/settings
 * @desc    Obtener configuración de doctores y tratamientos
 * @access  Private
 */
router.get('/config/settings', AuthMiddleware.authenticateToken, doctorController.getConfigSettings);

/**
 * @route   PUT /api/config/settings
 * @desc    Actualizar configuración de doctores y tratamientos
 * @access  Private
 */
router.put('/config/settings', AuthMiddleware.authenticateToken, [
    body('defaultAppointmentDuration').optional().isInt({ min: 15, max: 480 }),
    body('advanceBookingLimit').optional().isInt({ min: 1, max: 365 }),
    body('workingDays').optional().isArray(),
    body('workingHours').optional().object(),
    body('breakTimes').optional().isArray(),
    body('maxDailyAppointments').optional().isInt({ min: 1, max: 50 }),
    body('defaultTreatmentDurations').optional().isObject(),
    body('autoAssignment').optional().isBoolean(),
    body('weekendScheduling').optional().isBoolean()
], doctorController.updateConfigSettings);

/**
 * @route   GET /api/config/templates
 * @desc    Obtener plantillas de horarios
 * @access  Private
 */
router.get('/config/templates', AuthMiddleware.authenticateToken, doctorController.getScheduleTemplates);

/**
 * @route   POST /api/config/templates
 * @desc    Crear plantilla de horario
 * @access  Private
 */
router.post('/config/templates', AuthMiddleware.authenticateToken, [
    body('name').isLength({ min: 1, max: 100 }).withMessage('Nombre requerido'),
    body('schedule').isArray({ min: 1 }).withMessage('Horario requerido'),
    body('description').optional().isLength({ max: 500 }),
    body('isDefault').optional().isBoolean()
], doctorController.createScheduleTemplate);

// ========== ACTIVIDAD RECIENTE ==========

/**
 * @route   GET /api/activity
 * @desc    Actividad reciente de doctores y tratamientos
 * @access  Private
 */
router.get('/activity', AuthMiddleware.authenticateToken, [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('type').optional().isIn(['appointment', 'assignment', 'schedule', 'treatment']),
    query('doctorId').optional().isInt({ min: 1 }),
    query('treatmentId').optional().isInt({ min: 1 })
], doctorController.getActivity);

// ========== EXPORTACIÓN ==========

/**
 * @route   GET /api/export/doctors
 * @desc    Exportar datos de doctores
 * @access  Private
 */
router.get('/export/doctors', AuthMiddleware.authenticateToken, [
    query('format').optional().isIn(['csv', 'excel', 'pdf']),
    query('includeSchedule').optional().isBoolean(),
    query('includeStatistics').optional().isBoolean()
], doctorController.exportDoctors);

/**
 * @route   GET /api/export/treatments
 * @desc    Exportar datos de tratamientos
 * @access  Private
 */
router.get('/export/treatments', AuthMiddleware.authenticateToken, [
    query('format').optional().isIn(['csv', 'excel', 'pdf']),
    query('category').optional().isLength({ min: 1 }),
    query('includePricing').optional().isBoolean(),
    query('includeStatistics').optional().isBoolean()
], doctorController.exportTreatments);

/**
 * @route   GET /api/export/assignments
 * @desc    Exportar asignaciones doctor-tratamiento
 * @access  Private
 */
router.get('/export/assignments', AuthMiddleware.authenticateToken, [
    query('format').optional().isIn(['csv', 'excel', 'pdf']),
    query('doctorId').optional().isInt({ min: 1 }),
    query('active').optional().isBoolean()
], doctorController.exportAssignments);

module.exports = router;