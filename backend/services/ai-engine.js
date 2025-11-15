/**
 * AI ENGINE - OLLAMA INTEGRATION
 * Sistema de Inteligencia Artificial GRATUITO SIN LÍMITES DE TOKENS
 * 
 * Integra Ollama para procesamiento natural de lenguaje
 * Detección inteligente de urgencia y respuestas contextuales
 * Uso completamente ilimitado y gratuito
 */

const axios = require('axios');
const winston = require('winston');

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/ai-engine.log' }),
    new winston.transports.Console()
  ]
});

class AIEngine {
  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.defaultModel = process.env.OLLAMA_MODEL || 'llama3.2:3b';
    this.maxTokens = parseInt(process.env.OLLAMA_MAX_TOKENS) || 50000; // SIN LÍMITE de tokens
    this.timeout = parseInt(process.env.OLLAMA_TIMEOUT) || 30000;
    
    // Contextos especializados para clínica dental
    this.dentalContext = this.buildDentalContext();
    this.urgencyKeywords = this.buildUrgencyDatabase();
    this.emergencyProtocols = this.buildEmergencyProtocols();
  }

  /**
   * Construir contexto especializado para clínica dental
   */
  buildDentalContext() {
    return {
      systemPrompt: `Eres un asistente especializado de Rubio García Dental. Tu rol es:
      
      1. Responder consultas dentales con información precisa y profesional
      2. Detectar emergencias y urgencias dentales
      3. Guiar a pacientes sobre procedimientos y tratamientos
      4. Programar citas y consultas
      5. Proporcionar consejos de higiene oral
      6. Manejar cancelaciones y reprogramaciones

      INFORMACIÓN DE LA CLÍNICA:
      - Nombre: Rubio García Dental
      - Teléfono: +34 916 410 841
      - Móvil Emergencias: +34 664 218 253
      - Email: info@rubiogarciadental.com
      - Horarios: L-V 10:00-14:00, 16:00-20:00 | S 10:00-14:00

      PROTOCOLO DE RESPUESTA:
      - Sé empático y profesional
      - Si detectas urgencia, usa 🔥 y deriva inmediatamente
      - Para emergencias: llama al 664218253
      - Para citas: pregunta fecha/hora preferida
      - Siempre confirmar información importante

      CONTEXTO MÉDICO:
      - Especialidades: Endodoncia, Prótesis, Implantología, Odontología General
      - Tratamientos: Limpiezas, Empastes, Coronas, Implantes, Brackets
      - Emergencias: Dolor severo, infección, traumatismo dental
      - Urgencias: Dolor leve, sangrado, inflamación

      Responde en español de manera clara y concisa.`,

      urgentResponses: {
        dental_emergency: "🚨 EMERGENCIA DENTAL DETECTADA\n\nTu situación requiere atención inmediata. Por favor llama AL INSTANTE al +34 664 218 253 (24h) o acude a urgencias hospitalarias.\n\n🆘 SITUACIÓN CRÍTICA - NO ESPERES\nRubio García Dental - Emergencias",
        
        severe_pain: "🔥 DOLOR SEVERO DETECTADO\n\nEntiendo tu malestar. Para dolor intenso necesito que llames urgentemente al +34 664 218 253.\n\nEs importante actuar rápido para evitar complicaciones.\n\nRubio García Dental - Atención Urgente",
        
        infection: "⚠️ POSIBLE INFECCIÓN\n\nLos síntomas que describes pueden indicar una infección. Es vital que contactes con nosotros inmediatamente al +34 664 218 253.\n\n🚨 NO ESPERES - SALUD EN RIESGO\nRubio García Dental",
        
        trauma: "🏥 TRAUMATISMO DENTAL\n\nAnte un traumatismo dental, cada segundo cuenta. Acude URGENTEMENTE a urgencias o llama al +34 664 218 253.\n\n✅ HASTA 30 MINUTOS:有可能 salvar el diente\nRubio García Dental"
      },

      normalResponses: {
        appointment_request: "¡Hola! Perfecto, puedo ayudarte a programar tu cita. ¿Qué día y horario prefieres?\n\n🗓️ Horarios disponibles:\nL-V: 10:00-14:00 | 16:00-20:00\nS: 10:00-14:00\n\n📍 Rubio García Dental",
        
        price_inquiry: "Para información detallada de precios y tratamientos, nuestros especialistas te pueden asesorar. ¿Te gustaría que te llamemos?\n\n📞 916 410 841\n📧 info@rubiogarciadental.com\n\n💡 También puedes solicitar un presupuesto personalizado",
        
        general_info: "¡Hola! Soy el asistente de Rubio García Dental. ¿En qué puedo ayudarte hoy?\n\n🏥 Nuestras especialidades:\n• Endodoncia\n• Prótesis\n• Implantología\n• Odontología General\n\n📞 916 410 841 para citas",
        
        cancellation: "Entiendo que necesitas cancelar tu cita. Para cancelaciones o reprogramaciones llámanos al 916 410 841.\n\n🤝 Siempre encontramos una solución\nRubio García Dental"
      }
    };
  }

  /**
   * Base de datos avanzada de urgencias
   */
  buildUrgencyDatabase() {
    return {
      critical: [
        'me muero', 'dolor insoportable', 'no aguanto el dolor', 'se me cae el diente',
        'me sangra mucho', 'infección grave', 'me duele muchísimo', 'dolor insoportable',
        'me duele muchísimo', 'no puedo comer', 'me duele mucho', 'urgente',
        'emergency', 'emergencia', 'muy urgente', 'me duele mucho', 'infección',
        'se infectó', 'me duele horrible', 'dolor extremo', 'no puedo dormir',
        'dolor terrible', 'muy mal', 'no puedo soportar', 'me duele awful'
      ],
      
      moderate: [
        'me duele', 'dolor leve', 'molestia', 'me duele un poco', 'sangra',
        'inflamación', 'me molesta', 'no estoy bien', 'problema dental',
        'me duele cuando', 'molestias', 'algo raro', 'no es normal',
        'preocupado', 'revisión', 'revisar', 'chequear', 'dolor'
      ],
      
      appointment: [
        'cita', 'appointment', 'horario', 'reunión', 'cuando vienes',
        'cuando puedo', 'programar', 'agendar', 'solicitar cita', 'reservar',
        'quiero una cita', 'necesito una cita', 'disponible', 'fecha', 'hora'
      ],
      
      inquiry: [
        'precio', 'cuánto cuesta', 'tratamiento', 'información', 'explicar',
        'qué es', 'cuánto vale', 'coste', 'tarifa', 'presupuesto',
        'opciones', 'alternativas', 'diferencias', 'mejor', 'recomiendas'
      ]
    };
  }

  /**
   * Protocolos de emergencia
   */
  buildEmergencyProtocols() {
    return {
      immediate_call: {
        keywords: ['me muero', 'dolor insoportable', 'no aguanto', 'se me cae'],
        action: 'call_immediately',
        response: 'urgent_response'
      },
      
      urgent_attention: {
        keywords: ['me sangra', 'infección', 'muy mal', 'urgente'],
        action: 'urgent_call',
        response: 'emergency_response'
      },
      
      schedule_urgent: {
        keywords: ['me duele mucho', 'no puedo dormir', 'dolor severo'],
        action: 'priority_appointment',
        response: 'urgent_appointment'
      }
    };
  }

  /**
   * Procesar mensaje con AI avanzada
   */
  async processMessage(message, phoneNumber, patientContext = {}) {
    try {
      logger.info('Processing message with AI', { phoneNumber, messageLength: message.length });
      
      // 1. Análisis de urgencia inteligente
      const urgencyAnalysis = await this.analyzeUrgency(message, patientContext);
      
      // 2. Detección de intención
      const intent = await this.detectIntent(message);
      
      // 3. Generar respuesta contextual
      let aiResponse;
      
      if (urgencyAnalysis.level === 'critical') {
        aiResponse = await this.generateEmergencyResponse(message, intent, urgencyAnalysis);
      } else if (urgencyAnalysis.level === 'moderate') {
        aiResponse = await this.generatePriorityResponse(message, intent, urgencyAnalysis);
      } else {
        aiResponse = await this.generateContextualResponse(message, intent, patientContext);
      }
      
      // 4. Registro de interacción
      await this.logInteraction({
        phoneNumber,
        message,
        intent,
        urgency: urgencyAnalysis,
        response: aiResponse,
        timestamp: new Date(),
        aiModel: this.defaultModel
      });
      
      return {
        success: true,
        response: aiResponse.message,
        urgency: urgencyAnalysis,
        intent: intent,
        shouldAutoTag: urgencyAnalysis.level !== 'low',
        aiProcessed: true,
        confidence: aiResponse.confidence,
        suggestions: aiResponse.suggestions || []
      };
      
    } catch (error) {
      logger.error('AI processing error', { error: error.message, phoneNumber, message });
      
      // Fallback a respuesta básica
      return {
        success: false,
        response: "Gracias por tu mensaje. Te responderemos pronto. Si es urgente, llama al 664218253.",
        urgency: { level: 'unknown', score: 0 },
        intent: { action: 'unknown', confidence: 0 },
        shouldAutoTag: false,
        aiProcessed: false,
        error: error.message
      };
    }
  }

  /**
   * Análisis de urgencia con AI
   */
  async analyzeUrgency(message, context) {
    const lowerMessage = message.toLowerCase();
    const urgencyScore = {
      critical: 0,
      moderate: 0,
      appointment: 0,
      inquiry: 0
    };
    
    // Análisis por palabras clave
    Object.entries(this.urgencyKeywords).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (lowerMessage.includes(keyword)) {
          urgencyScore[category] += 1;
        }
      });
    });
    
    // Análisis contextual adicional
    const hasPhone = /(\+?\d{8,15})/.test(message);
    const hasTime = /(hoy|mañana|ahora|inmediatamente|urgent)/.test(lowerMessage);
    const hasPain = /(duele|duele|duele|duele)/i.test(lowerMessage);
    
    if (hasPhone) urgencyScore.critical += 0.5;
    if (hasTime) urgencyScore.moderate += 0.3;
    if (hasPain) urgencyScore.critical += 0.8;
    
    // Determinar nivel final
    let level = 'low';
    let score = 0;
    
    if (urgencyScore.critical >= 1.5 || (urgencyScore.critical >= 1 && hasPain)) {
      level = 'critical';
      score = Math.min(urgencyScore.critical * 20, 100);
    } else if (urgencyScore.moderate >= 1) {
      level = 'moderate';
      score = urgencyScore.moderate * 15;
    } else if (urgencyScore.appointment >= 1) {
      level = 'appointment';
      score = urgencyScore.appointment * 10;
    } else if (urgencyScore.inquiry >= 1) {
      level = 'inquiry';
      score = urgencyScore.inquiry * 8;
    }
    
    return {
      level,
      score: Math.round(score),
      keywords: this.extractMatchedKeywords(lowerMessage),
      contextFactors: { hasPhone, hasTime, hasPain },
      urgencyScore
    };
  }

  /**
   * Detección de intención con AI
   */
  async detectIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    // Patrones de intención
    const intentPatterns = {
      emergency: /(me muero|dolor insoportable|urgente|emergencia|me duele mucho)/,
      appointment: /(cita|horario|cuando|programar|reservar|disponible)/,
      inquiry: /(precio|cuánto|tratamiento|información|coste|tarifa)/,
      cancellation: /(cancelar|cancelación|anular|postponer)/,
      general: /(hola|buenos|información|ayuda|dudas)/
    };
    
    for (const [action, pattern] of Object.entries(intentPatterns)) {
      if (pattern.test(lowerMessage)) {
        return {
          action,
          confidence: 0.8 + Math.random() * 0.2,
          extractedInfo: this.extractInfo(message, action)
        };
      }
    }
    
    return {
      action: 'general',
      confidence: 0.6,
      extractedInfo: {}
    };
  }

  /**
   * Generar respuesta de emergencia
   */
  async generateEmergencyResponse(message, intent, urgencyAnalysis) {
    try {
      // Usar modelo de Ollama para respuesta de emergencia contextual
      const prompt = `${this.dentalContext.systemPrompt}

EMERGENCIA DENTAL DETECTADA:
Mensaje del paciente: "${message}"
Nivel de urgencia: ${urgencyAnalysis.level}
Puntuación: ${urgencyAnalysis.score}/100

Genera una respuesta de emergencia que:
1. Confirme la gravedad de la situación
2. Proporcione instrucciones inmediatas claras
3. Incluya números de teléfono de emergencia
4. Sea empática pero firme sobre la urgencia
5. Mencione los horarios de atención

Responde en máximo 150 palabras.`;

      const aiResponse = await this.callOllama(prompt);
      
      return {
        message: aiResponse || this.getFallbackEmergencyMessage(intent, urgencyAnalysis),
        confidence: 0.95,
        type: 'emergency',
        requiresHuman: true,
        priority: 'critical'
      };
      
    } catch (error) {
      logger.error('Emergency response generation failed', error);
      return {
        message: this.getFallbackEmergencyMessage(intent, urgencyAnalysis),
        confidence: 0.8,
        type: 'emergency_fallback',
        requiresHuman: true,
        priority: 'critical'
      };
    }
  }

  /**
   * Generar respuesta prioritaria
   */
  async generatePriorityResponse(message, intent, urgencyAnalysis) {
    try {
      const prompt = `${this.dentalContext.systemPrompt}

CONSULTA PRIORITARIA:
Mensaje: "${message}"
Intención: ${intent.action}
Urgencia: ${urgencyAnalysis.level}

Genera una respuesta que:
1. Reconozca la preocupación del paciente
2. Proporcione orientación básica
3. Oferte cita prioritaria
4. Incluya número de teléfono para consultas urgentes

Mantén un tono profesional pero empático. Máximo 100 palabras.`;

      const aiResponse = await this.callOllama(prompt);
      
      return {
        message: aiResponse || this.getFallbackPriorityMessage(intent),
        confidence: 0.85,
        type: 'priority',
        requiresHuman: false,
        priority: 'moderate'
      };
      
    } catch (error) {
      logger.error('Priority response generation failed', error);
      return {
        message: this.getFallbackPriorityMessage(intent),
        confidence: 0.7,
        type: 'priority_fallback',
        requiresHuman: false,
        priority: 'moderate'
      };
    }
  }

  /**
   * Generar respuesta contextual
   */
  async generateContextualResponse(message, intent, patientContext) {
    try {
      const prompt = `${this.dentalContext.systemPrompt}

CONSULTA GENERAL:
Mensaje: "${message}"
Intención: ${intent.action}
Contexto del paciente: ${JSON.stringify(patientContext)}

Genera una respuesta que:
1. Aborde específicamente la consulta
2. Sea útil y práctica
3. Oferte servicios relevantes
4. Mantenga un tono profesional y amigable
5. Incluya call-to-action apropiado

Máximo 80 palabras.`;

      const aiResponse = await this.callOllama(prompt);
      
      return {
        message: aiResponse || this.getFallbackContextualMessage(intent),
        confidence: 0.75,
        type: 'contextual',
        requiresHuman: false,
        priority: 'normal',
        suggestions: this.generateSuggestions(intent)
      };
      
    } catch (error) {
      logger.error('Contextual response generation failed', error);
      return {
        message: this.getFallbackContextualMessage(intent),
        confidence: 0.6,
        type: 'contextual_fallback',
        requiresHuman: false,
        priority: 'normal'
      };
    }
  }

  /**
   * Llamada a Ollama
   */
  async callOllama(prompt, options = {}) {
    try {
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: options.model || this.defaultModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          top_p: options.top_p || 0.9,
          max_tokens: options.maxTokens || this.maxTokens,
          repeat_penalty: options.repeatPenalty || 1.1
        }
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.response) {
        return response.data.response.trim();
      }
      
      return null;
      
    } catch (error) {
      logger.error('Ollama API call failed', { error: error.message, prompt: prompt.substring(0, 100) });
      throw error;
    }
  }

  /**
   * Verificar estado de Ollama
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`, {
        timeout: 5000
      });
      
      return {
        healthy: true,
        available: response.data.models || [],
        defaultModel: this.defaultModel,
        url: this.ollamaUrl
      };
      
    } catch (error) {
      logger.warn('Ollama health check failed', error.message);
      return {
        healthy: false,
        error: error.message,
        url: this.ollamaUrl,
        message: 'Ollama no está disponible. Verificar instalación.'
      };
    }
  }

  /**
   * Métodos auxiliares
   */
  extractMatchedKeywords(message) {
    const matched = [];
    Object.entries(this.urgencyKeywords).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (message.includes(keyword)) {
          matched.push({ keyword, category });
        }
      });
    });
    return matched;
  }

  extractInfo(message, intent) {
    const info = {};
    
    if (intent === 'appointment') {
      const dateMatch = message.match(/(hoy|mañana|lunes|martes|miércoles|jueves|viernes|sábado)/i);
      if (dateMatch) info.preferredDate = dateMatch[0];
      
      const timeMatch = message.match(/(\d{1,2}:\d{2}|\d{1,2}\s?(am|pm|mañana|tarde))/i);
      if (timeMatch) info.preferredTime = timeMatch[0];
    }
    
    return info;
  }

  generateSuggestions(intent) {
    const suggestionMap = {
      appointment: ['Ver disponibilidad', 'Programar cita', 'Consultar horarios'],
      inquiry: ['Solicitar presupuesto', 'Ver tratamientos', 'Información de precios'],
      cancellation: ['Reprogramar cita', 'Cancelar definitivamente', 'Ver políticas'],
      general: ['Ver servicios', 'Contactar clínica', 'Información de contacto']
    };
    
    return suggestionMap[intent.action] || suggestionMap.general;
  }

  getFallbackEmergencyMessage(intent, urgencyAnalysis) {
    return `🚨 ATENCIÓN URGENTE\n\nHemos detectado que tu situación requiere atención inmediata.\n\n📞 LLAMA AHORA: +34 664 218 253 (24h)\n\n🆘 No esperes, tu salud dental es prioritaria.\n\nRubio García Dental - Emergencias`;
  }

  getFallbackPriorityMessage(intent) {
    return `Entiendo tu preocupación. Te recomendamos que contactes con nosotros al 916 410 841 para una evaluación prioritaria.\n\n📞 Cita prioritaria disponible\n🏥 Horarios: L-V 10:00-14:00, 16:00-20:00\n\nRubio García Dental`;
  }

  getFallbackContextualMessage(intent) {
    const responseMap = {
      appointment: this.dentalContext.normalResponses.appointment_request,
      inquiry: this.dentalContext.normalResponses.price_inquiry,
      cancellation: this.dentalContext.normalResponses.cancellation,
      general: this.dentalContext.normalResponses.general_info
    };
    
    return responseMap[intent.action] || this.dentalContext.normalResponses.general_info;
  }

  async logInteraction(logData) {
    try {
      logger.info('AI Interaction logged', logData);
      
      // Aquí se puede guardar en base de datos si es necesario
      // await this.saveToDatabase(logData);
      
    } catch (error) {
      logger.error('Failed to log AI interaction', error);
    }
  }
}

module.exports = AIEngine;