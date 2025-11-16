/**
 * Rutas WhatsApp Business API
 * Sistema de Gestión Dental - Rubio García Dental
 * 
 * Endpoints para integración WhatsApp y conversaciones
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const whatsappController = require('../controllers/whatsappController');
const AuthMiddleware = require('../middleware/auth');

const router = express.Router();

// ========== CONVERSACIONES ==========

/**
 * @route   GET /api/whatsapp/conversations
 * @desc    Obtener lista de conversaciones WhatsApp
 * @access  Private
 */
router.get('/conversations', AuthMiddleware.authenticate, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['active', 'archived', 'blocked']),
    query('patientId').optional().isInt()
], whatsappController.getConversations);

/**
 * @route   POST /api/whatsapp/conversations
 * @desc    Iniciar nueva conversación
 * @access  Private
 */
router.post('/conversations', AuthMiddleware.authenticate, [
    body('patientId').isInt({ min: 1 }).withMessage('ID de paciente requerido'),
    body('message').isLength({ min: 1, max: 1000 }).withMessage('Mensaje requerido'),
    body('appointmentId').optional().isInt({ min: 1 })
], whatsappController.createConversation);

/**
 * @route   GET /api/whatsapp/conversations/:id
 * @desc    Obtener conversación específica
 * @access  Private
 */
router.get('/conversations/:id', AuthMiddleware.authenticate, [
    param('id').isInt({ min: 1 }).withMessage('ID de conversación inválido')
], whatsappController.getConversation);

/**
 * @route   GET /api/whatsapp/conversations/:id/messages
 * @desc    Obtener mensajes de conversación
 * @access  Private
 */
router.get('/conversations/:id/messages', AuthMiddleware.authenticate, [
    param('id').isInt({ min: 1 }).withMessage('ID de conversación inválido'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
], whatsappController.getMessages);

// ========== MENSAJES ==========

/**
 * @route   POST /api/whatsapp/messages
 * @desc    Enviar mensaje WhatsApp
 * @access  Private
 */
router.post('/messages', AuthMiddleware.authenticate, [
    body('conversationId').isInt({ min: 1 }).withMessage('ID de conversación requerido'),
    body('text').isLength({ min: 1, max: 1000 }).withMessage('Texto del mensaje requerido'),
    body('type').optional().isIn(['text', 'template', 'interactive']).withMessage('Tipo de mensaje inválido'),
    body('templateId').optional().isInt({ min: 1 })
], whatsappController.sendMessage);

/**
 * @route   GET /api/whatsapp/messages/pending
 * @desc    Obtener mensajes pendientes de procesar (para IA)
 * @access  Private
 */
router.get('/messages/pending', AuthMiddleware.authenticate, [
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('appointmentId').optional().isInt({ min: 1 })
], whatsappController.getPendingMessages);

/**
 * @route   POST /api/whatsapp/messages/:id/read
 * @desc    Marcar mensaje como leído
 * @access  Private
 */
router.post('/messages/:id/read', AuthMiddleware.authenticate, [
    param('id').isInt({ min: 1 }).withMessage('ID de mensaje inválido')
], whatsappController.markAsRead);

// ========== PLANTILLAS ==========

/**
 * @route   GET /api/whatsapp/templates
 * @desc    Obtener plantillas de mensajes
 * @access  Private
 */
router.get('/templates', AuthMiddleware.authenticate, [
    query('type').optional().isIn(['appointment', 'confirmation', 'reminder', 'generic']),
    query('active').optional().isBoolean()
], whatsappController.getTemplates);

/**
 * @route   POST /api/whatsapp/templates
 * @desc    Crear nueva plantilla
 * @access  Private
 */
router.post('/templates', AuthMiddleware.authenticate, [
    body('name').isLength({ min: 1, max: 100 }).withMessage('Nombre requerido'),
    body('content').isLength({ min: 1, max: 1000 }).withMessage('Contenido requerido'),
    body('type').isIn(['appointment', 'confirmation', 'reminder', 'generic']).withMessage('Tipo inválido'),
    body('variables').optional().isArray()
], whatsappController.createTemplate);

// ========== CONFIRMACIONES DE CITA ==========

/**
 * @route   POST /api/whatsapp/confirmation/send
 * @desc    Enviar confirmación de cita 24h antes
 * @access  Private
 */
router.post('/confirmation/send', AuthMiddleware.authenticate, [
    body('appointmentId').isInt({ min: 1 }).withMessage('ID de cita requerido'),
    body('customMessage').optional().isLength({ max: 500 })
], whatsappController.sendAppointmentConfirmation);

/**
 * @route   POST /api/whatsapp/confirmation/process
 * @desc    Procesar respuesta de confirmación del paciente
 * @access  Private
 */
router.post('/confirmation/process', AuthMiddleware.authenticate, [
    body('appointmentId').isInt({ min: 1 }).withMessage('ID de cita requerido'),
    body('response').isIn(['confirm', 'cancel', 'reschedule']).withMessage('Respuesta inválida'),
    body('patientMessage').isLength({ min: 1 }).withMessage('Mensaje del paciente requerido'),
    body('confidence').optional().isFloat({ min: 0, max: 1 })
], whatsappController.processConfirmationResponse);

// ========== ESTADÍSTICAS ==========

/**
 * @route   GET /api/whatsapp/statistics
 * @desc    Obtener estadísticas de WhatsApp
 * @access  Private
 */
router.get('/statistics', AuthMiddleware.authenticate, [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('metric').optional().isIn(['conversations', 'messages', 'confirmations', 'responses'])
], whatsappController.getStatistics);

/**
 * @route   GET /api/whatsapp/activity
 * @desc    Obtener actividad reciente de WhatsApp
 * @access  Private
 */
router.get('/activity', AuthMiddleware.authenticate, [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('type').optional().isIn(['message', 'confirmation', 'template', 'error'])
], whatsappController.getActivity);

// ========== ARCHIVOS ==========

/**
 * @route   POST /api/whatsapp/media
 * @desc    Subir archivo multimedia
 * @access  Private
 */
router.post('/media', AuthMiddleware.authenticate, [
    body('conversationId').isInt({ min: 1 }).withMessage('ID de conversación requerido'),
    body('fileType').isIn(['image', 'document', 'audio', 'video']).withMessage('Tipo de archivo inválido'),
    body('fileName').isLength({ min: 1, max: 255 }).withMessage('Nombre de archivo requerido')
], whatsappController.uploadMedia);

/**
 * @route   GET /api/whatsapp/media/:id/download
 * @desc    Descargar archivo multimedia
 * @access  Private
 */
router.get('/media/:id/download', AuthMiddleware.authenticate, [
    param('id').isInt({ min: 1 }).withMessage('ID de media inválido')
], whatsappController.downloadMedia);

// ========== WEBHOOK ==========

/**
 * @route   POST /api/whatsapp/webhook
 * @desc    Webhook para recibir mensajes de WhatsApp Business API
 * @access  Public (con verificación de firma)
 */
router.post('/webhook', whatsappController.webhook);

// ========== CONFIGURACIÓN ==========

/**
 * @route   GET /api/whatsapp/config
 * @desc    Obtener configuración de WhatsApp
 * @access  Private
 */
router.get('/config', AuthMiddleware.authenticate, whatsappController.getConfig);

/**
 * @route   PUT /api/whatsapp/config
 * @desc    Actualizar configuración de WhatsApp
 * @access  Private
 */
router.put('/config', AuthMiddleware.authenticate, [
    body('enabled').optional().isBoolean(),
    body('phoneNumberId').optional().isString(),
    body('accessToken').optional().isString(),
    body('webhookVerifyToken').optional().isString()
], whatsappController.updateConfig);

module.exports = router;