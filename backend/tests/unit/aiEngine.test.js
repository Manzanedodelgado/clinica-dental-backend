/**
 * TESTS PARA AI ENGINE
 * Pruebas completas del sistema de Inteligencia Artificial
 * 
 * Tests de integración, funcionalidad y performance
 */

const AIEngine = require('../../services/ai-engine');

// Mock de axios para tests
jest.mock('axios');

describe('AI Engine Tests', () => {
  let aiEngine;
  
  beforeEach(() => {
    // Configurar variables de entorno de test
    process.env.OLLAMA_URL = 'http://localhost:11434';
    process.env.OLLAMA_MODEL = 'llama3.2:3b';
    process.env.OLLAMA_MAX_TOKENS = '1000';
    
    aiEngine = new AIEngine();
  });

  describe('Inicialización', () => {
    test('debería crear instancia de AI Engine correctamente', () => {
      expect(aiEngine).toBeInstanceOf(AIEngine);
      expect(aiEngine.ollamaUrl).toBe('http://localhost:11434');
      expect(aiEngine.defaultModel).toBe('llama3.2:3b');
      expect(aiEngine.maxTokens).toBe(1000);
    });

    test('debería configurar contexto dental correctamente', () => {
      expect(aiEngine.dentalContext).toBeDefined();
      expect(aiEngine.dentalContext.systemPrompt).toContain('Rubio García Dental');
      expect(aiEngine.dentalContext.systemPrompt).toContain('endodoncia');
    });

    test('debería tener base de datos de urgencias', () => {
      expect(aiEngine.urgencyKeywords).toBeDefined();
      expect(aiEngine.urgencyKeywords.critical).toContain('me muero');
      expect(aiEngine.urgencyKeywords.moderate).toContain('me duele');
      expect(aiEngine.urgencyKeywords.appointment).toContain('cita');
      expect(aiEngine.urgencyKeywords.inquiry).toContain('precio');
    });
  });

  describe('Análisis de Urgencia', () => {
    test('debería detectar urgencia crítica correctamente', async () => {
      const result = await aiEngine.analyzeUrgency('Me muero de dolor, es insoportable', {});
      
      expect(result.level).toBe('critical');
      expect(result.score).toBeGreaterThan(70);
      expect(result.keywords).toEqual(expect.arrayContaining([
        expect.objectContaining({ keyword: 'me muere', category: 'critical' })
      ]));
    });

    test('debería detectar urgencia moderada', async () => {
      const result = await aiEngine.analyzeUrgency('Me duele un poco la muela', {});
      
      expect(result.level).toBe('moderate');
      expect(result.score).toBeGreaterThan(10);
      expect(result.keywords).toEqual(expect.arrayContaining([
        expect.objectContaining({ keyword: 'me duele', category: 'moderate' })
      ]));
    });

    test('debería detectar solicitud de cita', async () => {
      const result = await aiEngine.analyzeUrgency('Quiero una cita para revisión', {});
      
      expect(result.level).toBe('appointment');
      expect(result.keywords).toEqual(expect.arrayContaining([
        expect.objectContaining({ keyword: 'cita', category: 'appointment' })
      ]));
    });

    test('debería detectar consulta de precios', async () => {
      const result = await aiEngine.analyzeUrgency('Cuánto cuesta un empaste', {});
      
      expect(result.level).toBe('inquiry');
      expect(result.keywords).toEqual(expect.arrayContaining([
        expect.objectContaining({ keyword: 'cuánto', category: 'inquiry' })
      ]));
    });

    test('debería manejar mensaje genérico sin urgencia', async () => {
      const result = await aiEngine.analyzeUrgency('Hola, buenos días', {});
      
      expect(result.level).toBe('low');
      expect(result.score).toBe(0);
    });

    test('debería combinar factores contextuales', async () => {
      const result = await aiEngine.analyzeUrgency('Me duele mucho ahora urgente 664218253', {});
      
      expect(result.level).toBe('critical');
      expect(result.contextFactors.hasPhone).toBe(true);
      expect(result.contextFactors.hasTime).toBe(true);
      expect(result.contextFactors.hasPain).toBe(true);
    });
  });

  describe('Detección de Intención', () => {
    test('debería detectar intención de emergencia', async () => {
      const result = await aiEngine.detectIntent('me muero de dolor urgente');
      
      expect(result.action).toBe('emergency');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('debería detectar intención de cita', async () => {
      const result = await aiEngine.detectIntent('quiero una cita para mañana');
      
      expect(result.action).toBe('appointment');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.extractedInfo.preferredDate).toBe('mañana');
    });

    test('debería detectar intención de consulta', async () => {
      const result = await aiEngine.detectIntent('cuánto cuesta un implante');
      
      expect(result.action).toBe('inquiry');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('debería detectar intención de cancelación', async () => {
      const result = await aiEngine.detectIntent('quiero cancelar mi cita');
      
      expect(result.action).toBe('cancellation');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('debería manejar mensaje genérico', async () => {
      const result = await aiEngine.detectIntent('hola buenas');
      
      expect(result.action).toBe('general');
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Procesamiento de Mensaje Completo', () => {
    test('debería procesar mensaje de emergencia completo', async () => {
      const mockOllamaResponse = 'Esta es una emergencia dental que requiere atención inmediata. Por favor llame al 664218253.';
      
      // Mock axios para simular respuesta de Ollama
      const axios = require('axios');
      axios.post.mockResolvedValue({ data: { response: mockOllamaResponse } });
      
      const result = await aiEngine.processMessage('Me muero de dolor, no aguanto más', '+34612345678');
      
      expect(result.success).toBe(true);
      expect(result.urgency.level).toBe('critical');
      expect(result.intent.action).toBe('emergency');
      expect(result.aiProcessed).toBe(true);
      expect(result.shouldAutoTag).toBe(true);
      expect(result.response).toBe(mockOllamaResponse);
    });

    test('debería procesar mensaje de cita', async () => {
      const mockOllamaResponse = 'Perfecto, puedo ayudarte a programar tu cita. ¿Qué día prefieres?';
      
      const axios = require('axios');
      axios.post.mockResolvedValue({ data: { response: mockOllamaResponse } });
      
      const result = await aiEngine.processMessage('quiero una cita para la próxima semana', '+34612345678');
      
      expect(result.success).toBe(true);
      expect(result.intent.action).toBe('appointment');
      expect(result.aiProcessed).toBe(true);
    });

    test('debería manejar fallo de Ollama gracefully', async () => {
      const axios = require('axios');
      axios.post.mockRejectedValue(new Error('Ollama no disponible'));
      
      const result = await aiEngine.processMessage('hola', '+34612345678');
      
      expect(result.success).toBe(true); // Debe retornar respuesta de fallback
      expect(result.aiProcessed).toBe(false);
      expect(result.response).toContain('Gracias por tu mensaje');
    });

    test('debería incluir contexto del paciente', async () => {
      const patientContext = {
        name: 'Juan Pérez',
        lastAppointment: '2024-01-15',
        totalAppointments: 5,
        lastTreatment: 'limpieza'
      };
      
      const mockOllamaResponse = 'Hola Juan, veo que tuviste una limpieza reciente.';
      
      const axios = require('axios');
      axios.post.mockResolvedValue({ data: { response: mockOllamaResponse } });
      
      const result = await aiEngine.processMessage('hola', '+34612345678', patientContext);
      
      expect(result.success).toBe(true);
      // El prompt debería incluir el contexto del paciente
      expect(axios.post).toHaveBeenCalled();
      const prompt = axios.post.mock.calls[0][1].prompt;
      expect(prompt).toContain('Juan Pérez');
    });
  });

  describe('Generación de Respuestas', () => {
    test('debería generar respuesta de emergencia', async () => {
      const mockOllamaResponse = 'Esta es una emergencia dental que requiere atención inmediata. Por favor llame al 664218253 URGENTEMENTE.';
      
      const axios = require('axios');
      axios.post.mockResolvedValue({ data: { response: mockOllamaResponse } });
      
      const urgencyAnalysis = { level: 'critical', score: 90 };
      const intent = { action: 'emergency', confidence: 0.9 };
      
      const result = await aiEngine.generateEmergencyResponse('me muero', intent, urgencyAnalysis);
      
      expect(result.message).toBe(mockOllamaResponse);
      expect(result.type).toBe('emergency');
      expect(result.confidence).toBe(0.95);
      expect(result.requiresHuman).toBe(true);
      expect(result.priority).toBe('critical');
    });

    test('debería generar respuesta prioritaria', async () => {
      const mockOllamaResponse = 'Entiendo tu preocupación, te recomiendo que nos llames al 916410841 para una evaluación.';
      
      const axios = require('axios');
      axios.post.mockResolvedValue({ data: { response: mockOllaoResponse } });
      
      const urgencyAnalysis = { level: 'moderate', score: 50 };
      const intent = { action: 'inquiry', confidence: 0.8 };
      
      const result = await aiEngine.generatePriorityResponse('me duele', intent, urgencyAnalysis);
      
      expect(result.type).toBe('priority');
      expect(result.requiresHuman).toBe(false);
      expect(result.priority).toBe('moderate');
    });

    test('debería generar respuesta contextual', async () => {
      const mockOllamaResponse = 'Hola, puedo ayudarte con tu consulta dental. ¿En qué tratamiento estás interesado?';
      
      const axios = require('axios');
      axios.post.mockResolvedValue({ data: { response: mockOllamaResponse } });
      
      const intent = { action: 'inquiry', confidence: 0.7 };
      const patientContext = {};
      
      const result = await aiEngine.generateContextualResponse('información', intent, patientContext);
      
      expect(result.type).toBe('contextual');
      expect(result.requiresHuman).toBe(false);
      expect(result.priority).toBe('normal');
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Verificación de Salud', () => {
    test('debería verificar salud de Ollama correctamente', async () => {
      const axios = require('axios');
      axios.get.mockResolvedValue({ 
        data: { 
          models: [{ name: 'llama3.2:3b' }, { name: 'mistral:7b' }] 
        } 
      });
      
      const result = await aiEngine.checkHealth();
      
      expect(result.healthy).toBe(true);
      expect(result.available).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'llama3.2:3b' })
      ]));
      expect(result.defaultModel).toBe('llama3.2:3b');
      expect(result.url).toBe('http://localhost:11434');
    });

    test('debería manejar fallo de verificación de salud', async () => {
      const axios = require('axios');
      axios.get.mockRejectedValue(new Error('Ollama no disponible'));
      
      const result = await aiEngine.checkHealth();
      
      expect(result.healthy).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.message).toContain('Ollama no está disponible');
    });
  });

  describe('Métodos Auxiliares', () => {
    test('debería extraer palabras clave correctamente', () => {
      const message = 'me duele mucho y es urgente';
      const keywords = aiEngine.extractMatchedKeywords(message);
      
      expect(keywords).toEqual(expect.arrayContaining([
        expect.objectContaining({ keyword: 'me duele', category: 'moderate' }),
        expect.objectContaining({ keyword: 'urgente', category: 'critical' })
      ]));
    });

    test('debería extraer información de intención', () => {
      const message = 'quiero una cita para mañana a las 10';
      const info = aiEngine.extractInfo(message, { action: 'appointment' });
      
      expect(info.preferredDate).toBe('mañana');
      expect(info.preferredTime).toBe('10');
    });

    test('debería generar sugerencias apropiadas', () => {
      const suggestions = aiEngine.generateSuggestions({ action: 'inquiry' });
      
      expect(suggestions).toEqual(expect.arrayContaining([
        'Solicitar presupuesto',
        'Ver tratamientos',
        'Información de precios'
      ]));
    });

    test('debería usar respuestas de fallback', () => {
      const emergencyMsg = aiEngine.getFallbackEmergencyMessage({ action: 'emergency' }, { level: 'critical' });
      const priorityMsg = aiEngine.getFallbackPriorityMessage({ action: 'appointment' });
      const contextualMsg = aiEngine.getFallbackContextualMessage({ action: 'general' });
      
      expect(emergencyMsg).toContain('664218253');
      expect(emergencyMsg).toContain('🚨 ATENCIÓN URGENTE');
      
      expect(priorityMsg).toContain('916 410 841');
      expect(priorityMsg).toContain('cita prioritaria');
      
      expect(contextualMsg).toContain('Rubio García Dental');
    });
  });
});

describe('AI Engine Integration Tests', () => {
  test('debería integrar con sistema de conversaciones', async () => {
    const aiEngine = new AIEngine();
    
    // Mock del entorno
    process.env.CLINIC_PHONE = '916410841';
    process.env.CLINIC_MOBILE = '664218253';
    
    const result = await aiEngine.processMessage('tengo un dolor terrible', '+34612345678', {
      name: 'Juan',
      totalAppointments: 3
    });
    
    expect(result.success).toBe(true);
    expect(result.urgency.level).toBe('critical');
    expect(result.intent.action).toBe('emergency');
  });

  test('debería registrar interacción correctamente', async () => {
    const aiEngine = new AIEngine();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    await aiEngine.logInteraction({
      phoneNumber: '+34612345678',
      message: 'test message',
      intent: { action: 'general' },
      urgency: { level: 'low' },
      response: 'test response'
    });
    
    // Verificar que se registra la interacción
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});

// Tests de Performance
describe('AI Engine Performance Tests', () => {
  test('debería procesar mensajes en tiempo razonable', async () => {
    const aiEngine = new AIEngine();
    const startTime = Date.now();
    
    // Mock de respuesta rápida
    const axios = require('axios');
    axios.post.mockResolvedValue({ data: { response: 'Respuesta rápida' } });
    
    await aiEngine.processMessage('mensaje de prueba', '+34612345678');
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    // No debe tomar más de 5 segundos (ajustable según requisitos)
    expect(processingTime).toBeLessThan(5000);
  });

  test('debería manejar múltiples mensajes concurrentes', async () => {
    const aiEngine = new AIEngine();
    const axios = require('axios');
    axios.post.mockResolvedValue({ data: { response: 'Respuesta' } });
    
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(aiEngine.processMessage(`mensaje ${i}`, `+3461234567${i}`));
    }
    
    const results = await Promise.all(promises);
    
    results.forEach(result => {
      expect(result.success).toBe(true);
      expect(result.aiProcessed).toBe(true);
    });
  });
});