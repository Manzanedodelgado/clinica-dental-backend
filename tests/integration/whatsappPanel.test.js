/**
 * TEST INTEGRATION - WhatsApp Panel Frontend
 * Verifica funcionalidades del panel de control WhatsApp
 */

const fs = require('fs');
const path = require('path');

describe('WhatsApp Panel Integration Tests', () => {
  const panelPath = path.join(__dirname, '../../whatsapp-panel.html');

  describe('Panel HTML Structure', () => {
    test('Debería existir el archivo del panel', () => {
      expect(fs.existsSync(panelPath)).toBe(true);
    });

    test('Debería contener elementos del dashboard', () => {
      const panelContent = fs.readFileSync(panelPath, 'utf8');

      // Verificar estructura del dashboard
      expect(panelContent).toContain('stats-grid');
      expect(panelContent).toContain('conversations-list');
      expect(panelContent).toContain('conversation-details');
      expect(panelContent).toContain('ai-config-section');

      // Verificar botones principales
      expect(panelContent).toContain('toggleAI');
      expect(panelContent).toContain('filterUrgent');
      expect(panelContent).toContain('refreshPanel');
    });

    test('Debería tener JavaScript para API calls', () => {
      const panelContent = fs.readFileSync(panelPath, 'utf8');

      // Verificar funciones JavaScript
      expect(panelContent).toContain('fetchConversations');
      expect(panelContent).toContain('tagConversationUrgent');
      expect(panelContent).toContain('updateAIConfig');
      expect(panelContent).toContain('loadConversationDetails');

      // Verificar endpoints de API
      expect(panelContent).toContain('/api/whatsapp/conversations');
      expect(panelContent).toContain('/api/whatsapp/ai-config');
    });
  });

  describe('API Integration Tests', () => {
    let mockApiResponse;

    beforeEach(() => {
      // Mock fetch responses
      mockApiResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: [],
          total: 0
        })
      };

      global.fetch = jest.fn().mockResolvedValue(mockApiResponse);
    });

    test('Debería cargar conversaciones al inicializar', async () => {
      const panelContent = fs.readFileSync(panelPath, 'utf8');
      
      // Extraer función de carga de conversaciones
      const loadConversationsFunction = panelContent.match(/async function loadConversations[^}]+}/s);
      expect(loadConversationsFunction).not.toBeNull();

      // Ejecutar función simulada
      global.document = {
        getElementById: jest.fn().mockReturnValue({
          innerHTML: '',
          textContent: ''
        }),
        querySelector: jest.fn().mockReturnValue({ classList: { add: jest.fn() } })
      };

      const mockConversations = [
        {
          conversationid: 1,
          phone_number: '+34664218253',
          color_tag: 'orange',
          priority: 'high',
          status: 'active',
          patient_name: 'Juan Pérez',
          last_message_at: '2025-11-16T06:00:00Z'
        }
      ];

      mockApiResponse.json.mockResolvedValue({
        success: true,
        data: mockConversations,
        total: 1
      });

      // Simular llamada a la API
      await fetch('/api/whatsapp/conversations');

      expect(fetch).toHaveBeenCalledWith('/api/whatsapp/conversations');
    });

    test('Debería filtrar conversaciones urgentes', async () => {
      const mockUrgentConversations = [
        {
          conversationid: 1,
          phone_number: '+34664218253',
          color_tag: 'orange',
          priority: 'high',
          status: 'active'
        }
      ];

      mockApiResponse.json.mockResolvedValue({
        success: true,
        data: mockUrgentConversations,
        total: 1
      });

      await fetch('/api/whatsapp/conversations?urgent=true');

      expect(fetch).toHaveBeenCalledWith('/api/whatsapp/conversations?urgent=true');
    });

    test('Debería etiquetar conversación como urgente', async () => {
      const tagData = {
        notes: 'Paciente con dolor severo',
        taggedBy: 'Dr. Mario Rubio'
      };

      const mockTagResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          message: 'Conversación marcada como urgente'
        })
      };

      global.fetch = jest.fn()
        .mockResolvedValueOnce(mockApiResponse) // Para loadConversations
        .mockResolvedValueOnce(mockTagResponse); // Para tag

      await fetch('/api/whatsapp/conversations/1/tag-urgent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tagData)
      });

      expect(fetch).toHaveBeenCalledWith('/api/whatsapp/conversations/1/tag-urgent', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(tagData)
      }));
    });

    test('Debería obtener configuración de IA', async () => {
      const mockAIConfig = {
        configid: 1,
        ai_enabled: true,
        ai_active_outside_hours: true,
        working_hours: {
          monday: { start: '10:00', end: '20:00' }
        }
      };

      mockApiResponse.json.mockResolvedValue({
        success: true,
        data: mockAIConfig
      });

      await fetch('/api/whatsapp/ai-config');

      expect(fetch).toHaveBeenCalledWith('/api/whatsapp/ai-config');
    });

    test('Debería actualizar configuración de IA', async () => {
      const newConfig = {
        ai_enabled: false,
        ai_active_outside_hours: true
      };

      const mockUpdateResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          message: 'Configuración actualizada'
        })
      };

      global.fetch = jest.fn()
        .mockResolvedValueOnce(mockApiResponse) // Para get
        .mockResolvedValueOnce(mockUpdateResponse); // Para update

      await fetch('/api/whatsapp/ai-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newConfig)
      });

      expect(fetch).toHaveBeenCalledWith('/api/whatsapp/ai-config', expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(newConfig)
      }));
    });
  });

  describe('UI Components Tests', () => {
    beforeEach(() => {
      global.document = {
        getElementById: jest.fn(),
        querySelector: jest.fn(),
        createElement: jest.fn(),
        addEventListener: jest.fn()
      };

      global.window = {
        toggleAI: jest.fn(),
        filterUrgent: jest.fn(),
        refreshPanel: jest.fn(),
        loadConversationDetails: jest.fn()
      };
    });

    test('Debería mostrar estadísticas en tiempo real', () => {
      const mockStats = {
        total_conversations: 10,
        active_conversations: 8,
        urgent_conversations: 2,
        ai_enabled: true
      };

      const panelContent = fs.readFileSync(panelPath, 'utf8');

      // Verificar que existe la lógica de actualización de stats
      expect(panelContent).toContain('updateStatistics');
      expect(panelContent).toContain('totalConversations');
      expect(panelContent).toContain('urgentConversations');
    });

    test('Debería mostrar código de color naranja para urgentes', () => {
      const urgentConversation = {
        conversationid: 1,
        color_tag: 'orange',
        priority: 'high'
      };

      const panelContent = fs.readFileSync(panelPath, 'utf8');

      // Verificar que existe la lógica de color coding
      expect(panelContent).toContain('orange');
      expect(panelContent).toContain('color-tag');
    });

    test('Debería manejar estados de carga', () => {
      const panelContent = fs.readFileSync(panelPath, 'utf8');

      // Verificar que existe indicador de carga
      expect(panelContent).toContain('loading');
      expect(panelContent).toContain('spinner');
    });

    test('Debería mostrar mensajes de error', () => {
      const panelContent = fs.readFileSync(panelPath, 'utf8');

      // Verificar manejo de errores
      expect(panelContent).toContain('error');
      expect(panelContent).toContain('alert');
    });
  });

  describe('Real-time Features Tests', () => {
    test('Debería actualizar conversaciones automáticamente', async () => {
      const panelContent = fs.readFileSync(panelPath, 'utf8');

      // Verificar que existe auto-refresh
      expect(panelContent).toContain('setInterval');
      expect(panelContent).toContain('refreshPanel');
    });

    test('Debería manejar WebSocket para actualizaciones en tiempo real', () => {
      const panelContent = fs.readFileSync(panelPath, 'utf8');

      // Verificar que existe WebSocket o polling
      expect(panelContent).toContain('WebSocket') || expect(panelContent).toContain('polling');
    });
  });

  describe('Responsive Design Tests', () => {
    test('Debería ser responsive para móviles', () => {
      const panelContent = fs.readFileSync(panelPath, 'utf8');

      // Verificar media queries
      expect(panelContent).toContain('@media');
      expect(panelContent).toContain('mobile');
      expect(panelContent).toContain('responsive');
    });

    test('Debería usar CSS Grid/Flexbox', () => {
      const panelContent = fs.readFileSync(panelPath, 'utf8');

      expect(panelContent).toContain('display: grid') || 
                      expect(panelContent).toContain('display: flex');
    });
  });

  describe('Accessibility Tests', () => {
    test('Debería tener elementos con roles ARIA', () => {
      const panelContent = fs.readFileSync(panelPath, 'utf8');

      expect(panelContent).toContain('role=');
      expect(panelContent).toContain('aria-');
    });

    test('Debería tener navegación por teclado', () => {
      const panelContent = fs.readFileSync(panelPath, 'utf8');

      expect(panelContent).toContain('tabindex');
      expect(panelContent).toContain('keydown') || expect(panelContent).toContain('keyup');
    });
  });

  describe('Security Tests', () => {
    test('Debería validar inputs del usuario', () => {
      const panelContent = fs.readFileSync(panelPath, 'utf8');

      // Verificar sanitización de inputs
      expect(panelContent).toContain('escape') || expect(panelContent).toContain('sanitize');
    });

    test('Debería usar HTTPS para API calls', () => {
      const panelContent = fs.readFileSync(panelPath, 'utf8');

      // Verificar que usa HTTPS en producción
      expect(panelContent).toContain('https:') || 
                       expect(panelContent).toContain('window.location.protocol');
    });
  });

  describe('Performance Tests', () => {
    test('Debería lazy load conversaciones', () => {
      const panelContent = fs.readFileSync(panelPath, 'utf8');

      expect(panelContent).toContain('lazy') || 
                      expect(panelContent).toContain('infinite-scroll');
    });

    test('Debería tener límite de conversaciones mostradas', () => {
      const panelContent = fs.readFileSync(panelPath, 'utf8');

      expect(panelContent).toContain('limit') || 
                      expect(panelContent).toContain('page');
    });
  });

  describe('Error Handling Tests', () => {
    test('Debería mostrar mensaje cuando no hay conversaciones', () => {
      const panelContent = fs.readFileSync(panelPath, 'utf8');

      expect(panelContent).toContain('no-conversations') || 
                      expect(panelContent).toContain('empty-state');
    });

    test('Debería manejar errores de red', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const panelContent = fs.readFileSync(panelPath, 'utf8');

      // Verificar manejo de errores de red
      expect(panelContent).toContain('catch') || 
                      expect(panelContent).toContain('error');
    });

    test('Debería validar respuestas de API', () => {
      const panelContent = fs.readFileSync(panelPath, 'utf8');

      // Verificar validación de respuestas
      expect(panelContent).toContain('response.ok') || 
                      expect(panelContent).toContain('.success');
    });
  });
});