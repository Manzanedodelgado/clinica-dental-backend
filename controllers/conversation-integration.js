/**
 * MÉTODOS ADICIONALES PARA CONVERSACIONES
 * Sistema de Gestión Dental - Rubio García Dental
 * 
 * Extensión del controlador WhatsApp para gestionar conversaciones
 * con sistema de codificación de urgencias (color naranja)
 */

/**
 * Crear o actualizar conversación con nuevo mensaje
 */
async function handleNewMessage(phoneNumber, messageText, isFromPatient = true, messageType = 'text') {
    try {
        const db = require('../config/database').dbConfig;
        
        // Buscar conversación existente (últimas 24h)
        const existingConversationQuery = `
            SELECT TOP 1 ConversationID, LastMessageAt, MessageCount
            FROM WhatsAppConversations 
            WHERE PatientPhone = @phoneNumber 
              AND IsActive = 1
              AND DATEDIFF(hour, LastMessageAt, GETDATE()) <= 24
            ORDER BY LastMessageAt DESC
        `;
        
        const existingResult = await db.executeQuery(existingConversationQuery, [
            { name: 'phoneNumber', value: phoneNumber }
        ]);

        let conversationId;
        let isNewConversation = false;

        if (existingResult.recordset.length > 0) {
            // Actualizar conversación existente
            const existingConv = existingResult.recordset[0];
            conversationId = existingConv.ConversationID;
            
            const updateConversationQuery = `
                UPDATE WhatsAppConversations
                SET 
                    LastMessageAt = GETDATE(),
                    MessageCount = MessageCount + 1,
                    LastMessageSnippet = @messageSnippet,
                    UpdatedAt = GETDATE()
                WHERE ConversationID = @conversationId
            `;
            
            await db.executeQuery(updateConversationQuery, [
                { name: 'conversationId', value: conversationId },
                { name: 'messageSnippet', value: messageText.substring(0, 500) }
            ]);
        } else {
            // Crear nueva conversación
            isNewConversation = true;
            const createConversationQuery = `
                INSERT INTO WhatsAppConversations (PatientPhone, PatientName, LastMessageAt, MessageCount, LastMessageSnippet)
                VALUES (@phoneNumber, NULL, GETDATE(), 1, @messageSnippet)
                SELECT SCOPE_IDENTITY() as ConversationID
            `;
            
            const createResult = await db.executeQuery(createConversationQuery, [
                { name: 'phoneNumber', value: phoneNumber },
                { name: 'messageSnippet', value: messageText.substring(0, 500) }
            ]);
            
            conversationId = createResult.recordset[0].ConversationID;
        }

        // Guardar mensaje individual
        const insertMessageQuery = `
            INSERT INTO WhatsAppMessages (ConversationID, MessageText, MessageType, FromPhone, FromName, IsFromPatient, MessageTimestamp)
            VALUES (@conversationId, @messageText, @messageType, @fromPhone, NULL, @isFromPatient, GETDATE())
        `;
        
        await db.executeQuery(insertMessageQuery, [
            { name: 'conversationId', value: conversationId },
            { name: 'messageText', value: messageText },
            { name: 'messageType', value: messageType },
            { name: 'fromPhone', value: phoneNumber },
            { name: 'isFromPatient', value: isFromPatient ? 1 : 0 }
        ]);

        // Detectar palabras clave de urgencia automáticamente
        const containsEmergencyKeywords = detectEmergencyKeywords(messageText);
        
        if (containsEmergencyKeywords) {
            await this.markConversationAsUrgent(conversationId, 
                'Detección automática de urgencia', 'AI_SYSTEM');
        }

        return {
            conversationId,
            isNewConversation,
            containsEmergencyKeywords
        };

    } catch (error) {
        console.error('Error manejando nuevo mensaje:', error);
        throw error;
    }
}

/**
 * Marcar conversación como urgente
 */
async function markConversationAsUrgent(conversationId, notes, taggedBy) {
    try {
        const db = require('../config/database').dbConfig;
        
        const updateQuery = `
            UPDATE WhatsAppConversations
            SET 
                HasUrgencyTag = 1,
                TagColor = 'orange',
                TagNotes = @notes,
                TaggedBy = @taggedBy,
                TaggedAt = GETDATE(),
                UpdatedAt = GETDATE()
            WHERE ConversationID = @conversationId
        `;
        
        await db.executeQuery(updateQuery, [
            { name: 'conversationId', value: conversationId },
            { name: 'notes', value: notes },
            { name: 'taggedBy', value: taggedBy }
        ]);

        // Registrar en log
        const logQuery = `
            INSERT INTO ConversationTags (ConversationID, TagColor, ActionType, TaggedBy, TagNotes)
            VALUES (@conversationId, 'orange', 'tagged', @taggedBy, @notes)
        `;
        
        await db.executeQuery(logQuery, [
            { name: 'conversationId', value: conversationId },
            { name: 'taggedBy', value: taggedBy },
            { name: 'notes', value: notes }
        ]);

        console.log(`🟠 Conversación ${conversationId} marcada como urgente (naranja)`);
        
    } catch (error) {
        console.error('Error marcando conversación como urgente:', error);
        throw error;
    }
}

/**
 * Verificar si un mensaje contiene palabras de urgencia
 */
function detectEmergencyKeywords(messageText) {
    const urgentKeywords = [
        'dolor', 'duele', 'dolor de muela', 'urgen', 'emergencia', 
        'me duele mucho', 'muy mal', 'grave', 'sangrando', 
        'accidente', 'urgente', 'no puedo esperar', 'dolor intenso'
    ];
    
    const lowerText = (messageText || '').toLowerCase();
    return urgentKeywords.some(keyword => lowerText.includes(keyword));
}

/**
 * Obtener configuración del agente IA
 */
async function getAIConfiguration() {
    try {
        const db = require('../config/database').dbConfig;
        
        const query = `
            SELECT TOP 1 * 
            FROM AIConfiguration 
            ORDER BY ConfigID DESC
        `;
        
        const result = await db.executeQuery(query);
        
        if (result.recordset.length === 0) {
            // Crear configuración por defecto
            await createDefaultAIConfig();
            return await this.getAIConfiguration();
        }
        
        return result.recordset[0];
        
    } catch (error) {
        console.error('Error obteniendo configuración IA:', error);
        return {
            IsEnabled: true,
            IsActiveOutsideHours: true,
            WorkingHoursStart: '10:00:00',
            WorkingHoursEnd: '20:00:00',
            AutoResponseEnabled: true
        };
    }
}

/**
 * Crear configuración por defecto de IA
 */
async function createDefaultAIConfig() {
    try {
        const db = require('../config/database').dbConfig;
        
        const query = `
            INSERT INTO AIConfiguration (IsEnabled, IsActiveOutsideHours)
            VALUES (1, 1)
        `;
        
        await db.executeQuery(query);
        console.log('✅ Configuración IA por defecto creada');
        
    } catch (error) {
        console.error('Error creando configuración IA:', error);
    }
}

/**
 * Verificar si es horario de trabajo
 */
function isWorkingHours(config = {}) {
    const now = moment();
    const currentDay = now.day() === 0 ? 7 : now.day(); // Domingo = 7
    const currentTime = now.format('HH:mm');
    
    const workingDays = (config.WorkingDays || '1,2,3,4,5').split(',').map(d => parseInt(d.trim()));
    const startTime = config.WorkingHoursStart || '10:00:00';
    const endTime = config.WorkingHoursEnd || '20:00:00';
    
    // Verificar si es día laboral
    if (!workingDays.includes(currentDay)) {
        return false;
    }
    
    // Verificar horario
    return currentTime >= startTime && currentTime <= endTime;
}

/**
 * Procesar mensaje con IA si está habilitado
 */
async function processMessageWithAI(phoneNumber, messageText) {
    try {
        const config = await this.getAIConfiguration();
        
        if (!config.IsEnabled) {
            console.log('🤖 IA deshabilitada, no procesando mensaje');
            return;
        }
        
        const workingHours = this.isWorkingHours(config);
        const shouldActivateAI = workingHours ? config.IsActiveOutsideHours : true;
        
        if (!shouldActivateAI) {
            console.log('🤖 IA no debe activarse en horario de trabajo');
            return;
        }
        
        // Detectar palabras de urgencia
        const hasEmergencyKeywords = this.detectEmergencyKeywords(messageText);
        
        if (hasEmergencyKeywords) {
            console.log('🚨 Mensaje de emergencia detectado');
            await this.handleEmergencyMessage(phoneNumber, messageText);
            return;
        }
        
        // Responder automáticamente basado en el contenido
        const autoResponse = await this.generateAutoResponse(messageText, phoneNumber);
        
        if (autoResponse && config.AutoResponseEnabled) {
            await this.sendMessageToPatient(phoneNumber, autoResponse);
            
            // Marcar mensaje como procesado por IA
            const db = require('../config/database').dbConfig;
            await db.executeQuery(`
                UPDATE WhatsAppMessages 
                SET AIAutoReplySent = 1 
                WHERE FromPhone = @phoneNumber 
                ORDER BY MessageTimestamp DESC 
                LIMIT 1
            `, [{ name: 'phoneNumber', value: phoneNumber }]);
        }
        
    } catch (error) {
        console.error('Error procesando mensaje con IA:', error);
    }
}

/**
 * Generar respuesta automática basada en el mensaje
 */
async function generateAutoResponse(messageText, phoneNumber) {
    const lowerMessage = messageText.toLowerCase();
    
    // Respuestas específicas para consultas médicas
    if (lowerMessage.includes('precio') || lowerMessage.includes('coste') || lowerMessage.includes('cuánto')) {
        return `Gracias por tu consulta. Para información de precios y tratamientos, puedes llamar al ${process.env.CLINIC_PHONE} o visitarnos. También puedes solicitar un presupuesto personalizado.`;
    }
    
    if (lowerMessage.includes('cita') || lowerMessage.includes('reserva') || lowerMessage.includes('appointment')) {
        return `Para reservar una cita puedes llamar al ${process.env.CLINIC_PHONE} o responder con la fecha y hora que prefieras. Nuestro horario: L-J 10-14h y 16-20h, V 10-14h.`;
    }
    
    if (lowerMessage.includes('horario') || lowerMessage.includes('hours')) {
        return `🏥 Horarios Rubio García Dental:\n\n📅 Lunes a Jueves: 10:00-14:00 y 16:00-20:00\n📅 Viernes: 10:00-14:00\n📱 WhatsApp: ${process.env.CLINIC_MOBILE}\n☎️ Teléfono: ${process.env.CLINIC_PHONE}`;
    }
    
    if (lowerMessage.includes('dirección') || lowerMessage.includes('ubicación') || lowerMessage.includes('donde')) {
        return `📍 Puedes encontrarnos en nuestra web: ${process.env.CLINIC_WEBSITE} para la ubicación exacta. También llámanos al ${process.env.CLINIC_PHONE}.`;
    }
    
    // Saludo general
    if (lowerMessage.includes('hola') || lowerMessage.includes('buenos') || lowerMessage.includes('saludos')) {
        return `¡Hola! 👋 Gracias por contactar con Rubio García Dental. ¿En qué podemos ayudarte? Para citas: ${process.env.CLINIC_PHONE}`;
    }
    
    return null;
}

/**
 * Manejar mensaje de emergencia
 */
async function handleEmergencyMessage(phoneNumber, messageText) {
    const emergencyResponse = `🚨 RECEPCIÓN TU MENSAJE - EMERGENCIA DETECTADA\n\nGracias por contactar. Te responderemos inmediatamente. Si es muy urgente, por favor llama al ${process.env.CLINIC_MOBILE}.\n\nRubio García Dental - Atención 24h`;
    
    await this.sendMessageToPatient(phoneNumber, emergencyResponse);
    
    // Marcar como urgente en la conversación
    const conversation = await this.handleNewMessage(phoneNumber, messageText, false);
    await this.markConversationAsUrgent(conversation.conversationId, 'Respuesta automática - emergencia', 'AI_SYSTEM');
    
    console.log(`🚨 Respuesta de emergencia enviada a ${phoneNumber}`);
}

module.exports = {
    handleNewMessage,
    markConversationAsUrgent,
    detectEmergencyKeywords,
    getAIConfiguration,
    createDefaultAIConfig,
    isWorkingHours,
    processMessageWithAI,
    generateAutoResponse,
    handleEmergencyMessage
};