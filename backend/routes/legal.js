/**
 * Rutas de Documentos Legales y LOPD
 * Sistema de Gestión Dental - Rubio García Dental
 */

const express = require('express');
const LegalController = require('../controllers/legalController');
const AuthMiddleware = require('../middleware/auth');
const ValidationMiddleware = require('../middleware/validation');

const router = express.Router();

/**
 * @route   POST /api/legal/documents
 * @desc    Crear/registrar documento legal
 * @access  Private
 */
router.post('/documents', 
    AuthMiddleware.authenticateToken,
    ValidationMiddleware.validateLegalDocument(),
    AuthMiddleware.logActivity('create_legal_document'),
    LegalController.createLegalDocument
);

/**
 * @route   POST /api/legal/documents/:id/accept
 * @desc    Marcar documento como aceptado
 * @access  Private
 */
router.post('/documents/:id/accept', 
    AuthMiddleware.authenticateToken,
    AuthMiddleware.logActivity('accept_legal_document', { documentId: ':id' }),
    LegalController.acceptDocument
);

/**
 * @route   GET /api/legal/documents/patient/:patientId
 * @desc    Obtener documentos legales de un paciente
 * @access  Private
 */
router.get('/documents/patient/:patientId', 
    AuthMiddleware.authenticateToken,
    ValidationMiddleware.validateQueryParams(),
    AuthMiddleware.logActivity('get_patient_legal_documents', { patientId: ':patientId' }),
    LegalController.getPatientDocuments
);

/**
 * @route   GET /api/legal/documents/appointment/:appointmentId
 * @desc    Obtener documentos legales de una cita específica
 * @access  Private
 */
router.get('/documents/appointment/:appointmentId', 
    AuthMiddleware.authenticateToken,
    AuthMiddleware.logActivity('get_appointment_legal_documents', { appointmentId: ':appointmentId' }),
    LegalController.getAppointmentDocuments
);

/**
 * @route   GET /api/legal/lopd-compliance/:patientId
 * @desc    Verificar cumplimiento LOPD para un paciente
 * @access  Private
 */
router.get('/lopd-compliance/:patientId', 
    AuthMiddleware.authenticateToken,
    AuthMiddleware.logActivity('check_lopd_compliance', { patientId: ':patientId' }),
    LegalController.checkLOPDCompliance
);

/**
 * @route   GET /api/legal/templates
 * @desc    Obtener plantillas de documentos legales
 * @access  Private
 */
router.get('/templates', 
    AuthMiddleware.authenticateToken,
    AuthMiddleware.logActivity('get_legal_templates'),
    LegalController.getLegalTemplates
);

/**
 * @route   GET /api/legal/stats
 * @desc    Obtener estadísticas de cumplimiento legal
 * @access  Private (Admin only)
 */
router.get('/stats', 
    AuthMiddleware.authenticateToken,
    AuthMiddleware.authorizeRoles('Administrador'),
    ValidationMiddleware.validateQueryParams(),
    AuthMiddleware.logActivity('get_legal_stats'),
    LegalController.getLegalStats
);

module.exports = router;