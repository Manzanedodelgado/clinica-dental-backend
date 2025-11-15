/**
 * Rutas Facturación e Invoices
 * Sistema de Gestión Dental - Rubio García Dental
 * 
 * Endpoints para gestión de facturas con Verifactu
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const invoiceController = require('../controllers/invoiceController');
const AuthMiddleware = require('../middleware/auth');

const router = express.Router();

// ========== FACTURAS ==========

/**
 * @route   GET /api/invoices
 * @desc    Obtener todas las facturas con filtros
 * @access  Private
 */
router.get('/', AuthMiddleware.authenticate, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['pending', 'sent', 'paid', 'cancelled', 'overdue']),
    query('search').optional().isLength({ min: 1 }),
    query('patientId').optional().isInt({ min: 1 }),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('sort').optional().isIn(['date', 'amount', 'number', 'status']),
    query('order').optional().isIn(['asc', 'desc'])
], invoiceController.getInvoices);

/**
 * @route   POST /api/invoices
 * @desc    Crear nueva factura
 * @access  Private
 */
router.post('/', AuthMiddleware.authenticate, [
    body('patientId').isInt({ min: 1 }).withMessage('ID de paciente requerido'),
    body('appointmentId').optional().isInt({ min: 1 }),
    body('items').isArray({ min: 1 }).withMessage('Al menos un item requerido'),
    body('items.*.description').isLength({ min: 1, max: 255 }).withMessage('Descripción requerida'),
    body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Cantidad debe ser mayor a 0'),
    body('items.*.unitPrice').isFloat({ min: 0.01 }).withMessage('Precio unitario debe ser mayor a 0'),
    body('discount').optional().isFloat({ min: 0, max: 100 }).withMessage('Descuento entre 0 y 100'),
    body('taxRate').optional().isFloat({ min: 0, max: 100 }).withMessage('IVA entre 0 y 100'),
    body('notes').optional().isLength({ max: 500 })
], invoiceController.createInvoice);

/**
 * @route   GET /api/invoices/:id
 * @desc    Obtener factura específica
 * @access  Private
 */
router.get('/:id', AuthMiddleware.authenticate, [
    param('id').isInt({ min: 1 }).withMessage('ID de factura inválido')
], invoiceController.getInvoice);

/**
 * @route   PUT /api/invoices/:id
 * @desc    Actualizar factura
 * @access  Private
 */
router.put('/:id', AuthMiddleware.authenticate, [
    param('id').isInt({ min: 1 }).withMessage('ID de factura inválido'),
    body('status').optional().isIn(['pending', 'sent', 'paid', 'cancelled']),
    body('paymentStatus').optional().isIn(['pending', 'paid', 'overdue', 'partial']),
    body('paymentDate').optional().isISO8601(),
    body('paymentMethod').optional().isIn(['cash', 'card', 'transfer', 'check']),
    body('notes').optional().isLength({ max: 500 })
], invoiceController.updateInvoice);

/**
 * @route   DELETE /api/invoices/:id
 * @desc    Anular factura (soft delete)
 * @access  Private
 */
router.delete('/:id', AuthMiddleware.authenticate, [
    param('id').isInt({ min: 1 }).withMessage('ID de factura inválido'),
    body('reason').isLength({ min: 1, max: 200 }).withMessage('Motivo de anulación requerido')
], invoiceController.cancelInvoice);

// ========== ACCIONES DE FACTURA ==========

/**
 * @route   POST /api/invoices/:id/send
 * @desc    Enviar factura por email
 * @access  Private
 */
router.post('/:id/send', AuthMiddleware.authenticate, [
    param('id').isInt({ min: 1 }).withMessage('ID de factura inválido'),
    body('email').isEmail().withMessage('Email válido requerido'),
    body('customMessage').optional().isLength({ max: 500 }),
    body('sendMethod').optional().isIn(['email', 'whatsapp', 'sms']).withMessage('Método de envío inválido')
], invoiceController.sendInvoice);

/**
 * @route   GET /api/invoices/:id/pdf
 * @desc    Generar y descargar PDF de factura
 * @access  Private
 */
router.get('/:id/pdf', AuthMiddleware.authenticate, [
    param('id').isInt({ min: 1 }).withMessage('ID de factura inválido')
], invoiceController.generatePDF);

/**
 * @route   POST /api/invoices/:id/verifactu
 * @desc    Enviar factura a Verifactu (Agencia Tributaria)
 * @access  Private
 */
router.post('/:id/verifactu', AuthMiddleware.authenticate, [
    param('id').isInt({ min: 1 }).withMessage('ID de factura inválido')
], invoiceController.submitToVerifactu);

/**
 * @route   GET /api/invoices/:id/verifactu/status
 * @desc    Obtener estado de envío a Verifactu
 * @access  Private
 */
router.get('/:id/verifactu/status', AuthMiddleware.authenticate, [
    param('id').isInt({ min: 1 }).withMessage('ID de factura inválido')
], invoiceController.getVerifactuStatus);

/**
 * @route   POST /api/invoices/:id/payment
 * @desc    Registrar pago de factura
 * @access  Private
 */
router.post('/:id/payment', AuthMiddleware.authenticate, [
    param('id').isInt({ min: 1 }).withMessage('ID de factura inválido'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Importe debe ser mayor a 0'),
    body('paymentMethod').isIn(['cash', 'card', 'transfer', 'check']).withMessage('Método de pago inválido'),
    body('paymentDate').optional().isISO8601(),
    body('reference').optional().isLength({ max: 100 }),
    body('notes').optional().isLength({ max: 500 })
], invoiceController.recordPayment);

// ========== PLANTILLAS Y CONFIGURACIÓN ==========

/**
 * @route   GET /api/invoices/templates
 * @desc    Obtener plantillas de facturas
 * @access  Private
 */
router.get('/templates', AuthMiddleware.authenticate, invoiceController.getTemplates);

/**
 * @route   POST /api/invoices/templates
 * @desc    Crear nueva plantilla de factura
 * @access  Private
 */
router.post('/templates', AuthMiddleware.authenticate, [
    body('name').isLength({ min: 1, max: 100 }).withMessage('Nombre requerido'),
    body('header').optional().isLength({ max: 1000 }),
    body('footer').optional().isLength({ max: 1000 }),
    body('terms').optional().isLength({ max: 2000 }),
    body('isDefault').optional().isBoolean()
], invoiceController.createTemplate);

// ========== REPORTES Y ESTADÍSTICAS ==========

/**
 * @route   GET /api/invoices/reports/summary
 * @desc    Resumen de facturación por periodo
 * @access  Private
 */
router.get('/reports/summary', AuthMiddleware.authenticate, [
    query('period').optional().isIn(['today', 'week', 'month', 'quarter', 'year', 'custom']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('groupBy').optional().isIn(['day', 'week', 'month', 'status', 'paymentMethod'])
], invoiceController.getSummaryReport);

/**
 * @route   GET /api/invoices/reports/outstanding
 * @desc    Facturas pendientes de cobro
 * @access  Private
 */
router.get('/reports/outstanding', AuthMiddleware.authenticate, [
    query('daysOverdue').optional().isInt({ min: 0 }),
    query('minAmount').optional().isFloat({ min: 0 }),
    query('maxAmount').optional().isFloat({ min: 0 })
], invoiceController.getOutstandingReport);

/**
 * @route   GET /api/invoices/statistics
 * @desc    Estadísticas de facturación
 * @access  Private
 */
router.get('/statistics', AuthMiddleware.authenticate, [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
], invoiceController.getStatistics);

/**
 * @route   GET /api/invoices/activity
 * @desc    Actividad reciente de facturas
 * @access  Private
 */
router.get('/activity', AuthMiddleware.authenticate, [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('type').optional().isIn(['created', 'sent', 'paid', 'cancelled', 'overdue'])
], invoiceController.getActivity);

// ========== BÚSQUEDA Y FILTROS AVANZADOS ==========

/**
 * @route   GET /api/invoices/search/advanced
 * @desc    Búsqueda avanzada de facturas
 * @access  Private
 */
router.get('/search/advanced', AuthMiddleware.authenticate, [
    query('query').optional().isLength({ min: 1 }),
    query('patientName').optional().isLength({ min: 1 }),
    query('amountMin').optional().isFloat({ min: 0 }),
    query('amountMax').optional().isFloat({ min: 0 }),
    query('status').optional().isIn(['pending', 'sent', 'paid', 'cancelled', 'overdue']),
    query('paymentMethod').optional().isIn(['cash', 'card', 'transfer', 'check']),
    query('overdue').optional().isBoolean(),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('sort').optional().isIn(['date', 'amount', 'number', 'status', 'patient']),
    query('order').optional().isIn(['asc', 'desc'])
], invoiceController.advancedSearch);

// ========== EXPORTACIÓN ==========

/**
 * @route   GET /api/invoices/export/excel
 * @desc    Exportar facturas a Excel
 * @access  Private
 */
router.get('/export/excel', AuthMiddleware.authenticate, [
    query('format').optional().isIn(['xlsx', 'csv']),
    query('status').optional().isIn(['pending', 'sent', 'paid', 'cancelled', 'overdue']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('includeDetails').optional().isBoolean()
], invoiceController.exportToExcel);

/**
 * @route   GET /api/invoices/export/pdf
 * @desc    Exportar facturas a PDF (reporte)
 * @access  Private
 */
router.get('/export/pdf', AuthMiddleware.authenticate, [
    query('status').optional().isIn(['pending', 'sent', 'paid', 'cancelled', 'overdue']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('includeDetails').optional().isBoolean()
], invoiceController.exportToPDF);

// ========== CONFIGURACIÓN ==========

/**
 * @route   GET /api/invoices/config
 * @desc    Obtener configuración de facturación
 * @access  Private
 */
router.get('/config', AuthMiddleware.authenticate, invoiceController.getConfig);

/**
 * @route   PUT /api/invoices/config
 * @desc    Actualizar configuración de facturación
 * @access  Private
 */
router.put('/config', AuthMiddleware.authenticate, [
    body('defaultTaxRate').optional().isFloat({ min: 0, max: 100 }),
    body('invoicePrefix').optional().isLength({ min: 1, max: 10 }),
    body('nextInvoiceNumber').optional().isInt({ min: 1 }),
    body('paymentTermsDays').optional().isInt({ min: 0 }),
    body('autoEmailEnabled').optional().isBoolean(),
    body('verifactuEnabled').optional().isBoolean(),
    body('digitalSignatureEnabled').optional().isBoolean()
], invoiceController.updateConfig);

// ========== RECURRENCIA ==========

/**
 * @route   POST /api/invoices/recurring
 * @desc    Crear factura recurrente
 * @access  Private
 */
router.post('/recurring', AuthMiddleware.authenticate, [
    body('patientId').isInt({ min: 1 }).withMessage('ID de paciente requerido'),
    body('templateId').isInt({ min: 1 }).withMessage('ID de plantilla requerido'),
    body('frequency').isIn(['weekly', 'monthly', 'quarterly', 'yearly']).withMessage('Frecuencia inválida'),
    body('startDate').isISO8601().withMessage('Fecha de inicio válida requerida'),
    body('endDate').optional().isISO8601(),
    body('occurrences').optional().isInt({ min: 1, max: 52 }),
    body('nextInvoiceDate').optional().isISO8601()
], invoiceController.createRecurringInvoice);

/**
 * @route   GET /api/invoices/recurring
 * @desc    Obtener facturas recurrentes
 * @access  Private
 */
router.get('/recurring', AuthMiddleware.authenticate, [
    query('active').optional().isBoolean(),
    query('patientId').optional().isInt({ min: 1 })
], invoiceController.getRecurringInvoices);

/**
 * @route   PUT /api/invoices/recurring/:id
 * @desc    Actualizar factura recurrente
 * @access  Private
 */
router.put('/recurring/:id', AuthMiddleware.authenticate, [
    param('id').isInt({ min: 1 }).withMessage('ID de factura recurrente inválido'),
    body('frequency').optional().isIn(['weekly', 'monthly', 'quarterly', 'yearly']),
    body('nextInvoiceDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('active').optional().isBoolean()
], invoiceController.updateRecurringInvoice);

/**
 * @route   DELETE /api/invoices/recurring/:id
 * @desc    Cancelar factura recurrente
 * @access  Private
 */
router.delete('/recurring/:id', AuthMiddleware.authenticate, [
    param('id').isInt({ min: 1 }).withMessage('ID de factura recurrente inválido')
], invoiceController.cancelRecurringInvoice);

module.exports = router;