# 🤖 AI ENGINE - SISTEMA DE INTELIGENCIA ARTIFICIAL

## 📋 **Overview**

El AI Engine del sistema Rubio García Dental es un sistema completo de **Inteligencia Artificial gratuita** que utiliza **Ollama** para procesamiento natural de lenguaje. Proporciona respuestas contextuales inteligentes, detección automática de urgencias dentales y integración completa con el sistema de conversaciones WhatsApp.

## 🎯 **Características Principales**

### ✅ **Completamente GRATUITO**
- Sin límites de tokens
- Sin costos de API
- Funciona localmente
- Sin dependencias externas

### 🧠 **AI Avanzada**
- **Procesamiento de lenguaje natural** con modelos LLM
- **Detección inteligente de urgencia** dental
- **Respuestas contextuales** personalizadas
- **Análisis de intención** automático

### 🏥 **Especializado para Clínica Dental**
- **Contexto médico especializado**
- **Protocolos de emergencia** automatizados
- **Gestión de citas** inteligente
- **Respuestas empáticas** y profesionales

## 🚀 **Instalación y Configuración**

### **Paso 1: Instalar Ollama**

#### **Linux/macOS**
```bash
# Ejecutar script de instalación automática
chmod +x scripts/install-ollama.sh
./scripts/install-ollama.sh
```

#### **Windows**
1. Descargar desde: https://ollama.ai/download
2. Instalar siguiendo las instrucciones
3. Ejecutar desde PowerShell: `ollama serve`

### **Paso 2: Configurar Variables de Entorno**

Añadir a tu archivo `.env`:

```bash
# ===========================================
# CONFIGURACIÓN DE OLLAMA AI ENGINE
# ===========================================
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
OLLAMA_MAX_TOKENS=1000
OLLAMA_TIMEOUT=30000
OLLAMA_TEMPERATURE=0.7
OLLAMA_TOP_P=0.9
OLLAMA_REPEAT_PENALTY=1.1

# ===========================================
# CONFIGURACIÓN DE IA AVANZADA
# ===========================================
AI_ENABLED=true
AI_ACTIVE_OUTSIDE_HOURS=true
AI_AUTO_RESPONSE_ENABLED=true
AI_SMART_URGENCY_DETECTION=true
AI_MIN_CONFIDENCE_THRESHOLD=0.6
AI_CONTEXTUAL_RESPONSES=true
AI_DETAILED_LOGGING=true
AI_RATE_LIMIT_PER_HOUR=20
```

### **Paso 3: Verificar Funcionamiento**

```bash
# Verificar que Ollama está corriendo
curl http://localhost:11434/api/tags

# Verificar modelos instalados
ollama list

# Probar modelo
ollama run llama3.2:3b
```

## 🔧 **Arquitectura del Sistema**

```
AI Engine (ai-engine.js)
├── Análisis de Urgencia
│   ├── Detección de palabras clave críticas
│   ├── Análisis contextual
│   └── Puntuación de emergencia
├── Detección de Intención
│   ├── Emergencia dental
│   ├── Solicitud de cita
│   ├── Consulta de precios
│   └── Cancelación
├── Generación de Respuesta
│   ├── Contexto dental especializado
│   ├── Protocolos de emergencia
│   └── Respuestas empáticas
└── Integración WhatsApp
    ├── WhatsApp Service
    ├── Base de datos
    └── Panel de control
```

## 📊 **Niveles de Detección**

### 🚨 **Crítico (Critical)**
- **Palabras:** "me muero", "dolor insoportable", "se me cae el diente"
- **Acción:** Llamada telefónica inmediata
- **Respuesta:** Protocolo de emergencia automático
- **Color de etiqueta:** 🔴 Naranja intenso

### ⚠️ **Moderado (Moderate)**  
- **Palabras:** "me duele", "sangra", "inflamación"
- **Acción:** Cita prioritaria
- **Respuesta:** Orientación y programación
- **Color de etiqueta:** 🟡 Naranja medio

### 📅 **Citas (Appointment)**
- **Palabras:** "cita", "horario", "programar"
- **Acción:** Gestión de agenda
- **Respuesta:** Disponibilidad y reservas
- **Color de etiqueta:** 🟢 Normal

### 💰 **Consultas (Inquiry)**
- **Palabras:** "precio", "cuánto cuesta", "tratamiento"
- **Acción:** Información comercial
- **Respuesta:** Derivación a personal especializado
- **Color de etiqueta:** 🔵 Información

## 🎯 **Respuestas Automáticas**

### **Emergencia Crítica**
```
🚨 EMERGENCIA DENTAL DETECTADA

Tu situación requiere atención inmediata. 
Por favor llama AL INSTANTE al +34 664 218 253 (24h)

🆘 SITUACIÓN CRÍTICA - NO ESPERES
Rubio García Dental - Emergencias
```

### **Consulta Prioritaria**
```
🔥 DOLOR DETECTADO

Entiendo tu malestar. Para dolor intenso 
necesito que llames urgentemente al +34 664 218 253.

Es importante actuar rápido para evitar complicaciones.

Rubio García Dental - Atención Urgente
```

### **Solicitud de Cita**
```
¡Hola! Perfecto, puedo ayudarte a programar tu cita. 
¿Qué día y horario prefieres?

🗓️ Horarios disponibles:
L-V: 10:00-14:00 | 16:00-20:00
S: 10:00-14:00

📍 Rubio García Dental
```

### **Consulta de Precios**
```
Para información detallada de precios y tratamientos, 
nuestros especialistas te pueden asesorar. 
¿Te gustaría que te llamemos?

📞 916 410 841
📧 info@rubiogarciadental.com

💡 También puedes solicitar un presupuesto personalizado
```

## 📈 **Métricas y Monitoreo**

### **Variables de Seguimiento**
- `AIConfidence`: Nivel de confianza (0-1)
- `AIIntent`: Intención detectada
- `AIUrgencyLevel`: Nivel de urgencia
- `AIModel`: Modelo usado
- `AIProcessedAt`: Timestamp de procesamiento

### **Logs Disponibles**
```
✅ logs/ai-engine.log - Procesamiento detallado
✅ logs/whatsapp-service.log - Servicio WhatsApp
✅ logs/conversations.log - Conversaciones
```

## 🧪 **Testing**

### **Ejecutar Tests del AI Engine**
```bash
# Tests unitarios
npm run test tests/unit/aiEngine.test.js

# Tests de integración
npm run test tests/integration/aiIntegration.test.js

# Verificar salud del AI
npm run test:ai-health
```

### **Test Manual de AI**
```bash
# Usar Node.js REPL
node
> const AIEngine = require('./services/ai-engine');
> const ai = new AIEngine();
> await ai.processMessage('me duele mucho', '+34612345678');
```

## ⚙️ **Configuración Avanzada**

### **Modelos Recomendados**

#### **llama3.2:3b** (Recomendado)
- **Tamaño:** 3GB
- **Rendimiento:** Alto
- **Uso:** Respuestas complejas y contextuales
- **Recomendado para:** Clínicas con alto volumen

#### **qwen2:1.5b** (Eficiente)
- **Tamaño:** 1GB
- **Rendimiento:** Medio-Alto
- **Uso:** Respuestas rápidas y precisas
- **Recomendado para:** Clínicas pequeñas

#### **mistral:7b** (Conversacional)
- **Tamaño:** 4.1GB
- **Rendimiento:** Alto
- **Uso:** Conversaciones naturales
- **Recomendado para:** Chatbots avanzados

### **Parámetros de Generación**
```javascript
// Configuración en ai-engine.js
options: {
  temperature: 0.7,      // Creatividad (0.1-1.0)
  top_p: 0.9,           // Diversidad de respuestas
  max_tokens: 1000,     // Longitud máxima
  repeat_penalty: 1.1   // Penalización de repetición
}
```

## 🔍 **Troubleshooting**

### **Problemas Comunes**

#### **Error: "Ollama no disponible"**
```bash
# Verificar estado del servicio
sudo systemctl status ollama

# Reiniciar servicio
sudo systemctl restart ollama

# Verificar puerto
netstat -tlnp | grep 11434
```

#### **Error: "Modelo no encontrado"**
```bash
# Verificar modelos instalados
ollama list

# Descargar modelo
ollama pull llama3.2:3b

# Verificar descarga
ollama list | grep llama3.2:3b
```

#### **Error: "Timeout de respuesta"**
- Aumentar `OLLAMA_TIMEOUT` en variables de entorno
- Verificar recursos del sistema (RAM/CPU)
- Considerar modelo más pequeño

### **Logs de Debug**
```javascript
// Activar logs detallados
process.env.DEBUG = 'ai-engine:*';

// Ver logs en tiempo real
tail -f logs/ai-engine.log
```

## 🚀 **Optimización de Performance**

### **Configuración de Sistema**
```bash
# Asignar más RAM si es posible
export OLLAMA_NUM_PARALLEL=2

# Optimizar para producción
export OLLAMA_HOST=0.0.0.0:11434
export OLLAMA_ORIGINS=*
```

### **Monitoreo de Recursos**
```bash
# Ver uso de memoria
ps aux | grep ollama

# Ver uso de CPU
top -p $(pgrep -f ollama)

# Verificar GPU (si disponible)
nvidia-smi
```

## 📞 **Soporte**

### **Contacto Técnico**
- **Email:** soporte@rubiogarciadental.com
- **Teléfono:** +34 916 410 841
- **GitHub Issues:** [Crear issue](link-a-github)

### **Documentación Adicional**
- **API Docs:** `/docs/ai-engine-api.md`
- **Configuración:** `/docs/ai-configuration.md`
- **Troubleshooting:** `/docs/ai-troubleshooting.md`

---

## 🎉 **¡Sistema Listo!**

Tu sistema de **AI gratuita sin límites** está completamente operativo. Los pacientes recibirán respuestas inteligentes y contextuales 24/7, con detección automática de emergencias dentales.

**¡La clínica está ahora equipada con IA de vanguardia!**