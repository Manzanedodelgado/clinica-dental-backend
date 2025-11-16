/**
 * Rutas Contabilidad y Finanzas
 * Sistema de Gestión Dental - Rubio García Dental
 * 
 * Endpoints para reportes financieros y gestión contable
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const accountingController = require('../controllers/accountingController');
const AuthMiddleware = require('../middleware/auth');

const router = express.Router();

// ========== RESÚMENES FINANCIEROS ==========

/**
 * @route   GET /api/accounting/summary
 * @desc    Resumen financiero general
 * @access  Private
 */
router.get('/summary', AuthMiddleware.authenticate, [
    query('period').optional().isIn(['today', 'week', 'month', 'quarter', 'year', 'custom']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('includeExpenses').optional().isBoolean(),
    query('includeInvoices').optional().isBoolean()
], accountingController.getSummary);

/**
 * @route   GET /api/accounting/income
 * @desc    Reporte de ingresos
 * @access  Private
 */
router.get('/income', AuthMiddleware.authenticate, [
    query('period').optional().isIn(['today', 'week', 'month', 'quarter', 'year', 'custom']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('groupBy').optional().isIn(['day', 'week', 'month', 'paymentMethod', 'treatment']),
    query('doctorId').optional().isInt({ min: 1 }),
    query('treatmentId').optional().isInt({ min: 1 })
], accountingController.getIncomeReport);

/**
 * @route   GET /api/accounting/expenses
 * @desc    Reporte de gastos
 * @access  Private
 */
router.get('/expenses', AuthMiddleware.authenticate, [
    query('period').optional().isIn(['today', 'week', 'month', 'quarter', 'year', 'custom']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('category').optional().isIn(['supplies', 'equipment', 'utilities', 'salaries', 'marketing', 'other']),
    query('status').optional().isIn(['pending', 'approved', 'paid']),
    query('approved').optional().isBoolean()
], accountingController.getExpensesReport);

/**
 * @route   GET /api/accounting/profit-loss
 * @desc    Estado de resultados (P&L)
 * @access  Private
 */
router.get('/profit-loss', AuthMiddleware.authenticate, [
    query('period').optional().isIn(['month', 'quarter', 'year', 'custom']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('comparative').optional().isBoolean(),
    query('previousPeriod').optional().isInt({ min: 1, max: 12 })
], accountingController.getProfitLossReport);

/**
 * @route   GET /api/accounting/cash-flow
 * @desc    Flujo de caja
 * @access  Private
 */
router.get('/cash-flow', AuthMiddleware.authenticate, [
    query('period').optional().isIn(['month', 'quarter', 'year']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('projected').optional().isBoolean()
], accountingController.getCashFlowReport);

// ========== GESTIÓN DE GASTOS ==========

/**
 * @route   GET /api/accounting/expenses/all
 * @desc    Obtener todos los gastos con filtros
 * @access  Private
 */
router.get('/expenses/all', AuthMiddleware.authenticate, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isLength({ min: 1 }),
    query('category').optional().isIn(['supplies', 'equipment', 'utilities', 'salaries', 'marketing', 'other']),
    query('status').optional().isIn(['pending', 'approved', 'paid']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('minAmount').optional().isFloat({ min: 0 }),
    query('maxAmount').optional().isFloat({ min: 0 }),
    query('sort').optional().isIn(['date', 'amount', 'category', 'description']),
    query('order').optional().isIn(['asc', 'desc'])
], accountingController.getAllExpenses);

/**
 * @route   POST /api/accounting/expense
 * @desc    Crear nuevo gasto
 * @access  Private
 */
router.post('/expense', AuthMiddleware.authenticate, [
    body('description').isLength({ min: 1, max: 255 }).withMessage('Descripción requerida'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Importe debe ser mayor a 0'),
    body('category').isIn(['supplies', 'equipment', 'utilities', 'salaries', 'marketing', 'other']).withMessage('Categoría inválida'),
    body('expenseDate').isISO8601().withMessage('Fecha de gasto válida requerida'),
    body('vendor').optional().isLength({ max: 100 }),
    body('invoiceNumber').optional().isLength({ max: 50 }),
    body('paymentMethod').optional().isIn(['cash', 'card', 'transfer', 'check']),
    body('notes').optional().isLength({ max: 500 }),
    body('receipt').optional().isString() // Base64 encoded file
], accountingController.createExpense);

/**
 * @route   PUT /api/accounting/expense/:id
 * @desc    Actualizar gasto
 * @access  Private
 */
router.put('/expense/:id', AuthMiddleware.authenticate, [
    param('id').isInt({ min: 1 }).withMessage('ID de gasto inválido'),
    body('description').optional().isLength({ min: 1, max: 255 }),
    body('amount').optional().isFloat({ min: 0.01 }),
    body('category').optional().isIn(['supplies', 'equipment', 'utilities', 'salaries', 'marketing', 'other']),
    body('expenseDate').optional().isISO8601(),
    body('vendor').optional().isLength({ max: 100 }),
    body('invoiceNumber').optional().isLength({ max: 50 }),
    body('paymentMethod').optional().isIn(['cash', 'card', 'transfer', 'check']),
    body('notes').optional().isLength({ max: 500 }),
    body('status').optional().isIn(['pending', 'approved', 'paid'])
], accountingController.updateExpense);

/**
 * @route   DELETE /api/accounting/expense/:id
 * @desc    Eliminar gasto (soft delete)
 * @access  Private
 */
router.delete('/expense/:id', AuthMiddleware.authenticate, [
    param('id').isInt({ min: 1 }).withMessage('ID de gasto inválido'),
    body('reason').optional().isLength({ max: 200 })
], accountingController.deleteExpense);

/**
 * @route   POST /api/accounting/expense/:id/approve
 * @desc    Aprobar gasto
 * @access  Private
 */
router.post('/expense/:id/approve', AuthMiddleware.authenticate, [
    param('id').isInt({ min: 1 }).withMessage('ID de gasto inválido'),
    body('approvalNotes').optional().isLength({ max: 500 }),
    body('approvedAmount').optional().isFloat({ min: 0 })
], accountingController.approveExpense);

/**
 * @route   POST /api/accounting/expense/:id/reject
 * @desc    Rechazar gasto
 * @access  Private
 */
router.post('/expense/:id/reject', AuthMiddleware.authenticate, [
    param('id').isInt({ min: 1 }).withMessage('ID de gasto inválido'),
    body('rejectionReason').isLength({ min: 1, max: 200 }).withMessage('Motivo de rechazo requerido')
], accountingController.rejectExpense);

// ========== PAGOS Y FACTURACIÓN ==========

/**
 * @route   GET /api/accounting/payments
 * @desc    Obtener historial de pagos
 * @access  Private
 */
router.get('/payments', AuthMiddleware.authenticate, [
    query('period').optional().isIn(['today', 'week', 'month', 'quarter', 'year', 'custom']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('paymentMethod').optional().isIn(['cash', 'card', 'transfer', 'check']),
    query('status').optional().isIn(['pending', 'completed', 'failed', 'refunded']),
    query('invoiceId').optional().isInt({ min: 1 }),
    query('patientId').optional().isInt({ min: 1 })
], accountingController.getPayments);

/**
 * @route   POST /api/accounting/payment
 * @desc    Registrar pago directo
 * @access  Private
 */
router.post('/payment', AuthMiddleware.authenticate, [
    body('invoiceId').optional().isInt({ min: 1 }),
    body('patientId').optional().isInt({ min: 1 }),
    body('amount').isFloat({ min: 0.01 }).withMessage('Importe debe ser mayor a 0'),
    body('paymentMethod').isIn(['cash', 'card', 'transfer', 'check']).withMessage('Método de pago inválido'),
    body('paymentDate').optional().isISO8601(),
    body('reference').optional().isLength({ max: 100 }),
    body('notes').optional().isLength({ max: 500 })
], accountingController.recordPayment);

/**
 * @route   GET /api/accounting/outstanding
 * @desc    Cuentas por cobrar y pagar
 * @access  Private
 */
router.get('/outstanding', AuthMiddleware.authenticate, [
    query('type').optional().isIn(['receivables', 'payables', 'both']),
    query('daysOverdue').optional().isInt({ min: 0 }),
    query('minAmount').optional().isFloat({ min: 0 })
], accountingController.getOutstandingBalances);

// ========== REPORTES Y ANÁLISIS ==========

/**
 * @route   GET /api/accounting/reports/dashboard
 * @desc    Dashboard financiero principal
 * @access  Private
 */
router.get('/reports/dashboard', AuthMiddleware.authenticate, [
    query('period').optional().isIn(['today', 'week', 'month', 'quarter', 'year'])
], accountingController.getDashboard);

/**
 * @route   GET /api/accounting/reports/comparative
 * @desc    Reporte comparativo entre periodos
 * @access  Private
 */
router.get('/reports/comparative', AuthMiddleware.authenticate, [
    query('currentPeriod').isIn(['month', 'quarter', 'year']).withMessage('Periodo actual requerido'),
    query('previousPeriod').optional().isInt({ min: 1, max: 12 }),
    query('includeExpenses').optional().isBoolean(),
    query('metrics').optional().isIn(['revenue', 'expenses', 'profit', 'all'])
], accountingController.getComparativeReport);

/**
 * @route   GET /api/accounting/reports/tax
 * @desc    Reporte fiscal para Hacienda
 * @access  Private
 */
router.get('/reports/tax', AuthMiddleware.authenticate, [
    query('year').optional().isInt({ min: 2020, max: 2030 }),
    query('quarter').optional().isInt({ min: 1, max: 4 }),
    query('month').optional().isInt({ min: 1, max: 12 }),
    query('format').optional().isIn(['summary', 'detailed'])
], accountingController.getTaxReport);

/**
 * @route   GET /api/accounting/analytics
 * @desc    Análisis financiero avanzado
 * @access  Private
 */
router.get('/analytics', AuthMiddleware.authenticate, [
    query('period').optional().isIn(['month', 'quarter', 'year']),
    query('metrics').optional().isIn(['profitability', 'cashflow', 'efficiency', 'growth']),
    query('comparison').optional().isBoolean()
], accountingController.getFinancialAnalytics);

// ========== ESTADÍSTICAS ==========

/**
 * @route   GET /api/accounting/statistics
 * @desc    Estadísticas financieras generales
 * @access  Private
 */
router.get('/statistics', AuthMiddleware.authenticate, [
    query('period').optional().isIn(['today', 'week', 'month', 'quarter', 'year', 'all']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
], accountingController.getStatistics);

/**
 * @route   GET /api/accounting/performance
 * @desc    Indicadores de rendimiento (KPIs)
 * @access  Private
 */
router.get('/performance', AuthMiddleware.authenticate, [
    query('period').optional().isIn(['month', 'quarter', 'year']),
    query('doctorId').optional().isInt({ min: 1 }),
    query('treatmentId').optional().isInt({ min: 1 })
], accountingController.getPerformanceMetrics);

/**
 * @route   GET /api/accounting/forecasts
 * @desc    Proyecciones financieras
 * @access  Private
 */
router.get('/forecasts', AuthMiddleware.authenticate, [
    query('months').optional().isInt({ min: 1, max: 24 }),
    query('type').optional().isIn(['revenue', 'expenses', 'profit', 'cashflow']),
    query('scenario').optional().isIn(['conservative', 'moderate', 'optimistic'])
], accountingController.getFinancialForecasts);

// ========== CONFIGURACIÓN ==========

/**
 * @route   GET /api/accounting/config
 * @desc    Obtener configuración contable
 * @access  Private
 */
router.get('/config', AuthMiddleware.authenticate, accountingController.getConfig);

/**
 * @route   PUT /api/accounting/config
 * @desc    Actualizar configuración contable
 * @access  Private
 */
router.put('/config', AuthMiddleware.authenticate, [
    body('fiscalYearStart').optional().isInt({ min: 1, max: 12 }),
    body('taxRate').optional().isFloat({ min: 0, max: 100 }),
    body('currency').optional().isLength({ min: 3, max: 3 }),
    body('defaultPaymentTerms').optional().isInt({ min: 0 }),
    body('autoApproveLimit').optional().isFloat({ min: 0 }),
    body('reportFrequency').optional().isIn(['daily', 'weekly', 'monthly', 'quarterly'])
], accountingController.updateConfig);

// ========== EXPORTACIÓN ==========

/**
 * @route   GET /api/accounting/export/excel
 * @desc    Exportar datos contables a Excel
 * @access  Private
 */
router.get('/export/excel', AuthMiddleware.authenticate, [
    query('type').isIn(['summary', 'income', 'expenses', 'profit-loss']).withMessage('Tipo de exportación requerido'),
    query('period').optional().isIn(['today', 'week', 'month', 'quarter', 'year', 'custom']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('includeCharts').optional().isBoolean(),
    query('template').optional().isIn(['standard', 'detailed', 'executive'])
], accountingController.exportToExcel);

/**
 * @route   GET /api/accounting/export/pdf
 * @desc    Exportar reportes a PDF
 * @access  Private
 */
router.get('/export/pdf', AuthMiddleware.authenticate, [
    query('reportType').isIn(['summary', 'income', 'expenses', 'profit-loss', 'tax', 'dashboard']).withMessage('Tipo de reporte requerido'),
    query('period').optional().isIn(['today', 'week', 'month', 'quarter', 'year', 'custom']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('format').optional().isIn(['standard', 'detailed', 'executive']),
    query('includeSignatures').optional().isBoolean()
], accountingController.exportToPDF);

/**
 * @route   GET /api/accounting/export/csv
 * @desc    Exportar datos a CSV
 * @access  Private
 */
router.get('/export/csv', AuthMiddleware.authenticate, [
    query('type').isIn(['invoices', 'payments', 'expenses', 'all']).withMessage('Tipo de exportación requerido'),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('delimiter').optional().isIn([',', ';', '\t']),
    query('encoding').optional().isIn(['utf-8', 'iso-8859-1', 'windows-1252'])
], accountingController.exportToCSV);

// ========== PRESUPUESTOS Y PLANIFICACIÓN ==========

/**
 * @route   GET /api/accounting/budgets
 * @desc    Obtener presupuestos
 * @access  Private
 */
router.get('/budgets', AuthMiddleware.authenticate, [
    query('year').optional().isInt({ min: 2020, max: 2030 }),
    query('type').optional().isIn(['annual', 'quarterly', 'monthly']),
    query('status').optional().isIn(['draft', 'approved', 'active', 'closed'])
], accountingController.getBudgets);

/**
 * @route   POST /api/accounting/budget
 * @desc    Crear nuevo presupuesto
 * @access  Private
 */
router.post('/budget', AuthMiddleware.authenticate, [
    body('name').isLength({ min: 1, max: 100 }).withMessage('Nombre requerido'),
    body('year').isInt({ min: 2020, max: 2030 }).withMessage('Año válido requerido'),
    body('type').isIn(['annual', 'quarterly', 'monthly']).withMessage('Tipo de presupuesto inválido'),
    body('budgetItems').isArray({ min: 1 }).withMessage('Items de presupuesto requeridos'),
    body('budgetItems.*.category').isIn(['income', 'expenses', 'investments']).withMessage('Categoría inválida'),
    body('budgetItems.*.description').isLength({ min: 1, max: 255 }).withMessage('Descripción requerida'),
    body('budgetItems.*.budgetedAmount').isFloat({ min: 0 }).withMessage('Importe presupuestado debe ser >= 0')
], accountingController.createBudget);

/**
 * @route   PUT /api/accounting/budget/:id
 * @desc    Actualizar presupuesto
 * @access  Private
 */
router.put('/budget/:id', AuthMiddleware.authenticate, [
    param('id').isInt({ min: 1 }).withMessage('ID de presupuesto inválido'),
    body('name').optional().isLength({ min: 1, max: 100 }),
    body('status').optional().isIn(['draft', 'approved', 'active', 'closed']),
    body('budgetItems').optional().isArray({ min: 1 })
], accountingController.updateBudget);

/**
 * @route   GET /api/accounting/budget/:id/variance
 * @desc    Análisis de variaciones del presupuesto
 * @access  Private
 */
router.get('/budget/:id/variance', AuthMiddleware.authenticate, [
    param('id').isInt({ min: 1 }).withMessage('ID de presupuesto inválido'),
    query('period').optional().isIn(['month', 'quarter', 'year']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
], accountingController.getBudgetVariance);

/**
 * @route   GET /api/accounting/activity
 * @desc    Actividad reciente contable
 * @access  Private
 */
router.get('/activity', AuthMiddleware.authenticate, [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('type').optional().isIn(['payment', 'expense', 'invoice', 'budget', 'report'])
], accountingController.getActivity);

// ========== RECONCILIACIÓN ==========

/**
 * @route   GET /api/accounting/reconciliation
 * @desc    Conciliación bancaria
 * @access  Private
 */
router.get('/reconciliation', AuthMiddleware.authenticate, [
    query('accountId').optional().isInt({ min: 1 }),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('status').optional().isIn(['pending', 'completed', 'disputed'])
], accountingController.getReconciliation);

/**
 * @route   POST /api/accounting/reconciliation
 * @desc    Crear nueva conciliación
 * @access  Private
 */
router.post('/reconciliation', AuthMiddleware.authenticate, [
    body('accountId').isInt({ min: 1 }).withMessage('ID de cuenta requerido'),
    body('statementDate').isISO8601().withMessage('Fecha de estado de cuenta válida requerida'),
    body('statementBalance').isFloat().withMessage('Balance del estado de cuenta requerido'),
    body('transactions').isArray({ min: 1 }).withMessage('Transacciones requeridas')
], accountingController.createReconciliation);

/**
 * @route   PUT /api/accounting/reconciliation/:id/mark
 * @desc    Marcar transacción como conciliada
 * @access  Private
 */
router.put('/reconciliation/:id/mark', AuthMiddleware.authenticate, [
    param('id').isInt({ min: 1 }).withMessage('ID de conciliación inválido'),
    body('transactionId').isInt({ min: 1 }).withMessage('ID de transacción requerido'),
    body('status').isIn(['matched', 'unmatched', 'disputed']).withMessage('Estado inválido'),
    body('notes').optional().isLength({ max: 500 })
], accountingController.markTransactionReconciled);

module.exports = router;