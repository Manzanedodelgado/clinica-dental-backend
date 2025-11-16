# 🚀 Guía de Despliegue en Producción - Cloud Moderno

## 🎯 **Opciones de Despliegue Recomendadas**

### **1. 🌐 Render.com (RECOMENDADO - GRATIS)**
### **2. 🚂 Railway (GRATIS - Fácil)**
### **3. ☁️ Heroku (Pago por uso)**
### **4. 🏗️ DigitalOcean App Platform**
### **5. ☕ Railway (Alternativa gratuita)**

---

## 🌐 **OPCIÓN 1: RENDER.COM (RECOMENDADO)**

### ✅ **Ventajas**
- ✅ **Plan gratuito** disponible
- ✅ **Deployment automático** desde GitHub
- ✅ **Dominio SSL** incluido automáticamente
- ✅ **Escalado automático**
- ✅ **Logs integrados**
- ✅ **Monitoreo básico**

### 📋 **Pasos de Despliegue**

#### **Paso 1: Preparar Repositorio**
```bash
# El código ya está en GitHub:
# https://github.com/Manzanedodelgado/clinica-dental-backend
```

#### **Paso 2: Crear Account en Render**
1. Ve a [render.com](https://render.com)
2. Conecta tu cuenta de GitHub
3. Autoriza acceso al repositorio

#### **Paso 3: Crear Web Service**
1. **Dashboard → New → Web Service**
2. **Build and deploy from a Git repository**
3. Selecciona tu repositorio: `clinica-dental-backend`
4. **Environment**: Node
5. **Build Command**: `npm install`
6. **Start Command**: `npm start`

#### **Paso 4: Configurar Variables de Entorno**
En la sección **Environment**, agrega:

```env
# Producción
NODE_ENV=production
PORT=3000

# Base de Datos (necesitarás configurar esto)
DB_SERVER=your-sql-server.com
DB_DATABASE=RubioGarciaDental
DB_USER=rubio_dental_user
DB_PASSWORD=your_secure_password

# Seguridad
JWT_SECRET=generate_a_secure_64_character_secret

# WhatsApp
WHATSAPP_PHONE_NUMBER=34664218253

# Clínica
CLINIC_PHONE=916410841
CLINIC_MOBILE=664218253
CLINIC_EMAIL=info@rubiogarciadental.com

# LOPD/Compliance
LOPD_ENABLED=true
GDPR_COMPLIANCE_VERSION=2.0

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### **Paso 5: Deployment**
1. **Create Web Service**
2. **Render construye y despliega automáticamente**
3. **¡Listo!** Obtienes una URL como: `https://clinica-dental-backend.onrender.com`

---

## 🚂 **OPCIÓN 2: RAILWAY (ALTERNATIVA GRATUITA)**

### ✅ **Ventajas**
- ✅ **Plan gratuito** generoso
- ✅ **Deploy ultra rápido**
- ✅ **URLs personalizadas**
- ✅ **Base de datos PostgreSQL** incluido gratis
- ✅ **Logs en tiempo real**

### 📋 **Pasos de Despliegue**

#### **Paso 1: Crear Cuenta**
1. Ve a [railway.app](https://railway.app)
2. Inicia sesión con GitHub

#### **Paso 2: Nuevo Proyecto**
1. **New Project**
2. **Deploy from GitHub repo**
3. Selecciona: `manzanedodelgado/clinica-dental-backend`

#### **Paso 3: Configuración Automática**
Railway detecta automáticamente:
- **Node.js app**
- **Puerto 3000**
- **Instalación de dependencias**

#### **Paso 4: Variables de Entorno**
En la sección **Variables**, agrega:

```env
NODE_ENV=production
PORT=3000

# Genera tu propio JWT_SECRET
JWT_SECRET=tu_jwt_secret_seguro_de_64_caracteres

# WhatsApp
WHATSAPP_PHONE_NUMBER=34664218253

# Clínica
CLINIC_PHONE=916410841
CLINIC_MOBILE=664218253
CLINIC_EMAIL=info@rubiogarciadental.com

# Base de Datos (Railway PostgreSQL incluido)
# Railway genera automáticamente las variables DB_*
```

#### **Paso 5: Deploy**
1. **Railway despliega automáticamente**
2. **URL generada**: `https://tu-proyecto.up.railway.app`

---

## ☁️ **OPCIÓN 3: HEROKU (PAGO POR USO)**

### 📋 **Pasos de Despliegue**

#### **Paso 1: Instalar Heroku CLI**
```bash
# macOS
brew install heroku/brew/heroku

# Windows
# Descarga desde: https://devcenter.heroku.com/articles/heroku-cli

# Linux
curl https://cli-assets.heroku.com/install.sh | sh
```

#### **Paso 2: Login y Crear App**
```bash
heroku login
heroku create clinica-dental-backend
```

#### **Paso 3: Configurar Variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=tu_jwt_secret_seguro
heroku config:set WHATSAPP_PHONE_NUMBER=34664218253
heroku config:set CLINIC_PHONE=916410841
heroku config:set CLINIC_MOBILE=664218253
heroku config:set CLINIC_EMAIL=info@rubiogarciadental.com
```

#### **Paso 4: Deployment**
```bash
git push heroku main
```

---

## 🗄️ **CONFIGURACIÓN DE BASE DE DATOS**

### **Opción 1: SQL Server en la Nube**
**Proveedores recomendados:**
- **Azure SQL Database**
- **AWS RDS SQL Server**
- **Google Cloud SQL**

### **Opción 2: PostgreSQL (Más Fácil)**
**Si usas Railway/Render, pueden generar automáticamente**

### **Opción 3: Migrar a PostgreSQL**
Si prefieres evitar SQL Server complexity:

1. **Cambiar drivers en package.json**
```json
{
  "dependencies": {
    "pg": "^8.8.0"
  }
}
```

2. **Actualizar connections en `config/database.js`**

---

## 🤖 **CONFIGURACIÓN DE OLLAMA**

### **Para Producción, necesitas Ollama en Servidor**

#### **Opción 1: Servidor Dedicado**
```bash
# Instalar Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Configurar para producción
sudo systemctl enable ollama
sudo systemctl start ollama

# Probar
curl http://localhost:11434/api/tags
```

#### **Opción 2: API Externa (Temporal)**
Mientras configuras Ollama, puedes usar:
```env
# Usar API de terceros temporalmente
OLLAMA_URL=https://api.llama-api.com
OLLAMA_MODEL=llama3.2:3b
```

---

## 📱 **CONFIGURACIÓN DE WHATSAPP**

### **Baileys requiere configuración especial en Producción**

#### **Opción 1: Webhook (Recomendado)**
```javascript
// Configurar webhook para mensajes
const webhookHandler = {
  async handleMessage(phoneNumber, message) {
    // Procesar mensaje
    const response = await aiEngine.generateResponse(message);
    await whatsappService.sendMessage(phoneNumber, response);
  }
};
```

#### **Opción 2: WhatsApp Business API**
```env
# Para usar API oficial
WHATSAPP_TOKEN=tu_business_api_token
WHATSAPP_PHONE_NUMBER_ID=id_del_phone_number
WHATSAPP_VERIFY_TOKEN=tu_verify_token
```

---

## 🔧 **VARIABLES DE ENTORNO ESENCIALES**

### **Variables Obligatorias**
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=tu_jwt_secret_de_64_caracteres_minimo

# Base de Datos (una de estas opciones)
# SQL Server
DB_SERVER=servidor-sql-server.com
DB_DATABASE=RubioGarciaDental
DB_USER=rubio_dental_user
DB_PASSWORD=password_seguro

# PostgreSQL (si usas Railway/Render)
DB_HOST=host-postgres.com
DB_PORT=5432
DB_NAME=rubio_dental_db
DB_USER=usuario_postgres
DB_PASSWORD=password_postgres

# Clínica
CLINIC_PHONE=916410841
CLINIC_MOBILE=664218253
CLINIC_EMAIL=info@rubiogarciadental.com

# WhatsApp
WHATSAPP_PHONE_NUMBER=34664218253

# LOPD
LOPD_ENABLED=true
GDPR_COMPLIANCE_VERSION=2.0
```

### **Variables Opcionales**
```env
# AI Engine
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
OLLAMA_MAX_TOKENS=50000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logs
LOG_LEVEL=info
```

---

## 🚨 **CHECKLIST ANTES DE DEPLOY**

### ✅ **Pre-Deploy**
- [ ] **GitHub repository** configurado y código subido
- [ ] **Variables de entorno** preparadas
- [ ] **Base de datos** configurada y accesible
- [ ] **JWT_SECRET** generado (64 caracteres mínimo)
- [ ] **Dominio personalizado** (opcional)

### ✅ **Post-Deploy**
- [ ] **Health check** funcionando: `/health`
- [ ] **API endpoints** respondiendo correctamente
- [ ] **Logs** sin errores críticos
- [ ] **SSL/HTTPS** configurado automáticamente
- [ ] **Base de datos** conectada correctamente

---

## 📊 **URLs FINALES ESPERADAS**

### **Render.com**
```
https://clinica-dental-backend.onrender.com
https://clinica-dental-backend.onrender.com/api/health
https://clinica-dental-backend.onrender.com/whatsapp-panel.html
```

### **Railway**
```
https://tu-proyecto.up.railway.app
https://tu-proyecto.up.railway.app/api/health
https://tu-proyecto.up.railway.app/whatsapp-panel.html
```

### **Heroku**
```
https://clinica-dental-backend.herokuapp.com
https://clinica-dental-backend.herokuapp.com/api/health
https://clinica-dental-backend.herokuapp.com/whatsapp-panel.html
```

---

## 🎯 **RECOMENDACIÓN FINAL**

### **Para empezar rápidamente:**
1. **Usa Render.com** (plan gratuito + fácil)
2. **Configura solo variables esenciales**
3. **Usa PostgreSQL** (Railway/Render lo incluyen)
4. **Configura Ollama en servidor separado después**

### **Para producción completa:**
1. **Render.com para MVP**
2. **Migrar a DigitalOcean/AWS después**
3. **Configurar Ollama en servidor dedicado**
4. **Implementar WhatsApp Business API**

---

## 🆘 **¿PROBLEMAS?**

### **Error de conexión a BD**
```bash
# Verificar variables de entorno en la plataforma
# Probar conexión manualmente
```

### **Error de JWT**
```bash
# Regenerar JWT_SECRET más largo
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### **App no inicia**
```bash
# Revisar logs en la plataforma
# Verificar que PORT es configurable automáticamente
```

---

## 🎉 **¡LISTO PARA DEPLOY!**

Tu código está preparado en GitHub. **Elige una plataforma y despliega en minutos**.

**¿Por dónde empezamos? ¿Render.com o Railway?**