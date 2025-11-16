/**
 * Rutas de Conversaciones WhatsApp y Sistema de Codificación
 * Sistema de Gestión Dental - Rubio García Dental
 * 
 * Rutas para gestionar conversaciones WhatsApp, codificación de urgencias 
 * y configuración del agente IA
 */

const express = require('express');
const router = express.Router();
const ConversationController = require('../controllers/conversationController');
const { authMiddleware } = require('../middleware/auth');
const { validateBody, validateQuery } = require('../middleware/validation');

// ========== CONVERSACIONES ==========

/**
 * GET /api/whatsapp/conversations
 * Obtener todas las conversaciones con filtros
 */
router.get('/conversations', 
    authMiddleware,
    validateQuery({
        search: { type: 'string', optional: true },
        urgency: { type: 'boolean', optional: true },
        tag: { type: 'string', optional: true },
        page: { type: 'number', optional: true, min: 1 },
        limit: { type: 'number', optional: true, min: 1, max: 100 },
        since: { type: 'string', optional: true }
    }),
    ConversationController.getConversations
);

/**
 * GET /api/whatsapp/conversations/:conversationId/messages
 * Obtener mensajes de una conversación específica
 */
router.get('/conversations/:conversationId/messages',
    authMiddleware,
    validateQuery({
        page: { type: 'number', optional: true, min: 1 },
        limit: { type: 'number', optional: true, min: 1, max: 100 }
    }),
    ConversationController.getConversationMessages
);

/**
 * POST /api/whatsapp/conversations/:conversationId/tag-urgent
 * Etiquetar conversación como urgente (color naranja)
 */
router.post('/conversations/:conversationId/tag-urgent',
    authMiddleware,
    validateBody({
        notes: { type: 'string', optional: true, maxLength: 500 },
        taggedBy: { type: 'string', optional: true, maxLength: 100 }
    }),
    ConversationController.tagConversationAsUrgent
);

/**
 * POST /api/whatsapp/conversations/:conversationId/untag
 * Remover etiqueta urgente de conversación
 */
router.post('/conversations/:conversationId/untag',
    authMiddleware,
    validateBody({
        untaggedBy: { type: 'string', optional: true, maxLength: 100 }
    }),
    ConversationController.untagConversation
);

// ========== CONFIGURACIÓN IA ==========

/**
 * GET /api/whatsapp/ai-config
 * Obtener configuración del agente IA
 */
router.get('/ai-config',
    authMiddleware,
    ConversationController.getAIConfiguration
);

/**
 * PUT /api/whatsapp/ai-config
 * Actualizar configuración del agente IA
 */
router.put('/ai-config',
    authMiddleware,
    validateBody({
        IsEnabled: { type: 'boolean', optional: true },
        IsActiveOutsideHours: { type: 'boolean', optional: true },
        WorkingHoursStart: { type: 'string', optional: true },
        WorkingHoursEnd: { type: 'string', optional: true },
        WorkingDays: { type: 'string', optional: true },
        AutoResponseEnabled: { type: 'boolean', optional: true },
        AutoResponseMessage: { type: 'string', optional: true, maxLength: 1000 }
    }),
    ConversationController.updateAIConfiguration
);

// ========== ESTADÍSTICAS ==========

/**
 * GET /api/whatsapp/conversations/stats
 * Obtener estadísticas de conversaciones
 */
router.get('/conversations/stats',
    authMiddleware,
    ConversationController.getConversationStats
);

// ========== ENDPOINTS AUXILIARES ==========

/**
 * POST /api/whatsapp/conversations/:conversationId/mark-read
 * Marcar conversación como leída
 */
router.post('/conversations/:conversationId/mark-read',
    authMiddleware,
    async (req, res) => {
        try {
            await ConversationController.markAsRead(req.params.conversationId);
            res.json({
                success: true,
                message: 'Conversación marcada como leída'
            });
        } catch (error) {
            console.error('Error marcando como leído:', error);
            res.status(500).json({
                success: false,
                error: 'Error marcando conversación como leída'
            });
        }
    }
);

/**
 * GET /api/whatsapp/conversations/urgent
 * Obtener solo conversaciones urgentes (color naranja)
 */
router.get('/conversations/urgent',
    authMiddleware,
    async (req, res) => {
        try {
            req.query.urgency = 'true';
            return ConversationController.getConversations(req, res);
        } catch (error) {
            console.error('Error obteniendo conversaciones urgentes:', error);
            res.status(500).json({
                success: false,
                error: 'Error obteniendo conversaciones urgentes'
            });
        }
    }
);

/**
 * PUT /api/whatsapp/conversations/:conversationId/notes
 * Actualizar notas de conversación
 */
router.put('/conversations/:conversationId/notes',
    authMiddleware,
    validateBody({
        notes: { type: 'string', required: true, maxLength: 500 }
    }),
    async (req, res) => {
        try {
            const { conversationId } = req.params;
            const { notes } = req.body;

            const query = `
                UPDATE WhatsAppConversations
                SET 
                    TagNotes = @notes,
                    UpdatedAt = GETDATE()
                WHERE ConversationID = @conversationId AND IsActive = 1
            `;

            const result = await require('../config/database').dbConfig.executeQuery(query, [
                { name: 'conversationId', value: parseInt(conversationId) },
                { name: 'notes', value: notes }
            ]);

            if (result.rowsAffected[0] === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Conversación no encontrada'
                });
            }

            res.json({
                success: true,
                message: 'Notas actualizadas correctamente',
                data: { conversationId: parseInt(conversationId) }
            });

        } catch (error) {
            console.error('Error actualizando notas:', error);
            res.status(500).json({
                success: false,
                error: 'Error actualizando notas'
            });
        }
    }
);

/**
 * GET /api/whatsapp/conversations/search
 * Buscar conversaciones por texto
 */
router.get('/conversations/search',
    authMiddleware,
    validateQuery({
        q: { type: 'string', required: true, minLength: 2 },
        page: { type: 'number', optional: true, min: 1 },
        limit: { type: 'number', optional: true, min: 1, max: 100 }
    }),
    async (req, res) => {
        try {
            req.query.search = req.query.q;
            return ConversationController.getConversations(req, res);
        } catch (error) {
            console.error('Error buscando conversaciones:', error);
            res.status(500).json({
                success: false,
                error: 'Error en búsqueda'
            });
        }
    }
);

/**
 * GET /api/whatsapp/conversations/activity-log
 * Obtener log de actividad de conversaciones
 */
router.get('/conversations/activity-log',
    authMiddleware,
    validateQuery({
        conversationId: { type: 'number', optional: true },
        limit: { type: 'number', optional: true, min: 1, max: 100 }
    }),
    async (req, res) => {
        try {
            const { conversationId, limit = 50 } = req.query;
            
            let query = `
                SELECT 
                    ct.TagID,
                    ct.ConversationID,
                    ct.TagColor,
                    ct.TagNotes,
                    ct.TaggedBy,
                    ct.ActionType,
                    ct.Timestamp,
                    c.PatientPhone,
                    c.PatientName
                FROM ConversationTags ct
                JOIN WhatsAppConversations c ON ct.ConversationID = c.ConversationID
                WHERE 1=1
            `;

            const params = [];
            if (conversationId) {
                query += ` AND ct.ConversationID = @conversationId`;
                params.push({ name: 'conversationId', value: parseInt(conversationId) });
            }

            query += ` ORDER BY ct.Timestamp DESC OFFSET 0 ROWS FETCH NEXT @limit ROWS ONLY`;
            params.push({ name: 'limit', value: parseInt(limit) });

            const result = await require('../config/database').dbConfig.executeQuery(query, params);

            res.json({
                success: true,
                data: result.recordset.map(log => ({
                    ...log,
                    timestampFormatted: require('moment')(log.Timestamp).format('DD/MM/YYYY HH:mm:ss')
                }))
            });

        } catch (error) {
            console.error('Error obteniendo log de actividad:', error);
            res.status(500).json({
                success: false,
                error: 'Error obteniendo log de actividad'
            });
        }
    }
);

/**
 * POST /api/whatsapp/conversations/:conversationId/archive
 * Archivar conversación
 */
router.post('/conversations/:conversationId/archive',
    authMiddleware,
    async (req, res) => {
        try {
            const { conversationId } = req.params;

            const query = `
                UPDATE WhatsAppConversations
                SET 
                    IsActive = 0,
                    ArchivedAt = GETDATE(),
                    UpdatedAt = GETDATE()
                WHERE ConversationID = @conversationId
            `;

            const result = await require('../config/database').dbConfig.executeQuery(query, [
                { name: 'conversationId', value: parseInt(conversationId) }
            ]);

            if (result.rowsAffected[0] === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Conversación no encontrada'
                });
            }

            res.json({
                success: true,
                message: 'Conversación archivada correctamente'
            });

        } catch (error) {
            console.error('Error archivando conversación:', error);
            res.status(500).json({
                success: false,
                error: 'Error archivando conversación'
            });
        }
    }
);

module.exports = router;