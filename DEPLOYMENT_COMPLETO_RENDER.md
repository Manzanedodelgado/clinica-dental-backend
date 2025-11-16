# 🏥 Clínica Dental Rubio García - Deployment Completo
## Sistema Integrado Frontend + Backend en Render.com

### 🌐 URL de Producción Final
**https://www.app.rubiogarciadental.com**

---

## 📋 Resumen del Sistema

### 🏗️ Arquitectura Integrada
- **Frontend**: React + Vite (build estático)
- **Backend**: Node.js + Express + SQL Server
- **Hosting**: Render.com (monolítico)
- **Dominio**: www.app.rubiogarciadental.com

### 🎯 Funcionalidades
✅ **Gestión de Citas**: CRUD completo con estados SQL Server
✅ **Pacientes**: Base de datos integrada con búsqueda avanzada
✅ **WhatsApp**: Integración completa con Baileys + respuestas automáticas
✅ **Automatizaciones**: Flujos dinámicos y confirmaciones 24h
✅ **Facturación**: Sistema completo con Verifactu
✅ **Contabilidad**: Reportes financieros y análisis
✅ **Seguridad**: JWT, Rate Limiting, LOPD/RGPD
✅ **IA**: Procesamiento de mensajes WhatsApp con NLP

---

## 🚀 Deployment en Render.com

### 📁 Estructura de Archivos
```
/workspace/
├── backend/                 # Backend Node.js
│   ├── server.js           # Servidor principal (sirve frontend + API)
│   ├── package.json        # Dependencies + scripts
│   ├── dist/              # Frontend copiado aquí durante build
│   └── ...                # Controllers, routes, etc.
├── frontend/               # Frontend React + Vite
│   ├── src/               # Código fuente React
│   ├── dist/              # Build output (copiado a backend)
│   ├── package.json       # Dependencies frontend
│   └── .env.production    # Variables entorno producción
├── render.yaml             # Configuración Render.com
└── deploy-render.sh        # Script deployment
```

### 🔧 Configuración Render.com

#### 1. Configuración de Servicio
- **Tipo**: Web Service (Node.js)
- **Región**: Frankfurt (Europa)
- **Plan**: Free (para desarrollo)
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

#### 2. Variables de Entorno
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=b79882e078a7911286b880690c51934c95174aacaa2fd718d9e71a0cb31cb27368884f152a567a1953de2cdbc977b783c17374a4977dae95653eccb86ec83812
WHATSAPP_SESSION_NAME=rubio_garcia_dental
CLINIC_NAME=Clínica Dental Rubio García
CLINIC_ADDRESS=Calle Ejemplo 123, Madrid, España
CLINIC_PHONE=+34 123 456 789
CLINIC_EMAIL=info@rubiogarciadental.com
VITE_API_URL=/api
```

#### 3. Dominio Personalizado
- **Primario**: `www.app.rubiogarciadental.com`
- **Secundario**: `app.rubiogarciadental.com`

---

## 🏗️ Proceso de Build

### 1. Build del Frontend
```bash
cd frontend
npm install
npm run build
# Resultado en frontend/dist/
```

### 2. Copia al Backend
```bash
cp -r frontend/dist/* backend/dist/
# Frontend ahora disponible en backend/dist/
```

### 3. Servidor Integrado
El `server.js` sirve:
- **Frontend**: Rutas no-API → Archivos estáticos + SPA routing
- **Backend**: `/api/*` → Rutas RESTful

---

## 📱 Acceso al Sistema

### 🌐 URLs Principales
- **Frontend**: `https://www.app.rubiogarciadental.com`
- **API**: `https://www.app.rubiogarciadental.com/api`
- **Health Check**: `https://www.app.rubiogarciadental.com/api/system/health`
- **WhatsApp Panel**: `https://www.app.rubiogarciadental.com/whatsapp-panel.html`

### 🔑 Credenciales de Prueba
- **Email**: `admin@clinicadental.com`
- **Password**: `password123`

---

## 🔧 Configuración Técnica

### Backend (Node.js + Express)
```javascript
// server.js - Configuración principal
const frontendDir = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDir)); // Servir frontend

// Rutas API
app.use('/api/*', apiRoutes); // Backend

// SPA Routing - Redirigir a frontend para rutas no-API
app.use('*', (req, res) => {
    if (!req.originalUrl.startsWith('/api/')) {
        return res.sendFile(path.join(frontendDir, 'index.html'));
    }
});
```

### Frontend (React + Vite)
```javascript
// src/services/api.js - Configuración API
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// .env.production
VITE_API_URL=/api
VITE_APP_NAME=Clínica Dental Rubio García
```

---

## 📊 Monitoreo y Logs

### 🔍 Health Checks
- **Endpoint**: `/api/system/health`
- **Base de datos**: Conexión SQL Server verificada
- **WhatsApp**: Estado de conexión Baileys
- **Sistema**: Memoria, CPU, logs de aplicación

### 📈 Métricas Disponibles
- Citas por día/semana/mes
- Pacientes activos
- Mensajes WhatsApp procesados
- Ingresos y gastos
- Estado de automatizaciones

---

## 🛡️ Seguridad

### 🔒 Implementaciones
- **JWT**: Autenticación sin estado
- **CORS**: Configuración restrictiva
- **Helmet**: Headers de seguridad
- **Rate Limiting**: Protección contra DDoS
- **LOPD/RGPD**: Cumplimiento automático
- **SQL Injection**: Queries parametrizadas

### 🔐 Variables Críticas
- `JWT_SECRET`: Clave de firma de tokens
- Credenciales de base de datos (SQL Server)
- Configuraciones WhatsApp Business

---

## 🚨 Resolución de Problemas

### ❌ Error makeInMemoryStore (Baileys)
**Solución aplicada**:
```javascript
// whatsappController.js - Línea 28
this.store = baileys.makeInMemoryStore ? baileys.makeInMemoryStore({ logger: console }) : null;
```

### ❌ Frontend no carga
1. Verificar que `backend/dist/` existe
2. Comprobar rutas en `vite.config.js`
3. Verificar variables de entorno

### ❌ API no responde
1. Health check: `/api/system/health`
2. Logs de Render.com
3. Variables de entorno configuradas

---

## 📞 Soporte

### 🆘 Contacto
- **Email**: support@rubiogacialdental.com
- **Documentación**: GitHub repository
- **Logs**: `/logs/` directory in Render.com

### 🛠️ Debug
```bash
# Logs en tiempo real
render logs --service clinica-dental-app

# Restart del servicio
render restart --service clinica-dental-app
```

---

## ✅ Checklist Final

- [x] Frontend React + Vite configurado
- [x] Backend Node.js + Express con API
- [x] Servidor integrado (frontend + backend)
- [x] Configuración Render.com completa
- [x] Variables de entorno configuradas
- [x] Dominio personalizado asignado
- [x] Health checks implementados
- [x] Sistema de logs configurado
- [x] Seguridad implementada (JWT, CORS, etc.)
- [x] Frontend accesible desde cualquier IP
- [x] API responsive desde el mismo dominio

**🌟 SISTEMA LISTO PARA PRODUCCIÓN**

**URL Final**: https://www.app.rubiogarciadental.com