/**
 * Controlador de Conversaciones WhatsApp y Sistema de Codificación
 * Sistema de Gestión Dental - Rubio García Dental
 * 
 * Gestiona conversaciones WhatsApp, codificación con color naranja para urgencias
 * y configuración del agente IA
 */

const { dbConfig, SQL_QUERIES } = require('../config/database');
const moment = require('moment');

class ConversationController {
    /**
     * Obtener todas las conversaciones con filtros
     */
    static async getConversations(req, res) {
        try {
            const { 
                search, 
                urgency, 
                tag, 
                page = 1, 
                limit = 20,
                since // filtros de fecha
            } = req.query;

            const pageNum = parseInt(page);
            const pageLimit = parseInt(limit);
            const offset = (pageNum - 1) * pageLimit;

            let query = `
                SELECT 
                    c.ConversationID,
                    c.PatientPhone,
                    c.PatientName,
                    c.LastMessageAt,
                    c.MessageCount,
                    c.ConversationStartedAt,
                    c.LastMessageSnippet,
                    c.HasUrgencyTag,
                    c.TagColor,
                    c.TagNotes,
                    c.TaggedBy,
                    c.TaggedAt,
                    c.IsActive,
                    -- Último mensaje completo
                    m.MessageText as LastMessageText,
                    m.IsFromPatient as LastMessageFromPatient,
                    -- Conteo de mensajes no leídos
                    (SELECT COUNT(*) FROM WhatsAppMessages 
                     WHERE ConversationID = c.ConversationID 
                     AND MessageTimestamp > COALESCE(c.LastReadAt, c.ConversationStartedAt)) as UnreadCount,
                    -- Tiempo transcurrido desde último mensaje
                    DATEDIFF(minute, c.LastMessageAt, GETDATE()) as MinutesSinceLastMessage
                FROM WhatsAppConversations c
                LEFT JOIN WhatsAppMessages m ON c.ConversationID = m.ConversationID 
                    AND m.MessageID = (
                        SELECT TOP 1 MessageID 
                        FROM WhatsAppMessages 
                        WHERE ConversationID = c.ConversationID 
                        ORDER BY MessageTimestamp DESC
                    )
                WHERE c.IsActive = 1
            `;

            const params = [];

            // Filtro de búsqueda
            if (search) {
                query += ` AND (c.PatientPhone LIKE @search OR c.PatientName LIKE @search OR c.LastMessageSnippet LIKE @search)`;
                params.push({ name: 'search', value: `%${search}%` });
            }

            // Filtro de urgencia (color naranja)
            if (urgency === 'true') {
                query += ` AND c.HasUrgencyTag = 1`;
            }

            // Filtro por color de tag
            if (tag && tag !== 'all') {
                query += ` AND c.TagColor = @tag`;
                params.push({ name: 'tag', value: tag });
            }

            // Filtro de fecha
            if (since) {
                query += ` AND c.LastMessageAt >= @since`;
                params.push({ name: 'since', value: since });
            }

            query += ` ORDER BY 
                c.HasUrgencyTag DESC, -- Urgentes primero
                c.LastMessageAt DESC -- Luego por fecha
            `;
            
            query += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
            params.push({ name: 'offset', value: offset });
            params.push({ name: 'limit', value: pageLimit });

            const result = await dbConfig.executeQuery(query, params);

            // Obtener conteo total
            const countQuery = `
                SELECT COUNT(*) as total 
                FROM WhatsAppConversations c 
                WHERE c.IsActive = 1 ${search ? 'AND (c.PatientPhone LIKE @search OR c.PatientName LIKE @search)' : ''}
            `;
            const countParams = search ? [{ name: 'search', value: `%${search}%` }] : [];
            const countResult = await dbConfig.executeQuery(countQuery, countParams);

            // Enriquecer datos con información adicional
            const conversations = result.recordset.map(conv => ({
                ...conv,
                // Determinar estado de conversación
                status: this.getConversationStatus(conv.MinutesSinceLastMessage, conv.MessageCount),
                // Detectar si necesita atención urgente basada en contenido
                needsAttention: this.detectUrgencyKeywords(conv.LastMessageText || ''),
                // Formatear timestamps
                lastMessageFormatted: moment(conv.LastMessageAt).fromNow(),
                conversationStartedFormatted: moment(conv.ConversationStartedAt).format('DD/MM/YYYY HH:mm'),
                // Color de estado para UI
                statusColor: this.getStatusColor(conv.MinutesSinceLastMessage),
                // URL para ver conversación completa
                conversationUrl: `/api/whatsapp/conversations/${conv.ConversationID}/messages`
            }));

            res.json({
                success: true,
                data: conversations,
                pagination: {
                    page: pageNum,
                    limit: pageLimit,
                    total: countResult.recordset[0].total,
                    pages: Math.ceil(countResult.recordset[0].total / pageLimit)
                },
                filters: {
                    urgency_count: conversations.filter(c => c.HasUrgencyTag).length,
                    total_unread: conversations.reduce((sum, c) => sum + (c.UnreadCount || 0), 0)
                }
            });

        } catch (error) {
            console.error('Error obteniendo conversaciones:', error);
            res.status(500).json({
                success: false,
                error: 'Error obteniendo conversaciones',
                code: 'GET_CONVERSATIONS_ERROR'
            });
        }
    }

    /**
     * Obtener mensajes de una conversación específica
     */
    static async getConversationMessages(req, res) {
        try {
            const { conversationId } = req.params;
            const { page = 1, limit = 50 } = req.query;

            const pageNum = parseInt(page);
            const pageLimit = parseInt(limit);
            const offset = (pageNum - 1) * pageLimit;

            // Obtener información de la conversación
            const conversationQuery = `
                SELECT 
                    c.*,
                    m.MessageText as LastMessageText,
                    m.MessageTimestamp as LastMessageTime
                FROM WhatsAppConversations c
                LEFT JOIN WhatsAppMessages m ON c.ConversationID = m.ConversationID 
                    AND m.MessageID = (
                        SELECT TOP 1 MessageID 
                        FROM WhatsAppMessages 
                        WHERE ConversationID = c.ConversationID 
                        ORDER BY MessageTimestamp DESC
                    )
                WHERE c.ConversationID = @conversationId AND c.IsActive = 1
            `;

            const conversationResult = await dbConfig.executeQuery(conversationQuery, [
                { name: 'conversationId', value: parseInt(conversationId) }
            ]);

            if (conversationResult.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Conversación no encontrada'
                });
            }

            const conversation = conversationResult.recordset[0];

            // Obtener mensajes de la conversación
            const messagesQuery = `
                SELECT 
                    MessageID,
                    MessageText,
                    MessageType,
                    FromPhone,
                    FromName,
                    IsFromPatient,
                    MessageTimestamp,
                    HasMedia,
                    MediaUrl,
                    MediaCaption,
                    AIProcessed,
                    AIAutoReplySent,
                    ContainsEmergencyKeywords
                FROM WhatsAppMessages
                WHERE ConversationID = @conversationId
                ORDER BY MessageTimestamp DESC
                OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
            `;

            const messagesResult = await dbConfig.executeQuery(messagesQuery, [
                { name: 'conversationId', value: parseInt(conversationId) },
                { name: 'offset', value: offset },
                { name: 'limit', value: pageLimit }
            ]);

            // Marcar mensajes como leídos
            await this.markAsRead(conversationId);

            res.json({
                success: true,
                data: {
                    conversation: {
                        ...conversation,
                        messages: messagesResult.recordset.reverse() // Orden cronológico
                    },
                    pagination: {
                        page: pageNum,
                        limit: pageLimit,
                        showing: messagesResult.recordset.length
                    }
                }
            });

        } catch (error) {
            console.error('Error obteniendo mensajes de conversación:', error);
            res.status(500).json({
                success: false,
                error: 'Error obteniendo mensajes',
                code: 'GET_CONVERSATION_MESSAGES_ERROR'
            });
        }
    }

    /**
     * Etiquetar conversación como urgente (color naranja)
     */
    static async tagConversationAsUrgent(req, res) {
        try {
            const { conversationId } = req.params;
            const { notes, taggedBy = 'Manual' } = req.body;

            // Actualizar conversación
            const updateQuery = `
                UPDATE WhatsAppConversations
                SET 
                    HasUrgencyTag = 1,
                    TagColor = 'orange',
                    TagNotes = @notes,
                    TaggedBy = @taggedBy,
                    TaggedAt = GETDATE(),
                    UpdatedAt = GETDATE()
                WHERE ConversationID = @conversationId AND IsActive = 1
            `;

            const result = await dbConfig.executeQuery(updateQuery, [
                { name: 'conversationId', value: parseInt(conversationId) },
                { name: 'notes', value: notes || 'Marcação urgente' },
                { name: 'taggedBy', value: taggedBy }
            ]);

            if (result.rowsAffected[0] === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Conversación no encontrada'
                });
            }

            // Registrar en logs
            await this.logTagAction(conversationId, 'orange', 'tagged', taggedBy, notes);

            res.json({
                success: true,
                message: 'Conversación marcada como urgente (naranja)',
                data: {
                    conversationId: parseInt(conversationId),
                    color: 'orange',
                    notes,
                    taggedBy
                }
            });

        } catch (error) {
            console.error('Error etiquetando conversación:', error);
            res.status(500).json({
                success: false,
                error: 'Error etiquetando conversación',
                code: 'TAG_CONVERSATION_ERROR'
            });
        }
    }

    /**
     * Remover etiqueta urgente de conversación
     */
    static async untagConversation(req, res) {
        try {
            const { conversationId } = req.params;
            const { untaggedBy = 'Manual' } = req.body;

            const updateQuery = `
                UPDATE WhatsAppConversations
                SET 
                    HasUrgencyTag = 0,
                    TagColor = 'normal',
                    TagNotes = NULL,
                    TaggedBy = @untaggedBy,
                    TaggedAt = GETDATE(),
                    UpdatedAt = GETDATE()
                WHERE ConversationID = @conversationId AND IsActive = 1
            `;

            const result = await dbConfig.executeQuery(updateQuery, [
                { name: 'conversationId', value: parseInt(conversationId) },
                { name: 'untaggedBy', value: untaggedBy }
            ]);

            if (result.rowsAffected[0] === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Conversación no encontrada'
                });
            }

            await this.logTagAction(conversationId, 'normal', 'untagged', untaggedBy);

            res.json({
                success: true,
                message: 'Etiqueta urgente removida',
                data: {
                    conversationId: parseInt(conversationId),
                    color: 'normal',
                    untaggedBy
                }
            });

        } catch (error) {
            console.error('Error removiendo etiqueta:', error);
            res.status(500).json({
                success: false,
                error: 'Error removiendo etiqueta',
                code: 'UNTAG_CONVERSATION_ERROR'
            });
        }
    }

    /**
     * Obtener/actualizar configuración del agente IA
     */
    static async getAIConfiguration(req, res) {
        try {
            const query = `SELECT TOP 1 * FROM AIConfiguration ORDER BY ConfigID DESC`;
            const result = await dbConfig.executeQuery(query);

            if (result.recordset.length === 0) {
                // Crear configuración por defecto
                await this.createDefaultAIConfig();
                return this.getAIConfiguration(req, res);
            }

            const config = result.recordset[0];

            // Verificar si es horario de trabajo
            const isWorkingHours = this.isWorkingHours(config);

            res.json({
                success: true,
                data: {
                    ...config,
                    currentIsWorkingHours: isWorkingHours,
                    shouldActivateAI: config.IsEnabled && (isWorkingHours ? config.IsActiveOutsideHours : true)
                }
            });

        } catch (error) {
            console.error('Error obteniendo configuración IA:', error);
            res.status(500).json({
                success: false,
                error: 'Error obteniendo configuración',
                code: 'AI_CONFIG_ERROR'
            });
        }
    }

    /**
     * Actualizar configuración del agente IA
     */
    static async updateAIConfiguration(req, res) {
        try {
            const {
                IsEnabled,
                IsActiveOutsideHours,
                WorkingHoursStart,
                WorkingHoursEnd,
                WorkingDays,
                AutoResponseEnabled,
                AutoResponseMessage
            } = req.body;

            const updateQuery = `
                UPDATE AIConfiguration
                SET 
                    IsEnabled = @IsEnabled,
                    IsActiveOutsideHours = @IsActiveOutsideHours,
                    WorkingHoursStart = @WorkingHoursStart,
                    WorkingHoursEnd = @WorkingHoursEnd,
                    WorkingDays = @WorkingDays,
                    AutoResponseEnabled = @AutoResponseEnabled,
                    AutoResponseMessage = @AutoResponseMessage,
                    UpdatedAt = GETDATE()
                WHERE ConfigID = (SELECT TOP 1 ConfigID FROM AIConfiguration ORDER BY ConfigID DESC)
            `;

            await dbConfig.executeQuery(updateQuery, [
                { name: 'IsEnabled', value: IsEnabled !== undefined ? IsEnabled : true },
                { name: 'IsActiveOutsideHours', value: IsActiveOutsideHours !== undefined ? IsActiveOutsideHours : true },
                { name: 'WorkingHoursStart', value: WorkingHoursStart || '10:00:00' },
                { name: 'WorkingHoursEnd', value: WorkingHoursEnd || '20:00:00' },
                { name: 'WorkingDays', value: WorkingDays || '1,2,3,4,5' },
                { name: 'AutoResponseEnabled', value: AutoResponseEnabled !== undefined ? AutoResponseEnabled : true },
                { name: 'AutoResponseMessage', value: AutoResponseMessage || 'Gracias por contactar con Rubio García Dental. Te responderemos pronto.' }
            ]);

            res.json({
                success: true,
                message: 'Configuración de IA actualizada correctamente',
                data: { updated: true }
            });

        } catch (error) {
            console.error('Error actualizando configuración IA:', error);
            res.status(500).json({
                success: false,
                error: 'Error actualizando configuración',
                code: 'AI_CONFIG_UPDATE_ERROR'
            });
        }
    }

    /**
     * Obtener estadísticas de conversaciones
     */
    static async getConversationStats(req, res) {
        try {
            const statsQuery = `
                SELECT 
                    -- Conteo general
                    COUNT(*) as TotalConversations,
                    SUM(CASE WHEN HasUrgencyTag = 1 THEN 1 ELSE 0 END) as UrgentConversations,
                    COUNT(CASE WHEN LastMessageAt >= DATEADD(day, -1, GETDATE()) THEN 1 END) as Last24hConversations,
                    
                    -- Promedio de mensajes
                    AVG(MessageCount) as AverageMessagesPerConversation,
                    
                    -- Tiempo de respuesta
                    AVG(DATEDIFF(minute, ConversationStartedAt, LastMessageAt)) as AverageResponseTimeMinutes,
                    
                    -- Distribución por tags
                    SUM(CASE WHEN TagColor = 'orange' THEN 1 ELSE 0 END) as OrangeTagged,
                    SUM(CASE WHEN TagColor = 'normal' THEN 1 ELSE 0 END) as NormalTagged,
                    SUM(CASE WHEN TagColor IS NULL OR TagColor = '' THEN 1 ELSE 0 END) as NoTag
                FROM WhatsAppConversations
                WHERE IsActive = 1
            `;

            const result = await dbConfig.executeQuery(statsQuery);

            // Obtener conversaciones activas en tiempo real
            const activeQuery = `
                SELECT COUNT(*) as ActiveConversations
                FROM WhatsAppConversations
                WHERE IsActive = 1 
                  AND DATEDIFF(hour, LastMessageAt, GETDATE()) < 24
            `;

            const activeResult = await dbConfig.executeQuery(activeQuery);

            res.json({
                success: true,
                data: {
                    ...result.recordset[0],
                    ActiveConversations: activeResult.recordset[0].ActiveConversations,
                    UrgentPercentage: result.recordset[0].TotalConversations > 0 ? 
                        ((result.recordset[0].UrgentConversations / result.recordset[0].TotalConversations) * 100).toFixed(1) : 0
                }
            });

        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            res.status(500).json({
                success: false,
                error: 'Error obteniendo estadísticas',
                code: 'CONVERSATION_STATS_ERROR'
            });
        }
    }

    // ========== MÉTODOS AUXILIARES ==========

    /**
     * Determinar estado de conversación
     */
    static getConversationStatus(minutesSinceLastMessage, messageCount) {
        if (minutesSinceLastMessage < 30) return 'active';
        if (minutesSinceLastMessage < 1440) return 'recent'; // 24 horas
        if (minutesSinceLastMessage < 10080) return 'moderate'; // 1 semana
        return 'old';
    }

    /**
     * Detectar palabras clave de urgencia
     */
    static detectUrgencyKeywords(messageText) {
        const urgentKeywords = [
            'dolor', 'duele', 'dolor de muela', 'urgen', 'emergencia', 
            'me duele mucho', 'muy mal', 'grave', 'sangrando', 
            'accidente', 'urgente', 'no puedo esperar'
        ];
        
        const lowerText = (messageText || '').toLowerCase();
        return urgentKeywords.some(keyword => lowerText.includes(keyword));
    }

    /**
     * Obtener color de estado para UI
     */
    static getStatusColor(minutesSinceLastMessage) {
        if (minutesSinceLastMessage < 30) return 'green';
        if (minutesSinceLastMessage < 1440) return 'yellow';
        if (minutesSinceLastMessage < 10080) return 'orange';
        return 'red';
    }

    /**
     * Verificar si es horario de trabajo
     */
    static isWorkingHours(config) {
        const now = moment();
        const currentDay = now.day() === 0 ? 7 : now.day(); // Convertir domingo (0) a 7
        const currentTime = now.format('HH:mm');
        
        const workingDays = (config.WorkingDays || '1,2,3,4,5').split(',').map(d => parseInt(d.trim()));
        
        // Verificar si es día laboral
        if (!workingDays.includes(currentDay)) {
            return false;
        }
        
        // Verificar horario
        return currentTime >= config.WorkingHoursStart && currentTime <= config.WorkingHoursEnd;
    }

    /**
     * Marcar conversación como leída
     */
    static async markAsRead(conversationId) {
        try {
            const query = `
                UPDATE WhatsAppConversations
                SET LastReadAt = GETDATE()
                WHERE ConversationID = @conversationId
            `;
            await dbConfig.executeQuery(query, [
                { name: 'conversationId', value: parseInt(conversationId) }
            ]);
        } catch (error) {
            console.error('Error marcando como leído:', error);
        }
    }

    /**
     * Registrar acción de etiquetado
     */
    static async logTagAction(conversationId, tagColor, actionType, taggedBy, notes) {
        try {
            const query = `
                INSERT INTO ConversationTags (ConversationID, TagColor, ActionType, TaggedBy, TagNotes)
                VALUES (@conversationId, @tagColor, @actionType, @taggedBy, @notes)
            `;
            await dbConfig.executeQuery(query, [
                { name: 'conversationId', value: parseInt(conversationId) },
                { name: 'tagColor', value: tagColor },
                { name: 'actionType', value: actionType },
                { name: 'taggedBy', value: taggedBy },
                { name: 'notes', value: notes || null }
            ]);
        } catch (error) {
            console.error('Error registrando tag:', error);
        }
    }

    /**
     * Crear configuración por defecto de IA
     */
    static async createDefaultAIConfig() {
        try {
            const query = `
                INSERT INTO AIConfiguration (IsEnabled, IsActiveOutsideHours)
                VALUES (1, 1)
            `;
            await dbConfig.executeQuery(query);
        } catch (error) {
            console.error('Error creando configuración IA por defecto:', error);
        }
    }
}

module.exports = ConversationController;