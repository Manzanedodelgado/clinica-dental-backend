/**
 * Rutas de Automatización
 * Sistema de Gestión Dental - Rubio García Dental
 */

const express = require('express');
const AutomationController = require('../controllers/automationController');
const AuthMiddleware = require('../middleware/auth');
const ValidationMiddleware = require('../middleware/validation');

const router = express.Router();

/**
 * @route   POST /api/automation/flows
 * @desc    Crear flujo de automatización
 * @access  Private
 */
router.post('/flows', 
    AuthMiddleware.authenticateToken,
    ValidationMiddleware.validateAutomationFlow(),
    AuthMiddleware.logActivity('create_automation_flow'),
    AutomationController.createAutomationFlow
);

/**
 * @route   GET /api/automation/flows/:id
 * @desc    Obtener flujo específico
 * @access  Private
 */
router.get('/flows/:id', 
    AuthMiddleware.authenticateToken,
    AuthMiddleware.logActivity('get_automation_flow', { flowId: ':id' }),
    AutomationController.getAutomationFlow
);

/**
 * @route   POST /api/automation/flows/:id/steps/:stepId/response
 * @desc    Procesar respuesta de paso de flujo
 * @access  Private
 */
router.post('/flows/:id/steps/:stepId/response', 
    AuthMiddleware.authenticateToken,
    (req, res, next) => {
        const Joi = require('joi');
        const schema = Joi.object({
            response: Joi.string().required(),
            selectedOptions: Joi.array().items(Joi.string()).default([]),
            freeText: Joi.string().allow('', null).default(''),
            questionnaireResponses: Joi.object().allow(null).default(null)
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
    AuthMiddleware.logActivity('process_flow_step_response', { flowId: ':id', stepId: ':stepId' }),
    AutomationController.processFlowStepResponse
);

/**
 * @route   GET /api/automation/stats
 * @desc    Obtener estadísticas de automatización
 * @access  Private (Admin only)
 */
router.get('/stats', 
    AuthMiddleware.authenticateToken,
    AuthMiddleware.authorizeRoles('Administrador'),
    ValidationMiddleware.validateQueryParams(),
    AuthMiddleware.logActivity('get_automation_stats'),
    AutomationController.getAutomationStats
);

/**
 * @route   GET /api/automation/active-flows
 * @desc    Obtener flujos activos
 * @access  Private
 */
router.get('/active-flows', 
    AuthMiddleware.authenticateToken,
    AuthMiddleware.logActivity('get_active_flows'),
    AutomationController.getActiveFlows
);

/**
 * @route   PUT /api/automation/flows/:id/pause
 * @desc    Pausar flujo de automatización
 * @access  Private
 */
router.put('/flows/:id/pause', 
    AuthMiddleware.authenticateToken,
    AuthMiddleware.logActivity('pause_automation_flow', { flowId: ':id' }),
    async (req, res) => {
        try {
            const { id } = req.params;
            
            // Actualizar estado a pausado
            await require('../config/database').dbConfig.query(`
                UPDATE DAutomationFlows SET
                    Status = 'paused',
                    UpdatedAt = GETDATE()
                WHERE FlowID = @flowId
            `, [{ name: 'flowId', value: id }]);

            res.json({
                success: true,
                message: 'Flujo pausado exitosamente'
            });
        } catch (error) {
            console.error('Error pausando flujo:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'PAUSE_FLOW_ERROR'
            });
        }
    }
);

/**
 * @route   PUT /api/automation/flows/:id/resume
 * @desc    Reanudar flujo de automatización
 * @access  Private
 */
router.put('/flows/:id/resume', 
    AuthMiddleware.authenticateToken,
    AuthMiddleware.logActivity('resume_automation_flow', { flowId: ':id' }),
    async (req, res) => {
        try {
            const { id } = req.params;
            
            // Verificar que el flujo existe y está pausado
            const flowCheck = await require('../config/database').dbConfig.query(`
                SELECT Status FROM DAutomationFlows WHERE FlowID = @flowId
            `, [{ name: 'flowId', value: id }]);

            if (flowCheck.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Flujo no encontrado',
                    code: 'FLOW_NOT_FOUND'
                });
            }

            if (flowCheck.recordset[0].Status !== 'paused') {
                return res.status(400).json({
                    success: false,
                    error: 'El flujo no está pausado',
                    code: 'FLOW_NOT_PAUSED'
                });
            }

            // Reanudar flujo
            await require('../config/database').dbConfig.query(`
                UPDATE DAutomationFlows SET
                    Status = 'active',
                    UpdatedAt = GETDATE()
                WHERE FlowID = @flowId
            `, [{ name: 'flowId', value: id }]);

            res.json({
                success: true,
                message: 'Flujo reanudado exitosamente'
            });
        } catch (error) {
            console.error('Error reanudando flujo:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'RESUME_FLOW_ERROR'
            });
        }
    }
);

/**
 * @route   DELETE /api/automation/flows/:id
 * @desc    Cancelar flujo de automatización
 * @access  Private
 */
router.delete('/flows/:id', 
    AuthMiddleware.authenticateToken,
    AuthMiddleware.authorizeRoles('Administrador', 'Dentista'),
    AuthMiddleware.logActivity('cancel_automation_flow', { flowId: ':id' }),
    async (req, res) => {
        try {
            const { id } = req.params;
            
            // Actualizar estado a cancelado
            await require('../config/database').dbConfig.query(`
                UPDATE DAutomationFlows SET
                    Status = 'cancelled',
                    UpdatedAt = GETDATE()
                WHERE FlowID = @flowId
            `, [{ name: 'flowId', value: id }]);

            res.json({
                success: true,
                message: 'Flujo cancelado exitosamente'
            });
        } catch (error) {
            console.error('Error cancelando flujo:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'CANCEL_FLOW_ERROR'
            });
        }
    }
);

module.exports = router;