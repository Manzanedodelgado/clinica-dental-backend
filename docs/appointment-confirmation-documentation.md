# Sistema de Confirmación de Citas - Documentación Técnica

## 📋 Descripción General

El Sistema de Confirmación de Citas es un módulo avanzado que automatiza el proceso de confirmación de citas mediante el envío automático de mensajes 24 horas antes de cada cita programada. El sistema permite a los pacientes confirmar o cancelar su asistencia de manera sencilla mediante botones interactivos.

## 🚀 Funcionalidades Principales

### 1. Envío Automático de Mensajes
- **Tiempo de Anticipación**: 24 horas antes de la cita (configurable)
- **Criterio de Envío**: Solo para citas con estado "Programada"
- **Frecuencia de Verificación**: Cada minuto
- **Evitar Duplicados**: Sistema de control para no enviar múltiples mensajes

### 2. Mensajes Interactivos con Botones
El sistema envía mensajes con dos opciones claras:

#### Mensaje de Confirmación
```
Hola [Nombre del Paciente],

Su cita de [servicio] está programada para:
📅 [fecha formateada]
🕐 [hora]

¿Podría confirmar su asistencia?

Por favor seleccione una opción:
[✅ Confirmar] [❌ Cancelar]
```

#### Respuestas Automáticas Diferenciadas

**Al Confirmar:**
```
Muchas gracias por ayudarnos a mejorar nuestra atención!
```

**Al Cancelar:**
```
Desea que le demos una nueva cita
```

### 3. Gestión de Cancelaciones
Cuando un paciente cancela:
1. Se actualiza el estado de la cita en SQL Server
2. Se envía automáticamente opciones de reprogramación
3. Se mantiene registro de la actividad

## 🔧 Configuración del Sistema

### Parámetros Configurables
```javascript
config = {
    confirmationLeadTime: 24,  // horas antes
    checkInterval: 60000,      // verificación cada minuto
    responseDelay: 2000,       // retraso de respuesta automática
    maxRetries: 3              // máximo reintentos
}
```

### Opciones de Configuración
- **Anticipación**: 6h, 12h, 24h antes de la cita
- **Modo de Envío**: Automático, Manual, Mixto
- **Reintentos**: 1-5 intentos si falla el envío
- **Estado del Sistema**: Activado/Desactivado

## 📊 Panel de Control

### Estadísticas en Tiempo Real
- **Mensajes Enviados**: Total de confirmaciones enviadas
- **Confirmadas**: Citas confirmadas por pacientes
- **Canceladas**: Citas canceladas por pacientes
- **Activas**: Confirmaciones pendientes de respuesta

### Monitoreo en Vivo
- Lista de mensajes enviados con estado
- Seguimiento de respuestas en tiempo real
- Historial completo de actividad
- Indicadores visuales de estado

## 🧪 Sistema de Pruebas

### Pruebas Integradas
```javascript
// Probar flujo completo
testConfirmationFlow()

// Simular confirmación
testConfirmationResponse()

// Simular cancelación
testCancellationResponse()

// Enviar mensaje de prueba
window.testAppointmentConfirmation()
```

### Casos de Prueba
1. **Flujo Completo**: Envío → Respuesta → Actualización SQL
2. **Confirmación**: Botón "Confirmar" → Estado "Confirmada"
3. **Cancelación**: Botón "Cancelar" → Estado "Cancelada" → Oferta reprogramación
4. **Manejo de Errores**: Respuestas ambiguas, fallos de conexión

## 🔄 Flujo de Trabajo

### 1. Programación de Mensaje
```javascript
// Cada minuto, el sistema verifica citas del día siguiente
checkAppointmentsForConfirmation()

// Para cada cita programada sin confirmar:
scheduleConfirmationMessage(appointment)
```

### 2. Envío del Mensaje
```javascript
// Generar mensaje personalizado
generateConfirmationMessage(confirmationData)

// Simular envío por WhatsApp (en producción sería API real)
sendConfirmationMessage(messageData)

// Mostrar en interfaz de monitoreo
displayConfirmationMessage(messageData)
```

### 3. Procesamiento de Respuesta
```javascript
// El paciente hace clic en un botón
handleButtonResponse(appointmentId, response, patientPhone)

// Procesar según la respuesta
if (response === 'confirm') {
    await confirmAppointment(appointmentId)
    sendDifferentiatedResponse('confirm', patientPhone, appointmentId)
} else if (response === 'cancel') {
    await cancelAppointment(appointmentId)
    sendDifferentiatedResponse('cancel', patientPhone, appointmentId)
    offerRescheduleOptions(patientPhone, appointmentId)
}
```

## 🔗 Integración con SQL Server

### Operaciones de Base de Datos
```javascript
// Confirmar cita
async confirmAppointment(appointmentId) {
    await window.dbManager.updateAppointment(appointmentId, {
        status: 'Confirmada'
    })
}

// Cancelar cita
async cancelAppointment(appointmentId) {
    await window.dbManager.updateAppointment(appointmentId, {
        status: 'Cancelada'
    })
}
```

### Sincronización
- Actualización automática del calendario tras cambios
- Sincronización bidireccional con SQL Server
- Fallback a localStorage si no hay conexión

## 📈 Registro y Monitoreo

### Log de Actividades
```javascript
// Registro automático de todas las acciones
logConfirmationActivity(action, data)

// Tipos de actividades registradas:
- confirmation_message_sent: Mensaje enviado
- appointment_confirmed: Cita confirmada
- appointment_cancelled: Cita cancelada
- reschedule_offer_sent: Oferta reprogramación
- patient_response_processed: Respuesta procesada
```

### Almacenamiento
- Datos persistentes en localStorage
- Últimas 1000 actividades mantenidas
- Exportación a CSV disponible

## 🛠️ Personalización

### Plantillas de Mensajes
```javascript
// Modificar mensajes de respuesta
this.responses = {
    confirmation: {
        message: 'Muchas gracias por ayudarnos a mejorar nuestra atención!',
        color: 'success'
    },
    cancellation: {
        message: 'Desea que le demos una nueva cita',
        color: 'warning',
        action: 'offer_reschedule'
    }
}
```

### Configuración de UI
- Estilos CSS personalizables
- Posición de elementos configurable
- Temas de color adaptables

## 🚦 Estados del Sistema

### Estados de Confirmación
- **pending**: Esperando respuesta del paciente
- **confirmed**: Paciente confirmó asistencia
- **cancelled**: Paciente canceló la cita
- **expired**: Tiempo límite de respuesta vencido

### Estados de Mensaje
- **sending**: En proceso de envío
- **sent**: Enviado exitosamente
- **delivered**: Entregado al paciente
- **read**: Leído por el paciente

## 🔍 Resolución de Problemas

### Problemas Comunes

#### 1. Mensajes no se envían
**Causa**: Sistema desactivado o sin citas programadas
**Solución**: Verificar estado del toggle en configuración

#### 2. Respuestas no se procesan
**Causa**: Error en base de datos o conexión SQL
**Solución**: Verificar estado de `window.dbManager`

#### 3. Estadísticas no actualizan
**Causa**: Función de actualización no ejecutándose
**Solución**: Ejecutar `updateConfirmationStats()` manualmente

### Logs de Debug
```javascript
// Activar logs detallados
console.log('🔍 Estado del sistema:', window.confirmationSystem)
console.log('📊 Estadísticas actuales:', window.confirmationSystem.getConfirmationStats())
```

## 🔒 Seguridad

### Validaciones
- Verificación de datos de entrada
- Sanitización de respuestas de pacientes
- Control de acceso a funciones críticas

### Privacidad
- Datos almacenados localmente
- No transmisión de información sensible sin encriptar
- Cumplimiento GDPR para datos de pacientes

## 📱 Compatibilidad

### Navegadores Soportados
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Dispositivos
- Desktop (1920x1080+)
- Tablet (768x1024)
- Mobile (375x667+)

## 🚀 Despliegue en Producción

### Requisitos
1. **WhatsApp Business API**: Para envío real de mensajes
2. **Servidor Backend**: Node.js/Express para API
3. **Base de Datos**: SQL Server configurado
4. **SSL**: Certificado HTTPS obligatorio

### Configuración de Producción
```javascript
// Configurar endpoints reales
const PRODUCTION_CONFIG = {
    whatsappAPI: 'https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages',
    apiToken: 'YOUR_ACCESS_TOKEN',
    webhookURL: 'https://yourdomain.com/webhook/whatsapp'
}
```

## 📞 Soporte

### Contacto Técnico
- **Desarrollador**: MiniMax Agent
- **Documentación**: Este archivo
- **Issues**: Sistema de logs integrado

### Actualizaciones
- **Versión**: 1.0.0
- **Fecha**: 2025-11-16
- **Compatibilidad**: Backward compatible con versiones anteriores

---

*Esta documentación está sujeta a actualizaciones conforme evolucione el sistema.*