/**
 * SERVICIO DE WHATSAPP ACTUALIZADO
 * Integración con AI Engine y Baileys
 * 
 * Maneja el envío de mensajes y procesamiento automático
 * con el nuevo sistema de AI real
 */

const { WhatsAppWebSocket } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const path = require('path');
const winston = require('winston');
const moment = require('moment');
const AIEngine = require('./ai-engine');

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/whatsapp-service.log' }),
    new winston.transports.Console()
  ]
});

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.aiEngine = new AIEngine();
    this.phoneNumber = process.env.WHATSAPP_PHONE_NUMBER;
    this.sessionPath = path.join(__dirname, '../sessions');
    this.sessionName = process.env.WHATSAPP_SESSION_NAME || 'clinica-dental-session';
    
    // Asegurar que el directorio de sesiones existe
    fs.ensureDirSync(this.sessionPath);
  }

  /**
   * Inicializar servicio de WhatsApp
   */
  async initialize() {
    try {
      logger.info('Inicializando servicio de WhatsApp con AI Engine');
      
      // Configurar cliente Baileys
      this.client = new WhatsAppWebSocket({
        auth: {
          creds: await this.loadAuthCredentials(),
          keys: await this.loadAuthKeys()
        },
        defaultQueryTimeoutMs: 0,
        connectTimeoutMs: 60000,
        defaultRetryLimit: 5,
        keepAliveIntervalMs: 10000,
        browser: ['Chrome', '112.0', '1615']
      });

      // Eventos del cliente
      this.setupEventHandlers();
      
      // Conectar
      await this.connect();
      
      logger.info('Servicio de WhatsApp inicializado correctamente');
      
    } catch (error) {
      logger.error('Error inicializando servicio de WhatsApp:', error);
      throw error;
    }
  }

  /**
   * Configurar manejadores de eventos
   */
  setupEventHandlers() {
    // Conexión establecida
    this.client.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update;
      
      if (connection === 'open') {
        this.isConnected = true;
        logger.info('WhatsApp conectado exitosamente');
      } else if (connection === 'close') {
        this.isConnected = false;
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        
        if (shouldReconnect) {
          logger.info('Reconectando WhatsApp...');
          setTimeout(() => this.connect(), 5000);
        } else {
          logger.error('Sesión de WhatsApp cerrada. Escanear QR nuevamente.');
        }
      }
    });

    // Mensajes recibidos
    this.client.ev.on('messages.upsert', async (message) => {
      try {
        const msg = message.messages[0];
        
        if (msg.key.fromMe) return; // Ignorar mensajes propios
        
        const phoneNumber = msg.key.remoteJid;
        const messageText = msg.message?.conversation || msg.message?.extendedText?.text || '';
        
        logger.info('Mensaje recibido', { phoneNumber, messageLength: messageText.length });
        
        // Procesar mensaje con AI Engine
        await this.processIncomingMessage(phoneNumber, messageText, msg);
        
      } catch (error) {
        logger.error('Error procesando mensaje:', error);
      }
    });

    // Sesión guardada
    this.client.ev.on('creds.update', async (creds) => {
      await this.saveAuthCredentials(creds);
    });
  }

  /**
   * Conectar a WhatsApp
   */
  async connect() {
    try {
      await this.client.connect();
    } catch (error) {
      logger.error('Error conectando a WhatsApp:', error);
      throw error;
    }
  }

  /**
   * Procesar mensaje entrante con AI Engine
   */
  async processIncomingMessage(phoneNumber, messageText, messageData) {
    try {
      // Obtener contexto del mensaje
      const context = {
        timestamp: new Date(),
        messageType: this.getMessageType(messageData),
        hasMedia: messageData.message?.imageMessage || messageData.message?.documentMessage,
        originalMessage: messageData
      };

      // Procesar con AI Engine
      const aiResult = await this.aiEngine.processMessage(messageText, phoneNumber, context);
      
      // Guardar en base de datos
      await this.saveMessageToDatabase(phoneNumber, messageText, aiResult, context);
      
      // Enviar respuesta si corresponde
      if (aiResult.success && this.shouldAutoRespond(aiResult)) {
        await this.sendMessage(phoneNumber, aiResult.response);
        
        // Auto-marcar como urgente si es necesario
        if (aiResult.shouldAutoTag && aiResult.urgency?.level === 'critical') {
          await this.markConversationUrgent(phoneNumber, 'Urgencia detectada por AI Engine', 'AI_SYSTEM');
        }
      }
      
      logger.info('Mensaje procesado con AI Engine', {
        phoneNumber,
        aiProcessed: aiResult.aiProcessed,
        urgency: aiResult.urgency?.level,
        intent: aiResult.intent?.action
      });
      
    } catch (error) {
      logger.error('Error procesando mensaje con AI:', error);
    }
  }

  /**
   * Enviar mensaje
   */
  async sendMessage(phoneNumber, message) {
    try {
      if (!this.isConnected) {
        throw new Error('WhatsApp no está conectado');
      }

      // Formatear número si es necesario
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      // Enviar mensaje
      await this.client.sendMessage(formattedNumber, { text: message });
      
      logger.info('Mensaje enviado exitosamente', { phoneNumber: formattedNumber, messageLength: message.length });
      
      return { success: true, messageId: Date.now().toString() };
      
    } catch (error) {
      logger.error('Error enviando mensaje:', error);
      throw error;
    }
  }

  /**
   * Verificar estado de la AI
   */
  async checkAIHealth() {
    try {
      const aiHealth = await this.aiEngine.checkHealth();
      const whatsappStatus = {
        connected: this.isConnected,
        phoneNumber: this.phoneNumber
      };
      
      return {
        success: true,
        ai: aiHealth,
        whatsapp: whatsappStatus,
        timestamp: new Date()
      };
      
    } catch (error) {
      logger.error('Error verificando salud del sistema:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Métodos auxiliares
   */
  
  getMessageType(messageData) {
    if (messageData.message?.conversation) return 'text';
    if (messageData.message?.extendedTextMessage) return 'text_extended';
    if (messageData.message?.imageMessage) return 'image';
    if (messageData.message?.documentMessage) return 'document';
    if (messageData.message?.audioMessage) return 'audio';
    if (messageData.message?.videoMessage) return 'video';
    return 'unknown';
  }

  shouldAutoRespond(aiResult) {
    // No responder a emergencias críticas (requieren llamada telefónica)
    if (aiResult.urgency?.level === 'critical' && aiResult.urgency?.score >= 90) {
      return false;
    }
    
    // Responder si la confianza es suficiente
    return aiResult.confidence >= (parseFloat(process.env.AI_MIN_CONFIDENCE_THRESHOLD) || 0.6);
  }

  formatPhoneNumber(phoneNumber) {
    // Asegurar formato internacional
    if (phoneNumber.includes('@')) {
      return phoneNumber.replace('@s.whatsapp.net', '@c.us');
    }
    return phoneNumber;
  }

  async saveMessageToDatabase(phoneNumber, messageText, aiResult, context) {
    try {
      // Esta función debería integrar con el sistema de conversaciones
      const { handleNewMessage } = require('../controllers/conversation-integration');
      
      const conversation = await handleNewMessage(phoneNumber, messageText, true, context.messageType);
      
      // Si hay resultado de AI, actualizar metadatos
      if (aiResult.success && conversation.conversationId) {
        const { dbConfig } = require('../config/database');
        await dbConfig.executeQuery(`
          UPDATE WhatsAppMessages 
          SET 
            AIAutoReplySent = @aiProcessed,
            AIConfidence = @confidence,
            AIIntent = @intent,
            AIUrgencyLevel = @urgencyLevel,
            AIModel = @model,
            AIProcessedAt = GETDATE()
          WHERE MessageText = @messageText
          AND ConversationID = @conversationId
          AND IsFromPatient = 1
        `, [
          { name: 'messageText', value: messageText },
          { name: 'conversationId', value: conversation.conversationId },
          { name: 'aiProcessed', value: aiResult.aiProcessed ? 1 : 0 },
          { name: 'confidence', value: aiResult.confidence || 0 },
          { name: 'intent', value: aiResult.intent?.action || 'unknown' },
          { name: 'urgencyLevel', value: aiResult.urgency?.level || 'low' },
          { name: 'model', value: aiResult.model || 'ollama' }
        ]);
      }
      
    } catch (error) {
      logger.error('Error guardando mensaje en base de datos:', error);
    }
  }

  async markConversationUrgent(phoneNumber, notes, taggedBy) {
    try {
      const { tagConversationUrgent } = require('../controllers/conversation-integration');
      await tagConversationUrgent(phoneNumber, notes, taggedBy);
    } catch (error) {
      logger.error('Error marcando conversación como urgente:', error);
    }
  }

  async loadAuthCredentials() {
    try {
      const credsPath = path.join(this.sessionPath, `${this.sessionName}_creds.json`);
      if (await fs.pathExists(credsPath)) {
        return await fs.readJSON(credsPath);
      }
    } catch (error) {
      logger.warn('No se pudieron cargar credenciales de sesión:', error);
    }
    return {};
  }

  async loadAuthKeys() {
    try {
      const keysPath = path.join(this.sessionPath, `${this.sessionName}_keys`);
      if (await fs.pathExists(keysPath)) {
        return await fs.readJSON(keysPath);
      }
    } catch (error) {
      logger.warn('No se pudieron cargar claves de sesión:', error);
    }
    return {};
  }

  async saveAuthCredentials(creds) {
    try {
      const credsPath = path.join(this.sessionPath, `${this.sessionName}_creds.json`);
      await fs.writeJSON(credsPath, creds, { spaces: 2 });
    } catch (error) {
      logger.error('Error guardando credenciales:', error);
    }
  }

  /**
   * Cerrar conexión
   */
  async disconnect() {
    try {
      if (this.client) {
        await this.client.disconnect();
        this.isConnected = false;
        logger.info('WhatsApp desconectado');
      }
    } catch (error) {
      logger.error('Error desconectando WhatsApp:', error);
    }
  }
}

// Exportar instancia singleton
module.exports = new WhatsAppService();