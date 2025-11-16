/**
 * Controlador WhatsApp con Baileys
 * Sistema de Gestión Dental - Rubio García Dental
 * 
 * Gestión completa de conversaciones, mensajes y confirmaciones automáticas
 * usando Baileys (WhatsApp Web API de código abierto)
 */

require('dotenv').config();
const { dbConfig, SQL_QUERIES } = require('../config/database');
const baileys = require('@whiskeysockets/baileys');
const {
    WhatsAppWebSc,
    makeWASocket,
    makeInMemoryStore,
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessage,
    generateWAMessageFromContent,
    downloadMediaMessage,
    jidDecode,
    encodeURIComponentStripped
} = baileys;
const qrcode = require('qrcode-terminal');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');

class WhatsAppBaileysController {
    constructor() {
        this.sock = null;
        this.authState = null;
        this.store = makeInMemoryStore({ logger: console });
        this.isConnected = false;
        this.qrCode = null;
        this.messageQueue = [];
    }

    /**
     * Inicializar conexión WhatsApp con Baileys
     */
    async initialize() {
        try {
            console.log('🚀 Inicializando WhatsApp Baileys...');
            
            // Configurar autenticación multi-archivo
            const authState = await useMultiFileAuthState(`./sessions/${process.env.WHATSAPP_SESSION_NAME}`);
            this.authState = authState;

            // Obtener última versión de Baileys
            const { version, isLatest } = await fetchLatestBaileysVersion();
            console.log(`📱 Usando Baileys v${version.join('.')}${isLatest ? ' (última)' : ''}`);

            // Crear socket
            this.sock = makeWASocket({
                authState: authState.state,
                printQRInTerminal: true,
                browser: ['Clínica Dental Rubio García', 'Chrome', '1.0.0'],
                syncFullHistory: true
            });

            // Configurar handlers de eventos
            this.setupEventHandlers();
            
            this.store.readFromFile('./sessions/baileys_store.json');
            
            console.log('✅ WhatsApp Baileys inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando WhatsApp Baileys:', error);
            throw error;
        }
    }

    /**
     * Configurar manejadores de eventos
     */
    setupEventHandlers() {
        if (!this.sock) return;

        // Conexión establecida
        this.sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                this.qrCode = qr;
                console.log('📱 Escanea el código QR para conectar WhatsApp:');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'open') {
                this.isConnected = true;
                console.log('✅ WhatsApp conectado correctamente');
                
                // Procesar cola de mensajes pendientes
                this.processMessageQueue();
            }

            if (connection === 'close') {
                this.isConnected = false;
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('⚠️ Conexión cerrada, reconectando:', shouldReconnect);
                
                if (shouldReconnect) {
                    this.initialize();
                }
            }
        });

        // Mensajes entrantes
        this.sock.ev.on('messages.upsert', async (m) => {
            const message = m.messages[0];
            if (!message.key.fromMe) {
                await this.handleIncomingMessage(message);
            }
        });

        // Autenticación exitosa
        this.sock.ev.on('creds.update', () => {
            this.authState.saveCreds();
        });
    }

    /**
     * Manejar mensaje entrante
     */
    async handleIncomingMessage(message) {
        try {
            const { key, message: msg } = message;
            const from = key.remoteJid;
            const messageText = msg?.conversation || msg?.extendedTextMessage?.text || '';
            
            console.log(`📥 Mensaje recibido de ${from}: ${messageText.substring(0, 50)}...`);

            // Buscar paciente por número de teléfono
            const patient = await this.findPatientByPhone(from);
            
            if (patient) {
                // Procesar mensaje con IA para determinar intención
                const intent = await this.analyzeMessageIntent(messageText);
                
                // Guardar mensaje en base de datos
                await this.saveMessage({
                    patientId: patient.PatientID,
                    phone: from,
                    text: messageText,
                    type: 'text',
                    direction: 'inbound',
                    isRead: false,
                    intent: intent
                });

                // Responder automáticamente según la intención
                if (intent.action !== 'unknown') {
                    await this.sendAutoResponse(patient, intent);
                }
            }

        } catch (error) {
            console.error('Error procesando mensaje entrante:', error);
        }
    }

    /**
     * Buscar paciente por número de teléfono
     */
    async findPatientByPhone(phone) {
        try {
            // Convertir número al formato de la BD (quitar + y espacios)
            const cleanPhone = phone.replace(/\D/g, '');
            const formattedPhone = cleanPhone.startsWith('34') ? cleanPhone.substring(2) : cleanPhone;
            
            const query = `
                SELECT TOP 1 
                    PatientID, 
                    FirstName + ' ' + LastName as Name,
                    Phone,
                    MobilePhone
                FROM DPatients 
                WHERE Phone LIKE '%' + @phone + '%' 
                   OR MobilePhone LIKE '%' + @phone + '%'
            `;
            
            const result = await dbConfig.executeQuery(query, [
                { name: 'phone', value: formattedPhone }
            ]);
            
            return result.recordset[0] || null;
        } catch (error) {
            console.error('Error buscando paciente:', error);
            return null;
        }
    }

    /**
     * Analizar intención del mensaje con IA simple
     */
    async analyzeMessageIntent(messageText) {
        const text = messageText.toLowerCase().trim();
        
        // Palabras clave para diferentes intenciones
        const patterns = {
            confirm: ['confirmo', 'confirmar', 'si', 'bien', 'ok', 'perfecto', 'acepto'],
            cancel: ['cancelar', 'cancel', 'no', 'cambiar', 'reprogramar', 'mover'],
            reschedule: ['reprogramar', 'cambiar', 'mover', 'posponer', 'aplazar'],
            ask_info: ['informacion', 'info', 'horario', 'direccion', 'telefono'],
            greet: ['hola', 'buenos', 'buenas', 'saludos']
        };

        for (const [action, keywords] of Object.entries(patterns)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                return { action, confidence: 0.8, message: messageText };
            }
        }

        return { action: 'unknown', confidence: 0.2, message: messageText };
    }

    /**
     * Guardar mensaje en base de datos
     */
    async saveMessage(messageData) {
        try {
            const query = `
                INSERT INTO WhatsAppMessages (
                    PatientID, ConversationID, MessageText, MessageType, 
                    Direction, Status, SentDate, IsRead
                )
                OUTPUT INSERTED.MessageID
                VALUES (
                    @patientId, @conversationId, @messageText, @messageType,
                    @direction, @status, GETDATE(), @isRead
                )
            `;

            await dbConfig.executeQuery(query, [
                { name: 'patientId', value: messageData.patientId },
                { name: 'conversationId', value: null }, // TODO: Crear/relacionar conversación
                { name: 'messageText', value: messageData.text },
                { name: 'messageType', value: messageData.type },
                { name: 'direction', value: messageData.direction },
                { name: 'status', value: 'delivered' },
                { name: 'isRead', value: messageData.isRead ? 1 : 0 }
            ]);
        } catch (error) {
            console.error('Error guardando mensaje:', error);
        }
    }

    /**
     * Enviar respuesta automática
     */
    async sendAutoResponse(patient, intent) {
        try {
            let responseMessage = '';
            
            switch (intent.action) {
                case 'confirm':
                    responseMessage = `¡Perfecto, ${patient.Name}! Tu cita ha sido confirmada. ¡Te esperamos!`;
                    break;
                case 'cancel':
                    responseMessage = `Entendido, ${patient.Name}. Tu cita ha sido cancelada. Para reprogramar, llámanos al ${process.env.CLINIC_PHONE}`;
                    break;
                case 'reschedule':
                    responseMessage = `${patient.Name}, para reprogramar tu cita, por favor llámanos al ${process.env.CLINIC_PHONE} o responde con la fecha que prefieras.`;
                    break;
                case 'ask_info':
                    responseMessage = `Hola ${patient.Name}. Aquí tienes nuestra información:\n\n📍 ${process.env.CLINIC_ADDRESS}\n☎️ ${process.env.CLINIC_PHONE}\n📧 ${process.env.CLINIC_EMAIL}`;
                    break;
                case 'greet':
                    responseMessage = `¡Hola ${patient.Name}! ¿En qué podemos ayudarte hoy?`;
                    break;
                default:
                    responseMessage = `Hola ${patient.Name}, gracias por tu mensaje. ¿Podrías ser más específico sobre lo que necesitas?`;
            }

            await this.sendMessageToPatient(patient.MobilePhone || patient.Phone, responseMessage);
            
        } catch (error) {
            console.error('Error enviando respuesta automática:', error);
        }
    }

    /**
     * Enviar mensaje a paciente específico
     */
    async sendMessageToPatient(phoneNumber, text) {
        try {
            if (!this.isConnected || !this.sock) {
                console.log('⚠️ WhatsApp no está conectado, encolando mensaje');
                this.messageQueue.push({ phoneNumber, text, timestamp: new Date() });
                return { success: false, message: 'Mensaje encolado - WhatsApp desconectado' };
            }

            // Convertir número al formato internacional
            const formattedNumber = phoneNumber.startsWith('34') 
                ? phoneNumber 
                : '34' + phoneNumber.replace(/\D/g, '');

            const jid = formattedNumber + '@s.whatsapp.net';
            
            const message = {
                text: text,
                displayText: text
            };

            await this.sock.sendMessage(jid, message);
            
            console.log(`📤 Mensaje enviado a ${formattedNumber}: ${text.substring(0, 30)}...`);
            return { success: true, messageId: Date.now().toString() };
            
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Enviar mensaje de confirmación de cita
     */
    async sendAppointmentConfirmation(appointmentData) {
        try {
            const { patientPhone, patientName, appointmentDate, appointmentTime } = appointmentData;
            
            const message = process.env.WHATSAPP_AUTO_CONFIRMATION_MESSAGE
                .replace('{nombre}', patientName)
                .replace('{fecha}', moment(appointmentDate).format('DD/MM/YYYY'))
                .replace('{hora}', appointmentTime);

            return await this.sendMessageToPatient(patientPhone, message);
            
        } catch (error) {
            console.error('Error enviando confirmación de cita:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Procesar cola de mensajes pendientes
     */
    async processMessageQueue() {
        if (this.messageQueue.length === 0) return;
        
        console.log(`📮 Procesando ${this.messageQueue.length} mensajes en cola`);
        
        const queue = [...this.messageQueue];
        this.messageQueue = [];
        
        for (const msg of queue) {
            try {
                await this.sendMessageToPatient(msg.phoneNumber, msg.text);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Delay entre mensajes
            } catch (error) {
                console.error('Error procesando mensaje en cola:', error);
            }
        }
    }

    /**
     * Obtener estado de conexión
     */
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            hasQr: !!this.qrCode,
            queueLength: this.messageQueue.length,
            qrCode: this.qrCode
        };
    }

    /**
     * Cerrar conexión
     */
    async disconnect() {
        try {
            if (this.sock) {
                await this.sock.end();
                this.isConnected = false;
                console.log('📱 Conexión WhatsApp cerrada');
            }
        } catch (error) {
            console.error('Error cerrando conexión:', error);
        }
    }

    // ===========================================
    // MÉTODOS REST API (mantienen la misma interfaz)
    // ===========================================

    /**
     * Obtener lista de conversaciones
     */
    static async getConversations(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;

            let query = `
                SELECT 
                    c.*,
                    p.FirstName + ' ' + p.LastName as PatientName,
                    p.Phone as PatientPhone,
                    (SELECT TOP 1 m.MessageText 
                     FROM WhatsAppMessages m 
                     WHERE m.ConversationID = c.ConversationID 
                     ORDER BY m.SentDate DESC) as LastMessage,
                    (SELECT TOP 1 m.SentDate 
                     FROM WhatsAppMessages m 
                     WHERE m.ConversationID = c.ConversationID 
                     ORDER BY m.SentDate DESC) as LastMessageDate
                FROM WhatsAppConversations c
                LEFT JOIN DPatients p ON c.PatientID = p.PatientID
                ORDER BY c.LastActivityDate DESC
                OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
            `;

            const result = await dbConfig.executeQuery(query, [
                { name: 'offset', value: offset },
                { name: 'limit', value: limit }
            ]);

            res.json({
                success: true,
                data: result.recordset,
                pagination: {
                    page,
                    limit,
                    offset
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
     * Obtener conversación específica
     */
    static async getConversation(req, res) {
        try {
            const { id } = req.params;

            const query = `
                SELECT 
                    c.*,
                    p.FirstName + ' ' + p.LastName as PatientName,
                    p.Phone as PatientPhone
                FROM WhatsAppConversations c
                LEFT JOIN DPatients p ON c.PatientID = p.PatientID
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
     * Obtener mensajes de una conversación
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
                    d.FirstName + ' ' + d.LastName as DoctorName
                FROM WhatsAppMessages m
                LEFT JOIN DDoctors d ON m.DoctorID = d.DoctorID
                WHERE m.ConversationID = @id
                ORDER BY m.SentDate DESC
                OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
            `;

            const result = await dbConfig.executeQuery(query, [
                { name: 'id', value: parseInt(id) },
                { name: 'offset', value: offset },
                { name: 'limit', value: limit }
            ]);

            res.json({
                success: true,
                data: result.recordset.reverse(), // Ordenar cronológicamente
                pagination: {
                    page,
                    limit,
                    offset
                }
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
     * Enviar mensaje (adaptado para Baileys)
     */
    static async sendMessage(req, res) {
        try {
            const { conversationId, text, type, templateId } = req.body;
            const doctorId = req.user?.doctorId || 1;

            // Obtener datos de la conversación
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

            // Obtener número de teléfono del paciente
            const patient = await dbConfig.executeQuery(
                'SELECT Phone, MobilePhone FROM DPatients WHERE PatientID = @id',
                [{ name: 'id', value: patientId }]
            );

            if (patient.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Paciente no encontrado'
                });
            }

            const patientPhone = patient.recordset[0].MobilePhone || patient.recordset[0].Phone;

            // Enviar mensaje usando Baileys
            const whatsappController = new WhatsAppBaileysController();
            const result = await whatsappController.sendMessageToPatient(patientPhone, text);

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: 'Error enviando mensaje',
                    details: result.error
                });
            }

            // Guardar mensaje en base de datos
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
                { name: 'messageText', value: text },
                { name: 'type', value: type || 'text' }
            ]);

            res.status(201).json({
                success: true,
                data: {
                    messageId: messageResult.recordset[0].MessageID,
                    conversationId,
                    text,
                    type: type || 'text',
                    sentAt: new Date().toISOString(),
                    whatsappMessageId: result.messageId
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
     * Obtener estado de conexión WhatsApp
     */
    static async getConnectionStatus(req, res) {
        try {
            const whatsappController = new WhatsAppBaileysController();
            const status = whatsappController.getConnectionStatus();
            
            res.json({
                success: true,
                data: status
            });
            
        } catch (error) {
            console.error('Error obteniendo estado de conexión:', error);
            res.status(500).json({
                success: false,
                error: 'Error obteniendo estado',
                code: 'GET_CONNECTION_STATUS_ERROR'
            });
        }
    }

    /**
     * Generar código QR para conectar WhatsApp
     */
    static async getQrCode(req, res) {
        try {
            const whatsappController = new WhatsAppBaileysController();
            const status = whatsappController.getConnectionStatus();
            
            if (!status.qrCode) {
                return res.status(400).json({
                    success: false,
                    error: 'No hay código QR disponible. Inicia la conexión primero.'
                });
            }
            
            // Generar QR como imagen base64
            qrcode.generate(status.qrCode, (err, code) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        error: 'Error generando código QR'
                    });
                }
                
                res.json({
                    success: true,
                    data: {
                        qrCode: status.qrCode,
                        qrImage: code
                    }
                });
            });
            
        } catch (error) {
            console.error('Error generando código QR:', error);
            res.status(500).json({
                success: false,
                error: 'Error generando código QR',
                code: 'QR_CODE_ERROR'
            });
        }
    }
}

// Instancia global del controlador
const whatsappBaileys = new WhatsAppBaileysController();

// Auto-inicializar cuando se carga el módulo
if (process.env.NODE_ENV === 'development') {
    whatsappBaileys.initialize().catch(console.error);
}

module.exports = WhatsAppBaileysController;