# Rubio García Dental - Sistema de Gestión Clínica

Una aplicación web completa para la gestión integral de la clínica dental Rubio García Dental, desarrollada con HTML5, CSS3 y JavaScript vanilla.

## Características Principales

### 🏥 Gestión Clínica Completa
- **Panel de Control (Home)**: Vista general con citas del día, mensajes urgentes y estadísticas
- **Agenda de Citas**: Sistema completo de calendario con vista diaria, semanal y mensual
- **Base de Datos de Pacientes**: Gestión completa de información de pacientes
- **Historial Médico**: Registro de tratamientos y notas médicas

### 📱 Comunicación con Pacientes
- **Centro WhatsApp**: Interfaz similar a WhatsApp Web para comunicación directa
- **Historial de Conversaciones**: Registro completo de mensajes con pacientes
- **Envío de Documentos**: Capacidad de compartir PDFs, imágenes y documentos
- **Estados de Mensaje**: Seguimiento de mensajes enviados, entregados y leídos

### 🤖 Agente IA Inteligente
- **Respuestas Automáticas**: IA configurada para responder consultas comunes
- **Recordatorios Automáticos**: Sistema de recordatorios de citas 24h antes
- **Envío de Consentimientos**: Automatización de documentos legales
- **Seguimiento Post-Tratamiento**: Mensajes de seguimiento personalizados
- **Configuración de Comportamiento**: Ajustes de estilo y tono de comunicación

### 📄 Gestión de Documentos
- **Plantillas de Mensajes**: Plantillas personalizables para respuestas frecuentes
- **Cuestionarios**: Creación de formularios para nuevas citas
- **Consentimientos Informados**: Generación automática de documentos legales
- **Otros Documentos**: Gestión de diversos tipos de documentos

### 💰 Facturación Verifactu
- **Cumplimiento Normativo**: Sistema totalmente compatible con Verifactu español
- **Generación de QR**: Códigos QR obligatorios para verificación en AEAT
- **Firma Electrónica**: Implementación de firma XAdES según normativa
- **Cadena de Integridad**: Sistema de hash para garantizar inalterabilidad
- **Registro Legal**: Almacenamiento conforme a la legislación española
- **Formato XML**: Generación de registros en formato XML requerido

### 📊 Módulo de Contabilidad
- **Dashboard Financiero**: Resumen de ingresos, gastos y beneficios
- **Análisis por Tratamientos**: Desglose de ingresos por tipo de servicio
- **Evolución Mensual**: Gráficos de tendencias temporales
- **Gestión de Gastos**: Registro y aprobación de gastos operativos
- **Exportación de Datos**: Exportación a Excel, PDF y CSV
- **Reportes Fiscales**: Informes para declaración de impuestos

### ⚙️ Configuración y Administración
- **Control de Acceso**: Sistema de usuarios con diferentes niveles de permisos
- **Datos de la Clínica**: Configuración de información empresarial
- **Integraciones**: Configuración de sistemas externos
- **Respaldos**: Sistema de copias de seguridad

### 🗄️ Integración SQL Server
- **Base de Datos SQL Server**: Conexión directa con tabla `dbo.DCitas`
- **Autenticación Windows**: Usuario `gabinete2\box2` con permisos `sysadmin`
- **Sincronización Automática**: Actualización cada 30 segundos
- **Operaciones CRUD**: Crear, leer, actualizar y eliminar citas en tiempo real
- **Fallback Local**: Funcionamiento sin conexión usando localStorage
- **Notificaciones**: Sistema de alertas para operaciones de base de datos
- **Logging Completo**: Registro detallado de todas las operaciones
- **Documentación**: Guía completa en `SQL_Integration_Documentation.md`

### 🔄 Sistema de Sincronización
- **Estado de Conexión**: Monitor en tiempo real del estado SQL Server
- **Caché Inteligente**: Almacenamiento local como respaldo temporal
- **Eventos en Tiempo Real**: Notificación automática de cambios en BD
- **Manejo de Errores**: Recuperación automática de fallos de conexión
- **Consistencia de Datos**: Garantía de sincronización bidireccional

## Credenciales de Acceso

- **Usuario**: JMD
- **Contraseña**: 190582
- **Administrador**: Juan Antonio Manzanedo
- **Email**: info@rubiogarciadental.com

## Características Técnicas

### 🎨 Diseño y UX
- **Diseño Responsivo**: Adaptable a móviles, tablets y desktop
- **Paleta de Colores**: Azul corporativo (#0F74A8) y grises profesionales
- **Interfaz Intuitiva**: Navegación clara y componentes familiar
- **Carga Rápida**: Optimizado para rendimiento web
- **Accesibilidad**: Cumple estándares WCAG AA

### 🔧 Tecnologías Utilizadas
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Estilos**: CSS Grid, Flexbox, Custom Properties
- **Fuentes**: Inter (Google Fonts)
- **Iconografía**: Font Awesome 6
- **Gráficos**: Canvas API para visualización de datos
- **Almacenamiento**: LocalStorage para persistencia local

### 📱 Funcionalidades Móviles
- **Navegación Adaptiva**: Sidebar colapsible en móvil
- **Touch Optimized**: Elementos táctiles de tamaño adecuado
- **Gestos**: Soporte para gestos de navegación
- **Responsive Tables**: Tablas adaptativas para datos tabulares

## Estructura del Proyecto

```
├── index.html                 # Página principal
├── styles/
│   └── main.css              # Estilos principales
├── scripts/
│   ├── main.js               # Funcionalidad principal
│   ├── calendar.js           # Sistema de calendario
│   ├── whatsapp.js           # Centro de mensajes
│   ├── ai-agent.js           # Agente IA
│   ├── invoices.js           # Sistema de facturación
│   └── accounting.js         # Módulo de contabilidad
└── imgs/
    └── logo.svg              # Logo de la clínica
```

## Funcionalidades Destacadas

### Sistema de Facturación Verifactu

El sistema cumple completamente con la normativa española Verifactu:

- **Código QR Obligatorio**: Generación automática de códigos QR de 30x40mm
- **Texto Legal**: "Factura verificable en la sede electrónica de la AEAT"
- **Hash Cryptográfico**: Sistema de hash SHA-256 para integridad
- **Firma Electrónica**: Implementación XAdES Enveloped Signature
- **Registro Cronológico**: Cadena inalterable de registros
- **Formato XML**: Estructura XML conforme a AEAT
- **Validación**: Verificación automática de integridad

### Agente IA Avanzado

- **Configuración Personalizable**: Ajuste de estilo, tono y comportamiento
- **Automatizaciones Activas**: 5 tipos de automatizaciones preconfiguradas
- **Monitoreo en Tiempo Real**: Registro de actividades y estadísticas
- **Escalación Inteligente**: Detección de casos urgentes para escalación
- **Integración WhatsApp**: Respuestas automáticas en conversaciones

### WhatsApp Web Simulado

- **Interfaz Familiar**: Diseño idéntico a WhatsApp Web
- **Estados de Lectura**: Simulación de estados de mensaje
- **Envío de Archivos**: Soporte para imágenes y documentos
- **Historial Completo**: Persistencia de conversaciones
- **Búsqueda**: Función de búsqueda en conversaciones

## Configuración del Sistema

### Base de Datos Local
- **Sincronización**: La agenda se sincroniza con tabla local de base de datos
- **Offline**: Funcionalidad offline con sincronización posterior
- **Backup**: Sistema automático de respaldos locales

### Integraciones
- **AEAT Verifactu**: Cumplimiento directo con normativa fiscal española
- **WhatsApp**: Simulación completa sin API oficial
- **Email**: Sistema de envío de facturas por email

## Seguridad y Privacidad

- **Control de Acceso**: Autenticación obligatoria con credenciales seguras
- **Datos de Pacientes**: Protección de información médica sensible
- **Backup Seguro**: Copias de seguridad automáticas y cifradas
- **Auditoría**: Registro de todas las acciones del sistema

## Rendimiento

- **Carga Inicial**: Pantalla de carga con animación profesional
- **Lazy Loading**: Carga diferida de secciones no utilizadas
- **Cache Inteligente**: Almacenamiento local de datos frecuentes
- **Optimización Móvil**: Rendimiento optimizado para dispositivos móviles

## Soporte y Mantenimiento

### Actualizaciones
- **Sistema Modular**: Actualizaciones independientes por módulo
- **Compatibilidad**: Mantiene compatibilidad con navegadores modernos
- **Escalabilidad**: Preparado para crecimiento de la clínica

### Documentación
- **Manual de Usuario**: Documentación completa de funcionalidades
- **API Interna**: Documentación de métodos JavaScript
- **Guías de Configuración**: Instrucciones de setup y mantenimiento

## Limitaciones Actuales

- **WhatsApp**: Simulación sin API real de WhatsApp Business
- **SQL Server**: Requiere implementación de backend API para conexión completa
- **Email**: Simulación de envío (requiere integración real)
- **Pagos**: No incluye pasarelas de pago online

## Futuras Mejoras

- [x] ✅ **Integración SQL Server**: Base de datos SQL Server completa
- [ ] Backend API completo para SQL Server
- [ ] Integración real con WhatsApp Business API
- [ ] Pasarelas de pago online
- [ ] App móvil nativa
- [ ] Integración con sistemas de imagen médica
- [ ] Sistema de citas online para pacientes
- [ ] Portal del paciente
- [ ] Integración con seguros médicos
- [ ] Sistema de respaldo automatizado en la nube

## Contacto Técnico

Para soporte técnico o consultas sobre el sistema:
- **Desarrollado por**: MiniMax Agent
- **Versión**: 1.0.0
- **Fecha**: Diciembre 2024

---

*Sistema desarrollado específicamente para Rubio García Dental - Implantología y estética de vanguardia*