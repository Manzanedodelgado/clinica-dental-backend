/**
 * Controlador WhatsApp Business API
 * Sistema de Gestión Dental - Rubio García Dental
 * 
 * Gestión completa de conversaciones, mensajes y confirmaciones automáticas
 */

const { dbConfig, SQL_QUERIES } = require('../config/database');
const natural = require('natural');
const moment = require('moment');
const axios = require('axios');

class WhatsAppController {
    /**
     * Obtener lista de conversaciones
     */
    static async getConversations(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            const status = req.query.status || null;
            const patientId = req.query.patientId || null;

            let query = `
                SELECT 
                    c.*,
                    p.FirstName + ' ' + p.LastName as PatientName,
                    p.Phone as PatientPhone,
                    p.DateOfBirth,
                    (SELECT TOP 1 m.MessageText 
                     FROM WhatsAppMessages m 
                     WHERE m.ConversationID = c.ConversationID 
                     ORDER BY m.SentDate DESC) as LastMessage,
                    (SELECT TOP 1 m.SentDate 
                     FROM WhatsAppMessages m 
                     WHERE m.ConversationID = c.ConversationID 
                     ORDER BY m.SentDate DESC) as LastMessageDate,
                    (SELECT COUNT(*) 
                     FROM WhatsAppMessages m 
                     WHERE m.ConversationID = c.ConversationID AND m.IsRead = 0 AND m.Direction = 'inbound') as UnreadCount
                FROM WhatsAppConversations c
                LEFT JOIN DPatients p ON c.PatientID = p.PatientID
                WHERE 1=1
            `;

            const params = [];

            if (status) {
                query += ` AND c.Status = @status`;
                params.push({ name: 'status', value: status });
            }

            if (patientId) {
                query += ` AND c.PatientID = @patientId`;
                params.push({ name: 'patientId', value: patientId });
            }

            query += ` ORDER BY LastMessageDate DESC
                      OFFSET @offset ROWS 
                      FETCH NEXT @limit ROWS ONLY`;

            params.push({ name: 'offset', value: offset });
            params.push({ name: 'limit', value: limit });

            const result = await dbConfig.executeQuery(query, params);
            const totalResult = await dbConfig.executeQuery('SELECT COUNT(*) as total FROM WhatsAppConversations');
            
            res.json({
                success: true,
                data: result.recordset,
                pagination: {
                    page,
                    limit,
                    total: totalResult.recordset[0].total,
                    pages: Math.ceil(totalResult.recordset[0].total / limit)
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
     * Crear nueva conversación
     */
    static async createConversation(req, res) {
        try {
            const { patientId, message, appointmentId } = req.body;

            // Verificar que el paciente existe
            const patient = await dbConfig.executeQuery(
                'SELECT PatientID, FirstName, LastName, Phone FROM DPatients WHERE PatientID = @patientId',
                [{ name: 'patientId', value: patientId }]
            );

            if (patient.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Paciente no encontrado'
                });
            }

            // Crear conversación
            const conversationQuery = `
                INSERT INTO WhatsAppConversations (PatientID, AppointmentID, Status, CreatedDate, LastActivityDate)
                OUTPUT INSERTED.ConversationID
                VALUES (@patientId, @appointmentId, 'active', GETDATE(), GETDATE())
            `;

            const conversationResult = await dbConfig.executeQuery(conversationQuery, [
                { name: 'patientId', value: patientId },
                { name: 'appointmentId', value: appointmentId || null }
            ]);

            const conversationId = conversationResult.recordset[0].ConversationID;

            // Enviar primer mensaje si se proporciona
            if (message) {
                await WhatsAppController.sendMessage({
                    conversationId,
                    text: message,
                    type: 'text'
                });
            }

            res.status(201).json({
                success: true,
                data: {
                    conversationId,
                    patientId,
                    appointmentId,
                    status: 'active'
                }
            });

        } catch (error) {
            console.error('Error creando conversación:', error);
            res.status(500).json({
                success: false,
                error: 'Error creando conversación',
                code: 'CREATE_CONVERSATION_ERROR'
            });
        }
    }

    /**
     * Obtener conversación específica
     */
    static async getConversation(req, res) {
        try {
            const { id } = req.params;

            const query = `
                SELECT 
                    c.*,
                    p.FirstName + ' ' + p.LastName as PatientName,
                    p.Phone as PatientPhone,
                    p.DateOfBirth,
                    d.FirstName + ' ' + d.LastName as DoctorName,
                    d.Specialty
                FROM WhatsAppConversations c
                LEFT JOIN DPatients p ON c.PatientID = p.PatientID
                LEFT JOIN DDoctors d ON c.AssignedDoctorID = d.DoctorID
                WHERE c.ConversationID = @id
            `;

            const result = await dbConfig.executeQuery(query, [
                { name: 'id', value: parseInt(id) }
            ]);

            if (result.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Conversación no encontrada'
                });
            }

            res.json({
                success: true,
                data: result.recordset[0]
            });

        } catch (error) {
            console.error('Error obteniendo conversación:', error);
            res.status(500).json({
                success: false,
                error: 'Error obteniendo conversación',
                code: 'GET_CONVERSATION_ERROR'
            });
        }
    }

    /**
     * Obtener mensajes de conversación
     */
    static async getMessages(req, res) {
        try {
            const { id } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const offset = (page - 1) * limit;

            const query = `
                SELECT 
                    m.*,
                    CASE WHEN m.Direction = 'outbound' THEN 'doctor' ELSE 'patient' END as SenderRole,
                    CASE WHEN m.Direction = 'outbound' THEN d.FirstName + ' ' + d.LastName 
                         ELSE p.FirstName + ' ' + p.LastName END as SenderName
                FROM WhatsAppMessages m
                LEFT JOIN DDoctors d ON m.DoctorID = d.DoctorID
                LEFT JOIN DPatients p ON m.PatientID = p.PatientID
                WHERE m.ConversationID = @id
                ORDER BY m.SentDate DESC
                OFFSET @offset ROWS 
                FETCH NEXT @limit ROWS ONLY
            `;

            const result = await dbConfig.executeQuery(query, [
                { name: 'id', value: parseInt(id) },
                { name: 'offset', value: offset },
                { name: 'limit', value: limit }
            ]);

            // Marcar mensajes como leídos si son entrantes
            await dbConfig.executeQuery(
                'UPDATE WhatsAppMessages SET IsRead = 1 WHERE ConversationID = @id AND Direction = \'inbound\'',
                [{ name: 'id', value: parseInt(id) }]
            );

            res.json({
                success: true,
                data: result.recordset.reverse() // Ordenar cronológicamente
            });

        } catch (error) {
            console.error('Error obteniendo mensajes:', error);
            res.status(500).json({
                success: false,
                error: 'Error obteniendo mensajes',
                code: 'GET_MESSAGES_ERROR'
            });
        }
    }

    /**
     * Enviar mensaje WhatsApp
     */
    static async sendMessage(req, res) {
        try {
            const { conversationId, text, type, templateId } = req.body;
            const doctorId = req.user?.doctorId || 1;

            // Verificar conversación
            const conversation = await dbConfig.executeQuery(
                'SELECT ConversationID, PatientID FROM WhatsAppConversations WHERE ConversationID = @id',
                [{ name: 'id', value: conversationId }]
            );

            if (conversation.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Conversación no encontrada'
                });
            }

            const patientId = conversation.recordset[0].PatientID;

            // Determinar contenido del mensaje
            let messageText = text;
            if (type === 'template' && templateId) {
                const template = await dbConfig.executeQuery(
                    'SELECT Content FROM WhatsAppTemplates WHERE TemplateID = @id',
                    [{ name: 'id', value: templateId }]
                );
                if (template.recordset.length > 0) {
                    messageText = template.recordset[0].Content;
                }
            }

            // Insertar mensaje en base de datos
            const messageQuery = `
                INSERT INTO WhatsAppMessages (
                    ConversationID, PatientID, DoctorID, MessageText, MessageType, 
                    Direction, Status, SentDate, IsRead
                )
                OUTPUT INSERTED.MessageID
                VALUES (
                    @conversationId, @patientId, @doctorId, @messageText, @type,
                    'outbound', 'sent', GETDATE(), 1
                )
            `;

            const messageResult = await dbConfig.executeQuery(messageQuery, [
                { name: 'conversationId', value: conversationId },
                { name: 'patientId', value: patientId },
                { name: 'doctorId', value: doctorId },
                { name: 'messageText', value: messageText },
                { name: 'type', value: type || 'text' }
            ]);

            const messageId = messageResult.recordset[0].MessageID;

            // Actualizar última actividad de conversación
            await dbConfig.executeQuery(
                'UPDATE WhatsAppConversations SET LastActivityDate = GETDATE() WHERE ConversationID = @id',
                [{ name: 'id', value: conversationId }]
            );

            // TODO: Integrar con WhatsApp Business API real
            // Por ahora simulamos el envío
            console.log(`Mensaje enviado a WhatsApp API - ID: ${messageId}`);

            res.status(201).json({
                success: true,
                data: {
                    messageId,
                    conversationId,
                    text: messageText,
                    type: type || 'text',
                    sentAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error enviando mensaje:', error);
            res.status(500).json({
                success: false,
                error: 'Error enviando mensaje',
                code: 'SEND_MESSAGE_ERROR'
            });
        }
    }

    /**
     * Obtener mensajes pendientes de procesar (para IA)
     */
    static async getPendingMessages(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const appointmentId = req.query.appointmentId;

            let query = `
                SELECT TOP (@limit)
                    m.*,
                    c.AppointmentID,
                    p.FirstName + ' ' + p.LastName as PatientName,
                    p.Phone as PatientPhone
                FROM WhatsAppMessages m
                INNER JOIN WhatsAppConversations c ON m.ConversationID = c.ConversationID
                INNER JOIN DPatients p ON c.PatientID = p.PatientID
                WHERE m.Direction = 'inbound' 
                  AND m.IsProcessed = 0
                  AND m.ReceivedDate > DATEADD(hour, -24, GETDATE()) -- Últimas 24 horas
            `;

            const params = [{ name: 'limit', value: limit }];

            if (appointmentId) {
                query += ` AND c.AppointmentID = @appointmentId`;
                params.push({ name: 'appointmentId', value: appointmentId });
            }

            query += ` ORDER BY m.ReceivedDate DESC`;

            const result = await dbConfig.executeQuery(query, params);

            res.json({
                success: true,
                data: result.recordset
            });

        } catch (error) {
            console.error('Error obteniendo mensajes pendientes:', error);
            res.status(500).json({
                success: false,
                error: 'Error obteniendo mensajes pendientes',
                code: 'GET_PENDING_MESSAGES_ERROR'
            });
        }
    }

    /**
     * Marcar mensaje como leído
     */
    static async markAsRead(req, res) {
        try {
            const { id } = req.params;

            await dbConfig.executeQuery(
                'UPDATE WhatsAppMessages SET IsRead = 1, ReadDate = GETDATE() WHERE MessageID = @id',
                [{ name: 'id', value: parseInt(id) }]
            );

            res.json({
                success: true,
                message: 'Mensaje marcado como leído'
            });

        } catch (error) {
            console.error('Error marcando mensaje como leído:', error);
            res.status(500).json({
                success: false,
                error: 'Error actualizando mensaje',
                code: 'MARK_AS_READ_ERROR'
            });
        }
    }

    /**
     * Obtener plantillas de mensajes
     */
    static async getTemplates(req, res) {
        try {
            const type = req.query.type;
            const active = req.query.active;

            let query = 'SELECT * FROM WhatsAppTemplates WHERE 1=1';
            const params = [];

            if (type) {
                query += ' AND Type = @type';
                params.push({ name: 'type', value: type });
            }

            if (active !== undefined) {
                query += ' AND IsActive = @active';
                params.push({ name: 'active', value: active === 'true' });
            }

            query += ' ORDER BY Name';

            const result = await dbConfig.executeQuery(query, params);

            res.json({
                success: true,
                data: result.recordset
            });

        } catch (error) {
            console.error('Error obteniendo plantillas:', error);
            res.status(500).json({
                success: false,
                error: 'Error obteniendo plantillas',
                code: 'GET_TEMPLATES_ERROR'
            });
        }
    }

    /**
     * Crear nueva plantilla
     */
    static async createTemplate(req, res) {
        try {
            const { name, content, type, variables } = req.body;

            const query = `
                INSERT INTO WhatsAppTemplates (Name, Content, Type, Variables, IsActive, CreatedDate)
                OUTPUT INSERTED.TemplateID
                VALUES (@name, @content, @type, @variables, 1, GETDATE())
            `;

            const result = await dbConfig.executeQuery(query, [
                { name: 'name', value: name },
                { name: 'content', value: content },
                { name: 'type', value: type },
                { name: 'variables', value: JSON.stringify(variables || []) }
            ]);

            res.status(201).json({
                success: true,
                data: {
                    templateId: result.recordset[0].TemplateID,
                    name,
                    type,
                    createdAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error creando plantilla:', error);
            res.status(500).json({
                success: false,
                error: 'Error creando plantilla',
                code: 'CREATE_TEMPLATE_ERROR'
            });
        }
    }

    /**
     * Enviar confirmación de cita 24h antes
     */
    static async sendAppointmentConfirmation(req, res) {
        try {
            const { appointmentId, customMessage } = req.body;

            // Obtener información de la cita
            const appointmentQuery = `
                SELECT 
                    a.*,
                    p.FirstName + ' ' + p.LastName as PatientName,
                    p.Phone as PatientPhone,
                    d.FirstName + ' ' + d.LastName as DoctorName,
                    d.Specialty
                FROM DCitas a
                INNER JOIN DPatients p ON a.PatientID = p.PatientID
                INNER JOIN DDoctors d ON a.DoctorID = d.DoctorID
                WHERE a.CitaID = @appointmentId
            `;

            const appointment = await dbConfig.executeQuery(appointmentQuery, [
                { name: 'appointmentId', value: appointmentId }
            ]);

            if (appointment.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Cita no encontrada'
                });
            }

            const appt = appointment.recordset[0];

            // Verificar que la cita está en estado adecuado (Planificada)
            if (appt.IdSitC !== 0) {
                return res.status(400).json({
                    success: false,
                    error: 'La cita debe estar en estado Planificada para enviar confirmación'
                });
            }

            // Obtener plantilla de confirmación
            const template = await dbConfig.executeQuery(
                'SELECT Content FROM WhatsAppTemplates WHERE Type = \'confirmation\' AND IsActive = 1',
                []
            );

            let messageText = customMessage || '';
            if (template.recordset.length > 0 && !customMessage) {
                // Procesar variables en la plantilla
                messageText = template.recordset[0].Content
                    .replace('{patientName}', appt.PatientName)
                    .replace('{doctorName}', appt.DoctorName)
                    .replace('{date}', moment(appt.Fecha).format('DD/MM/YYYY'))
                    .replace('{time}', appt.Hora)
                    .replace('{treatment}', appt.Tratamiento);
            }

            // Crear o obtener conversación existente
            let conversationQuery = `
                SELECT TOP 1 c.ConversationID 
                FROM WhatsAppConversations c
                WHERE c.PatientID = @patientId AND c.AppointmentID = @appointmentId
            `;

            let conversation = await dbConfig.executeQuery(conversationQuery, [
                { name: 'patientId', value: appt.PatientID },
                { name: 'appointmentId', value: appointmentId }
            ]);

            let conversationId;
            if (conversation.recordset.length === 0) {
                // Crear nueva conversación
                const newConv = await WhatsAppController.createConversation({
                    body: {
                        patientId: appt.PatientID,
                        message: messageText,
                        appointmentId
                    },
                    user: req.user
                });
                conversationId = newConv.data.conversationId;
            } else {
                conversationId = conversation.recordset[0].ConversationID;
                // Enviar mensaje en conversación existente
                await WhatsAppController.sendMessage({
                    body: {
                        conversationId,
                        text: messageText,
                        type: 'template'
                    },
                    user: req.user
                });
            }

            // Registrar en log de confirmaciones
            await dbConfig.executeQuery(`
                INSERT INTO AppointmentConfirmations (AppointmentID, ConversationID, MessageSent, SentDate, Status)
                VALUES (@appointmentId, @conversationId, @messageText, GETDATE(), 'sent')
            `, [
                { name: 'appointmentId', value: appointmentId },
                { name: 'conversationId', value: conversationId },
                { name: 'messageText', value: messageText }
            ]);

            res.json({
                success: true,
                data: {
                    appointmentId,
                    conversationId,
                    message: messageText,
                    sentAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error enviando confirmación:', error);
            res.status(500).json({
                success: false,
                error: 'Error enviando confirmación de cita',
                code: 'SEND_CONFIRMATION_ERROR'
            });
        }
    }

    /**
     * Procesar respuesta de confirmación del paciente
     */
    static async processConfirmationResponse(req, res) {
        try {
            const { appointmentId, response, patientMessage, confidence } = req.body;

            // Analizar respuesta del paciente usando IA
            const analysis = await WhatsAppController.analyzePatientResponse(patientMessage);

            // Determinar acción final
            let finalResponse = response;
            if (confidence && confidence < 0.7) {
                // Si la confianza es baja, usar análisis de IA
                finalResponse = analysis.intent;
            }

            // Actualizar estado de cita en SQL Server
            let statusUpdate = {};
            switch (finalResponse) {
                case 'confirm':
                    statusUpdate = {
                        status: 7, // Confirmada
                        sqlField: 'IdSitC',
                        sqlValue: 7
                    };
                    break;
                case 'cancel':
                    statusUpdate = {
                        status: 8, // Cancelada
                        sqlField: 'IdSitC',
                        sqlValue: 8
                    };
                    break;
                case 'reschedule':
                    // Mantener como Planificada pero marcar para reprogramar
                    statusUpdate = {
                        status: 0, // Planificada
                        sqlField: 'IdSitC',
                        sqlValue: 0
                    };
                    break;
            }

            if (statusUpdate.sqlField) {
                await dbConfig.executeQuery(`
                    UPDATE DCitas 
                    SET ${statusUpdate.sqlField} = @value, 
                        HorSitCita = GETDATE()
                    WHERE CitaID = @appointmentId
                `, [
                    { name: 'value', value: statusUpdate.sqlValue },
                    { name: 'appointmentId', value: appointmentId }
                ]);
            }

            // Registrar respuesta en base de datos
            await dbConfig.executeQuery(`
                UPDATE AppointmentConfirmations 
                SET PatientResponse = @response, 
                    ResponseDate = GETDATE(),
                    AIConfidence = @confidence,
                    AnalysisResult = @analysis,
                    FinalStatus = @finalStatus
                WHERE AppointmentID = @appointmentId
            `, [
                { name: 'response', value: patientMessage },
                { name: 'confidence', value: confidence || 0.0 },
                { name: 'analysis', value: JSON.stringify(analysis) },
                { name: 'finalStatus', value: statusUpdate.status || 0 },
                { name: 'appointmentId', value: appointmentId }
            ]);

            // Enviar mensaje de confirmación al paciente
            const confirmationMessage = finalResponse === 'confirm' 
                ? `Perfecto, tu cita ha sido confirmada. Te esperamos en la clínica.`
                : `Entendido, hemos registrado tu cancelación. Puedes contactar con nosotros para reprogramar.`;

            // Obtener conversación
            const conversation = await dbConfig.executeQuery(`
                SELECT TOP 1 c.ConversationID 
                FROM WhatsAppConversations c
                WHERE c.AppointmentID = @appointmentId
            `, [{ name: 'appointmentId', value: appointmentId }]);

            if (conversation.recordset.length > 0) {
                await WhatsAppController.sendMessage({
                    body: {
                        conversationId: conversation.recordset[0].ConversationID,
                        text: confirmationMessage,
                        type: 'text'
                    },
                    user: req.user
                });
            }

            res.json({
                success: true,
                data: {
                    appointmentId,
                    originalResponse: response,
                    finalResponse,
                    confidence: confidence || 0.0,
                    aiAnalysis: analysis,
                    message: confirmationMessage,
                    processedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error procesando confirmación:', error);
            res.status(500).json({
                success: false,
                error: 'Error procesando respuesta de confirmación',
                code: 'PROCESS_CONFIRMATION_ERROR'
            });
        }
    }

    /**
     * Analizar respuesta del paciente usando IA
     */
    static async analyzePatientResponse(text) {
        try {
            const lowerText = text.toLowerCase();
            
            // Palabras clave para confirmación
            const confirmKeywords = ['confirmo', 'confirmo la cita', 'si', 'sí', 'vale', 'ok', 'correcto', 'bien', 'acepto', 'confirmada'];
            const cancelKeywords = ['cancelar', 'no puedo', 'no voy', 'imposible', 'cancelada', 'no', 'no vale', 'problem'];
            const rescheduleKeywords = ['cambiar', 'mover', 'otro día', 'diferente', 'reprogramar', 'otra hora'];

            // Analizar con Natural Language Processing
            const classifier = new natural.BayesClassifier();
            
            // Entrenar clasificador (en producción esto sería más robusto)
            classifier.addDocument('confirmo si vale correcto acepto bien ok', 'confirm');
            classifier.addDocument('cancelar no puedo no voy imposible no', 'cancel');
            classifier.addDocument('cambiar mover otro día diferente reprogramar otra hora', 'reschedule');
            
            classifier.train();
            
            const classification = classifier.classify(lowerText);
            const probabilities = classifier.getClassifications(lowerText);

            // Calcular score de confianza
            let confidence = 0.0;
            const topResult = probabilities[0];
            if (topResult) {
                confidence = topResult.value;
            }

            return {
                intent: classification,
                confidence: confidence,
                keywords: {
                    confirm: confirmKeywords.filter(keyword => lowerText.includes(keyword)).length,
                    cancel: cancelKeywords.filter(keyword => lowerText.includes(keyword)).length,
                    reschedule: rescheduleKeywords.filter(keyword => lowerText.includes(keyword)).length
                },
                rawText: text,
                analyzedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error analizando respuesta:', error);
            return {
                intent: 'unknown',
                confidence: 0.0,
                error: error.message,
                analyzedAt: new Date().toISOString()
            };
        }
    }

    /**
     * Obtener estadísticas de WhatsApp
     */
    static async getStatistics(req, res) {
        try {
            const { startDate, endDate, metric } = req.query;
            
            const start = startDate ? moment(startDate).format('YYYY-MM-DD') : moment().subtract(30, 'days').format('YYYY-MM-DD');
            const end = endDate ? moment(endDate).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD');

            let query = '';
            let params = [
                { name: 'startDate', value: start },
                { name: 'endDate', value: end }
            ];

            switch (metric) {
                case 'conversations':
                    query = `
                        SELECT 
                            CONVERT(date, LastActivityDate) as Date,
                            COUNT(*) as TotalConversations,
                            SUM(CASE WHEN Status = 'active' THEN 1 ELSE 0 END) as ActiveConversations,
                            SUM(CASE WHEN Status = 'archived' THEN 1 ELSE 0 END) as ArchivedConversations
                        FROM WhatsAppConversations
                        WHERE CONVERT(date, LastActivityDate) BETWEEN @startDate AND @endDate
                        GROUP BY CONVERT(date, LastActivityDate)
                        ORDER BY Date
                    `;
                    break;

                case 'messages':
                    query = `
                        SELECT 
                            CONVERT(date, SentDate) as Date,
                            COUNT(*) as TotalMessages,
                            SUM(CASE WHEN Direction = 'inbound' THEN 1 ELSE 0 END) as InboundMessages,
                            SUM(CASE WHEN Direction = 'outbound' THEN 1 ELSE 0 END) as OutboundMessages
                        FROM WhatsAppMessages
                        WHERE CONVERT(date, SentDate) BETWEEN @startDate AND @endDate
                        GROUP BY CONVERT(date, SentDate)
                        ORDER BY Date
                    `;
                    break;

                case 'confirmations':
                    query = `
                        SELECT 
                            CONVERT(date, SentDate) as Date,
                            COUNT(*) as TotalSent,
                            SUM(CASE WHEN ResponseDate IS NOT NULL THEN 1 ELSE 0 END) as Responses,
                            SUM(CASE WHEN FinalStatus = 7 THEN 1 ELSE 0 END) as Confirmed,
                            SUM(CASE WHEN FinalStatus = 8 THEN 1 ELSE 0 END) as Cancelled
                        FROM AppointmentConfirmations
                        WHERE CONVERT(date, SentDate) BETWEEN @startDate AND @endDate
                        GROUP BY CONVERT(date, SentDate)
                        ORDER BY Date
                    `;
                    break;

                default:
                    // Estadísticas generales
                    query = `
                        SELECT 
                            'conversations' as Type,
                            COUNT(*) as Total
                        FROM WhatsAppConversations
                        WHERE CONVERT(date, LastActivityDate) BETWEEN @startDate AND @endDate
                        UNION ALL
                        SELECT 
                            'messages' as Type,
                            COUNT(*) as Total
                        FROM WhatsAppMessages
                        WHERE CONVERT(date, SentDate) BETWEEN @startDate AND @endDate
                        UNION ALL
                        SELECT 
                            'confirmations' as Type,
                            COUNT(*) as Total
                        FROM AppointmentConfirmations
                        WHERE CONVERT(date, SentDate) BETWEEN @startDate AND @endDate
                    `;
            }

            const result = await dbConfig.executeQuery(query, params);

            res.json({
                success: true,
                data: result.recordset,
                period: {
                    startDate: start,
                    endDate: end
                }
            });

        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            res.status(500).json({
                success: false,
                error: 'Error obteniendo estadísticas',
                code: 'GET_STATISTICS_ERROR'
            });
        }
    }

    /**
     * Webhook para WhatsApp Business API
     */
    static async webhook(req, res) {
        try {
            const { object, entry } = req.body;

            // Verificar que es un mensaje de WhatsApp
            if (object === 'whatsapp_business_account') {
                for (const entryItem of entry) {
                    for (const change of entryItem.changes) {
                        if (change.field === 'messages') {
                            await WhatsAppController.processIncomingMessage(change.value);
                        }
                    }
                }
            }

            res.status(200).json({ success: true });

        } catch (error) {
            console.error('Error en webhook:', error);
            res.status(500).json({
                success: false,
                error: 'Error procesando webhook'
            });
        }
    }

    /**
     * Procesar mensaje entrante
     */
    static async processIncomingMessage(changeValue) {
        try {
            const { messages, contacts } = changeValue;
            
            for (const message of messages) {
                const phoneNumber = message.from;
                const text = message.text?.body || '';
                const messageId = message.id;

                // Buscar paciente por teléfono
                const patient = await dbConfig.executeQuery(
                    'SELECT PatientID, FirstName, LastName FROM DPatients WHERE Phone = @phone OR MobilePhone = @phone',
                    [{ name: 'phone', value: phoneNumber }]
                );

                if (patient.recordset.length > 0) {
                    const patientId = patient.recordset[0].PatientID;

                    // Buscar conversación activa o crear una nueva
                    let conversation = await dbConfig.executeQuery(`
                        SELECT TOP 1 ConversationID 
                        FROM WhatsAppConversations 
                        WHERE PatientID = @patientId AND Status = 'active'
                        ORDER BY LastActivityDate DESC
                    `, [{ name: 'patientId', value: patientId }]);

                    let conversationId;
                    if (conversation.recordset.length === 0) {
                        const newConv = await WhatsAppController.createConversation({
                            body: {
                                patientId,
                                message: `Mensaje recibido: ${text}`
                            }
                        });
                        conversationId = newConv.data.conversationId;
                    } else {
                        conversationId = conversation.recordset[0].ConversationID;
                    }

                    // Guardar mensaje entrante
                    await dbConfig.executeQuery(`
                        INSERT INTO WhatsAppMessages (
                            ConversationID, PatientID, MessageText, MessageType,
                            Direction, Status, SentDate, ReceivedDate, IsRead, IsProcessed
                        )
                        VALUES (
                            @conversationId, @patientId, @text, 'text',
                            'inbound', 'received', GETDATE(), GETDATE(), 0, 0
                        )
                    `, [
                        { name: 'conversationId', value: conversationId },
                        { name: 'patientId', value: patientId },
                        { name: 'text', value: text }
                    ]);

                    // TODO: Enviar a IA para procesamiento automático
                    console.log(`Nuevo mensaje de ${phoneNumber}: ${text}`);
                }
            }

        } catch (error) {
            console.error('Error procesando mensaje entrante:', error);
        }
    }

    // ========== MÉTODOS ADICIONALES ==========

    /**
     * Obtener actividad reciente
     */
    static async getActivity(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const type = req.query.type;

            let query = `
                SELECT TOP (@limit)
                    'message' as ActivityType,
                    m.MessageID as ID,
                    p.FirstName + ' ' + p.LastName as PatientName,
                    m.MessageText as Content,
                    m.SentDate as Timestamp,
                    m.Direction
                FROM WhatsAppMessages m
                INNER JOIN DPatients p ON m.PatientID = p.PatientID
            `;

            const params = [{ name: 'limit', value: limit }];

            if (type) {
                query += ` WHERE 'message' = @type`;
                params.push({ name: 'type', value: type });
            }

            query += ` ORDER BY m.SentDate DESC`;

            const result = await dbConfig.executeQuery(query, params);

            res.json({
                success: true,
                data: result.recordset
            });

        } catch (error) {
            console.error('Error obteniendo actividad:', error);
            res.status(500).json({
                success: false,
                error: 'Error obteniendo actividad',
                code: 'GET_ACTIVITY_ERROR'
            });
        }
    }

    /**
     * Subir archivo multimedia
     */
    static async uploadMedia(req, res) {
        try {
            const { conversationId, fileType, fileName } = req.body;

            // TODO: Implementar subida de archivos real
            // Por ahora simulamos la subida

            res.json({
                success: true,
                data: {
                    mediaId: Date.now(), // Simulado
                    fileName,
                    fileType,
                    conversationId,
                    uploadedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error subiendo media:', error);
            res.status(500).json({
                success: false,
                error: 'Error subiendo archivo',
                code: 'UPLOAD_MEDIA_ERROR'
            });
        }
    }

    /**
     * Descargar archivo multimedia
     */
    static async downloadMedia(req, res) {
        try {
            const { id } = req.params;

            // TODO: Implementar descarga de archivos real
            res.json({
                success: true,
                message: 'Funcionalidad de descarga en desarrollo'
            });

        } catch (error) {
            console.error('Error descargando media:', error);
            res.status(500).json({
                success: false,
                error: 'Error descargando archivo',
                code: 'DOWNLOAD_MEDIA_ERROR'
            });
        }
    }

    /**
     * Obtener configuración de WhatsApp
     */
    static async getConfig(req, res) {
        try {
            // Configuración simulada - en producción vendría de base de datos/config
            const config = {
                enabled: process.env.WHATSAPP_ENABLED === 'true',
                phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
                webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
                lastSync: new Date().toISOString(),
                rateLimits: {
                    messagesPerSecond: 1,
                    messagesPerMinute: 80,
                    messagesPerDay: 1000
                }
            };

            res.json({
                success: true,
                data: config
            });

        } catch (error) {
            console.error('Error obteniendo configuración:', error);
            res.status(500).json({
                success: false,
                error: 'Error obteniendo configuración',
                code: 'GET_CONFIG_ERROR'
            });
        }
    }

    /**
     * Actualizar configuración de WhatsApp
     */
    static async updateConfig(req, res) {
        try {
            const { enabled, phoneNumberId, accessToken, webhookVerifyToken } = req.body;

            // TODO: Actualizar configuración real en base de datos
            console.log('Configuración actualizada:', { enabled, phoneNumberId });

            res.json({
                success: true,
                message: 'Configuración actualizada correctamente',
                data: {
                    enabled,
                    phoneNumberId,
                    updatedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error actualizando configuración:', error);
            res.status(500).json({
                success: false,
                error: 'Error actualizando configuración',
                code: 'UPDATE_CONFIG_ERROR'
            });
        }
    }
}

module.exports = WhatsAppController;