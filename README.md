# Sistema de Gestión Dental - Backend API

## 📋 Descripción

Backend API completo para el Sistema de Gestión de Citas Dentales de Rubio García Dental. Incluye gestión de citas, automatizaciones, cumplimiento LOPD/RGPD y sistema de autenticación.

## 🚀 Características Principales

### ✅ Gestión Completa de Citas
- CRUD completo para citas dentales
- Estados: Planificada, Confirmada, Aceptada, Cancelada, Anula
- Validaciones de conflictos de horario
- Actualización de estados en tiempo real

### ✅ Sistema de Automatización Avanzado
- Flujos dinámicos personalizados
- Tipos: mensaje, selección única, selección múltiple, cuestionarios, documentos
- Procesamiento de respuestas con ramificación
- Logging completo de actividades

### ✅ Cumplimiento Legal LOPD/RGPD
- Consentimientos informados automáticos
- Registro legal con tracking de IP y User-Agent
- Cuestionarios de primera visita con LOPD
- Verificación automática de cumplimiento

### ✅ Gestión de Pacientes
- CRUD completo con validaciones
- Búsqueda y filtros avanzados
- Historial de citas y documentos

### ✅ Seguridad y Autenticación
- JWT con tokens de acceso y actualización
- Rate limiting y middleware de seguridad
- Logs de actividad y auditoría
- Roles: Administrador, Dentista, Recepcionista, Asistente

## 🛠️ Instalación

### Prerrequisitos

- Node.js 18.0.0 o superior
- SQL Server 2016 o superior
- npm o yarn

### 1. Clonar e Instalar Dependencias

```bash
# Clonar el repositorio
git clone <repository-url>
cd rubio-garcia-dental-backend

# Instalar dependencias
npm install
```

### 2. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar configuración
nano .env
```

**Configuración requerida en `.env`:**

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de Datos SQL Server
DB_SERVER=localhost
DB_DATABASE=RubioGarciaDental
DB_USER=sa
DB_PASSWORD=TuPasswordSegura123!
DB_ENCRYPT=true

# JWT
JWT_SECRET=TuJWTSecretMuySeguro2025DentalClinic
JWT_EXPIRES_IN=24h

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@rubiogarcialdental.com
SMTP_PASSWORD=tu-app-password

# LOPD
LOPD_ENABLED=true
GDPR_COMPLIANCE_VERSION=1.0
```

### 3. Configurar Base de Datos

#### Opción A: Usar el Script de Inicialización

```bash
# Ejecutar script de inicialización
npm run init-db
```

#### Opción B: Configuración Manual

1. Crear base de datos en SQL Server Management Studio:
   ```sql
   CREATE DATABASE RubioGarciaDental;
   ```

2. Ejecutar el contenido de `scripts/init-database.js` en SQL Server Management Studio

3. Verificar que todas las tablas se crearon correctamente

### 4. Iniciar el Servidor

#### Desarrollo
```bash
npm run dev
```

#### Producción
```bash
npm start
```

El servidor estará disponible en `http://localhost:3000`

## 📚 Documentación de API

### Endpoints Principales

#### 🔐 Autenticación
```http
POST /api/auth/login          # Iniciar sesión
POST /api/auth/logout         # Cerrar sesión
GET  /api/auth/profile        # Obtener perfil
POST /api/auth/refresh        # Renovar token
```

#### 📅 Citas
```http
GET    /api/appointments           # Listar citas
GET    /api/appointments/:id       # Obtener cita específica
POST   /api/appointments           # Crear nueva cita
PUT    /api/appointments/:id       # Actualizar cita
DELETE /api/appointments/:id       # Eliminar cita
PUT    /api/appointments/:id/status # Cambiar estado
```

#### 👥 Pacientes
```http
GET    /api/patients              # Listar pacientes
GET    /api/patients/:id          # Obtener paciente
POST   /api/patients              # Crear paciente
PUT    /api/patients/:id          # Actualizar paciente
DELETE /api/patients/:id          # Eliminar paciente
```

#### 📄 Documentos Legales
```http
POST /api/legal/documents                          # Crear documento
POST /api/legal/documents/:id/accept               # Aceptar documento
GET  /api/legal/documents/patient/:patientId       # Documentos del paciente
GET  /api/legal/lopd-compliance/:patientId         # Verificar LOPD
GET  /api/legal/templates                          # Plantillas legales
```

#### 🤖 Automatización
```http
POST /api/automation/flows                                       # Crear flujo
GET  /api/automation/flows/:id                                  # Obtener flujo
POST /api/automation/flows/:id/steps/:stepId/response           # Procesar respuesta
GET  /api/automation/active-flows                               # Flujos activos
GET  /api/automation/stats                                      # Estadísticas
```

#### 📋 Cuestionarios
```http
POST /api/questionnaires                                    # Crear cuestionario
GET  /api/questionnaires/appointment/:appointmentId         # Cuestionarios de cita
GET  /api/questionnaires/first-visit                        # Primera visita
PUT  /api/questionnaires/:id                                # Actualizar cuestionario
```

#### ⚙️ Sistema
```http
GET /api/system/stats          # Estadísticas generales
GET /api/system/health         # Estado del sistema
GET /api/system/logs          # Logs del sistema
GET /api/system/config        # Configuración (admin)
```

### Ejemplos de Uso

#### Autenticación
```javascript
// Login
const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        username: 'admin',
        password: 'Admin123!'
    })
});
const { accessToken } = await response.json();

// Usar token
const appointments = await fetch('/api/appointments', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
});
```

#### Crear Cita
```javascript
const response = await fetch('/api/appointments', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken
    },
    body: JSON.stringify({
        patientId: 1,
        date: '2025-11-20',
        time: '10:30',
        duration: 60,
        treatment: 'Limpieza dental',
        notes: 'Primera cita del paciente'
    })
});
```

#### Crear Flujo de Automatización
```javascript
const flowConfig = {
    name: 'Confirmación 24h',
    type: 'mixed',
    steps: [
        {
            type: 'message',
            message: 'Su cita es mañana a las 10:30. ¿Confirma asistencia?',
            buttons: [
                { text: 'Confirmar', value: 'confirm' },
                { text: 'Cancelar', value: 'cancel' }
            ]
        },
        {
            type: 'document',
            documentId: 'informed_consent_treatment',
            requiresLegal: true,
            message: 'Debe aceptar el consentimiento informado'
        }
    ]
};

const response = await fetch('/api/automation/flows', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + accessToken
    },
    body: JSON.stringify({
        appointmentId: 1,
        flowType: 'confirmation',
        flowConfig
    })
});
```

## 🏗️ Arquitectura

### Estructura del Proyecto
```
backend/
├── config/              # Configuraciones
│   └── database.js      # Configuración SQL Server
├── controllers/         # Controladores de la API
│   ├── authController.js
│   ├── appointmentController.js
│   ├── legalController.js
│   └── automationController.js
├── middleware/          # Middleware de autenticación y validación
│   ├── auth.js
│   └── validation.js
├── models/             # Modelos de datos
├── routes/             # Rutas de la API
│   ├── auth.js
│   ├── appointments.js
│   ├── patients.js
│   ├── legal.js
│   ├── automation.js
│   ├── questionnaires.js
│   └── system.js
├── scripts/            # Scripts de utilidad
│   └── init-database.js
├── utils/              # Utilidades
├── server.js           # Servidor principal
└── package.json
```

### Base de Datos

#### Tablas Principales
- **DUsers**: Usuarios del sistema
- **DPatients**: Datos de pacientes
- **DCitas**: Citas médicas
- **DLegalDocuments**: Documentos legales y consentimientos
- **DQuestionnaireResponses**: Respuestas de cuestionarios
- **DAutomationFlows**: Flujos de automatización
- **DAutomationLogs**: Logs de automatización
- **DAppointmentStatusChanges**: Historial de cambios de estado
- **DSystemLogs**: Logs del sistema
- **DSystemConfig**: Configuración del sistema

#### Relaciones
```
DUsers ←─── DCitas (changedBy)
DPatients ←─── DCitas (patientId)
DPatients ←─── DLegalDocuments (patientId)
DPatients ←─── DQuestionnaireResponses (patientId)
DCitas ←─── DLegalDocuments (appointmentId)
DCitas ←─── DQuestionnaireResponses (appointmentId)
DCitas ←─── DAutomationFlows (appointmentId)
DCitas ←─── DAutomationLogs (appointmentId)
DAutomationFlows ←─── DAutomationLogs (flowId)
```

## 🔒 Seguridad

### Autenticación JWT
- Tokens de acceso (expiran en 24h)
- Tokens de renovación (expiran en 7d)
- Verificación de tokens en cada request

### Rate Limiting
- Límite de 100 requests por 15 minutos por IP
- Excepciones para endpoints de health check

### Validación de Datos
- Validación con Joi en todos los endpoints
- Sanitización de inputs
- Verificación de tipos de datos

### Seguridad de Base de Datos
- Conexiones parametrizadas
- Prevención de SQL Injection
- Validación de permisos por rol

## 📊 Monitoreo y Logs

### Logs del Sistema
- Winston para logging estructurado
- Rotación automática de logs
- Logs separados por nivel (error, warn, info)

### Métricas
- Estadísticas de uso de la API
- Métricas de base de datos
- Estado de servicios externos

### Auditoría
- Log de todas las acciones de usuarios
- Historial de cambios de estado
- Tracking de documentos legales

## 🧪 Testing

### Ejecutar Tests
```bash
npm test
```

### Tests Incluidos
- Tests de integración de API
- Tests de autenticación
- Tests de validación de datos
- Tests de base de datos

## 🚀 Deployment

### Variables de Entorno de Producción
```env
NODE_ENV=production
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false
JWT_SECRET=<SECURE_RANDOM_SECRET>
```

### Proceso de Deploy
1. Configurar variables de entorno de producción
2. Ejecutar migrations de base de datos
3. Instalar dependencias de producción
4. Configurar SSL/TLS
5. Configurar monitoreo
6. Configurar backups automáticos

### Docker (Opcional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔧 Configuración Avanzada

### WhatsApp Business API
Para habilitar notificaciones por WhatsApp:

1. Obtener credenciales de WhatsApp Business API
2. Configurar variables de entorno:
```env
WHATSAPP_ACCESS_TOKEN=tu_token
WHATSAPP_PHONE_NUMBER_ID=tu_phone_id
WHATSAPP_VERIFY_TOKEN=tu_verify_token
```

### Email Notifications
Para notificaciones por email:

1. Configurar SMTP en variables de entorno
2. Implementar servicio de email en `utils/email.js`

### Integración de Calendarios
Para sincronización con calendarios externos:

1. Implementar interfaces de calendario en `integrations/calendars/`
2. Configurar APIs de Google Calendar, Outlook, etc.

## 📞 Soporte

### Contacto
- Email: support@rubiogacialdental.com
- Documentación: [Enlace a documentación completa]

### Reportar Issues
1. Describir el problema detalladamente
2. Incluir pasos para reproducir
3. Especificar versión de Node.js y SQL Server
4. Adjuntar logs relevantes

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles.

## 🤖 AI ENGINE - INTELIGENCIA ARTIFICIAL GRATUITA

### ✅ **Sistema de AI Completo**
Este backend incluye un **sistema de Inteligencia Artificial completamente gratuito y SIN LÍMITES DE TOKENS** utilizando **Ollama** para procesamiento natural de lenguaje especializado en el ámbito dental.

#### 🚀 **Características del AI Engine**
- **Completamente GRATUITO** - Sin límites de tokens ni costos, uso ilimitado
- **Detección inteligente de urgencias** dentales
- **Respuestas contextuales** personalizadas
- **Análisis de intención** automático
- **Integración completa** con WhatsApp y conversaciones
- **Especializado en clínica dental** - Contexto médico

#### 📊 **Niveles de Detección de Urgencia**
- 🚨 **CRÍTICO**: "me muero", "dolor insoportable" → Llamada inmediata
- ⚠️ **MODERADO**: "me duele", "sangra" → Cita prioritaria  
- 📅 **CITA**: "quiero una cita" → Gestión de agenda
- 💰 **CONSULTA**: "precio", "tratamiento" → Información comercial

#### ⚙️ **Instalación del AI Engine**

##### **Linux/macOS**
```bash
# Script de instalación automática
chmod +x scripts/install-ollama.sh
./scripts/install-ollama.sh
```

##### **Windows** 
```powershell
# Ejecutar como Administrador
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
./scripts/install-ollama-windows.ps1
```

#### 🔧 **Configuración**
Añadir a `.env`:
```bash
# OLLAMA AI ENGINE
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
AI_ENABLED=true
AI_SMART_URGENCY_DETECTION=true
AI_MIN_CONFIDENCE_THRESHOLD=0.6
```

#### 📈 **Ejemplos de Respuestas AI**

**Emergencia Crítica:**
```
🚨 EMERGENCIA DENTAL DETECTADA

Tu situación requiere atención inmediata. 
Por favor llama AL INSTANTE al +34 664 218 253 (24h)

🆘 SITUACIÓN CRÍTICA - NO ESPERES
Rubio García Dental - Emergencias
```

**Solicitud de Cita:**
```
¡Hola! Perfecto, puedo ayudarte a programar tu cita. 
¿Qué día y horario prefieres?

🗓️ Horarios disponibles:
L-V: 10:00-14:00 | 16:00-20:00
S: 10:00-14:00

📍 Rubio García Dental
```

#### 🧪 **Testing del AI**
```bash
# Verificar salud del AI Engine
curl http://localhost:11434/api/tags

# Test manual
node -e "
const AIEngine = require('./services/ai-engine');
const ai = new AIEngine();
ai.processMessage('me duele mucho', '+34612345678').then(console.log);
"
```

#### 📚 **Documentación Completa**
Ver documentación detallada en: [`docs/AI-ENGINE.md`](docs/AI-ENGINE.md)

---

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles.

---

**Desarrollado por MiniMax Agent** | Sistema de Gestión Dental Rubio García 2025