# 🚀 Guía de Despliegue - GitHub + Render.com

## 📋 Preparación del Proyecto para GitHub

### 1. Verificar Estructura del Proyecto
```bash
# Estructura final necesaria
backend/
├── .env.example          # ✅ Variables de entorno plantilla
├── .gitignore            # ✅ Archivos ignorados
├── Dockerfile            # ✅ Contenedor Docker
├── docker-compose.yml    # ✅ Orquestación
├── render.yaml           # ✅ Configuración Render.com
├── package.json          # ✅ Dependencias
├── README.md             # ✅ Documentación
├── scripts/
│   ├── init-database.sql # ✅ Script PostgreSQL
│   └── test-endpoints.js # ✅ Tests de API
├── config/
│   └── database.js       # ✅ Configuración multi-DB
├── controllers/          # ✅ Controladores API
├── routes/               # ✅ Rutas API
├── middleware/           # ✅ Middleware
└── server.js             # ✅ Servidor principal
```

### 2. Limpiar Archivos Locales
```bash
# Eliminar archivos sensibles del repositorio
rm -rf .env               # Nunca subir a Git
rm -rf node_modules/      # Se instala en deployment
rm -rf logs/              # Logs locales
rm -rf sessions/          # Sesiones WhatsApp
rm -rf uploads/           # Archivos temporales

# Mantener solo archivos de configuración
cp .env .env.example      # Plantilla para otros desarrolladores
```

### 3. Configurar Git
```bash
git init
git add .
git commit -m "Sistema de Gestión Dental - Backend completo

- 47 endpoints implementados
- WhatsApp con Baileys
- Facturación Verifactu
- Contabilidad avanzada
- Compliance LOPD/RGPD
- Configuración para Render.com
- Soporte SQL Server + PostgreSQL"

git branch -M main
git remote add origin https://github.com/tu-usuario/clinica-dental-backend.git
git push -u origin main
```

---

## 🌐 Despliegue en Render.com

### Paso 1: Configurar Cuenta en Render.com

1. **Crear cuenta:** https://render.com
2. **Conectar GitHub:** Autorizar acceso a tus repositorios
3. **Crear Web Service:** 
   - Connect a repository
   - Seleccionar: `clinica-dental-backend`
   - Branch: `main`

### Paso 2: Configurar Web Service

#### Configuración Básica:
- **Name:** `clinica-dental-backend`
- **Region:** `Frankfurt (EU Central)` (más cercano a España)
- **Branch:** `main`
- **Root Directory:** (dejar vacío)
- **Runtime:** `Node`

#### Configuración de Build/Deploy:
- **Build Command:** `npm install --production`
- **Start Command:** `npm start`
- **Auto-Deploy:** `Yes`

#### Variables de Entorno (Environment):
```bash
# === CONFIGURACIÓN BÁSICA ===
NODE_ENV=production
PORT=3000

# === BASE DE DATOS (Render PostgreSQL) ===
DB_SERVER=tu-postgres-host.render.com
DB_DATABASE=clinica_dental
DB_USER=tu-usuario
DB_PASSWORD=tu-password
DB_PORT=5432
DB_TYPE=postgres

# === JWT ===
JWT_SECRET=tu_jwt_secret_super_seguro_2025_cambiar_en_produccion

# === CLÍNICA ===
CLINIC_NAME=Clínica Dental Rubio García
CLINIC_TAX_ID=B12345678
CLINIC_ADDRESS=Calle Principal 123, 28001 Madrid
CLINIC_PHONE=915555555
CLINIC_EMAIL=info@clinicadental.com

# === WHATSAPP ===
WHATSAPP_PHONE_NUMBER=34600123456
WHATSAPP_COUNTRY_CODE=34
WHATSAPP_SESSION_NAME=clinica-dental-session

# === VERIFACTU ===
VERIFACTU_API_KEY=tu_verifactu_api_key
VERIFACTU_ENVIRONMENT=production
VERIFACTU_CAFD=tu_codigo_activacion

# === SEGURIDAD ===
CORS_ORIGIN=https://tu-frontend-dominio.com,https://tu-clinica.com
HELMET_ENABLED=true

# === COMPLIANCE ===
LOPD_RETENTION_YEARS=5
RGPD_CONSENT_REQUIRED=true
AUDIT_LOG_ENABLED=true
```

### Paso 3: Crear Base de Datos PostgreSQL

1. **En Render Dashboard:**
   - New → PostgreSQL
   - Name: `clinica-dental-db`
   - Region: `Frankfurt (EU Central)`
   - Plan: `Standard` (recomendado para producción)

2. **Obtener credenciales:**
   - Internal Database URL
   - External Database URL
   - Copy y pegar en variables de entorno

### Paso 4: Configurar Health Check

Render.com verificará automáticamente:
```bash
# Health Check Path: /api/system/health
# Verifica que el servicio esté funcionando
```

### Paso 5: Desplegar

1. **Click "Create Web Service"**
2. **Esperar build (5-10 minutos)**
3. **Verificar logs de deployment**
4. **Probar endpoints:**

```bash
# Verificar health check
curl https://tu-servicio.onrender.com/api/system/health

# Verificar endpoints principales
curl https://tu-servicio.onrender.com/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"JMD","password":"190582"}'

# Verificar base de datos
curl https://tu-servicio.onrender.com/api/system/database
```

---

## 🔧 Configuración Post-Despliegue

### 1. Configurar WhatsApp Baileys

**⚠️ IMPORTANTE:** Baileys requiere mantener una sesión activa.

```bash
# El sistema creará automáticamente:
# - sessions/ (sesión WhatsApp)
# - logs/ (registros de actividad)

# Para mantener la sesión WhatsApp activa:
# - El servidor debe estar siempre corriendo
# - Usar Render.com "Always On" (plan pago)
# - O configurar wake-up requests cada 14 minutos
```

### 2. Configurar Verifactu

1. **Registrar en AEAT** (Agencia Tributaria)
2. **Obtener credenciales de producción**
3. **Actualizar variables de entorno:**
   ```
   VERIFACTU_API_KEY=tu_api_key_real_produccion
   VERIFACTU_ENVIRONMENT=production
   ```

### 3. Configurar Dominio Personalizado (Opcional)

```bash
# En Render.com:
# Settings → Custom Domains
# Add Domain: api.tu-clinica.com

# Configurar DNS:
# CNAME api.tu-clinica.com → tu-servicio.onrender.com
```

### 4. Configurar SSL Automático

Render.com proporciona SSL automático para dominios personalizados.

---

## 📊 Monitoreo y Logs

### Logs en Render.com
- **Build Logs:** Durante el deployment
- **Deploy Logs:** Registros de inicio/parada
- **Application Logs:** Logs de la aplicación

### Endpoints de Monitoreo
```bash
# Health check completo
GET /api/system/health

# Estado de base de datos
GET /api/system/database

# Estado de conexiones
GET /api/system/status

# Logs del sistema
GET /api/system/logs
```

### Métricas Importantes
- **Response Time:** < 500ms
- **Uptime:** > 99.5%
- **Error Rate:** < 1%
- **Database Connections:** < 80% del límite

---

## 🔄 Actualizaciones del Sistema

### 1. Actualización Manual
```bash
git add .
git commit -m "Actualización: descripción del cambio"
git push origin main

# Render.com detectará el cambio automáticamente
# Nuevo deployment en ~5-10 minutos
```

### 2. Actualización con Git Tags
```bash
git tag -a v1.1.0 -m "Versión 1.1.0 - Nuevas funcionalidades"
git push origin v1.1.0

# Configurar Render.com para deploy desde tags específicos
```

---

## 🛡️ Seguridad en Producción

### Variables de Seguridad Críticas
```bash
# CAMBIAR SIEMPRE EN PRODUCCIÓN:
JWT_SECRET=clave_super_secreta_diferente_cada_vez

# WHATSAPP: Usar número dedicado a la clínica
WHATSAPP_PHONE_NUMBER=numero_real_Clinica

# BASE DE DATOS: Usar credenciales de Render.com
DB_SERVER=postgres.render.com
DB_USER=render_user
```

### Configuración CORS
```bash
# Especificar dominios exactos (nunca usar *)
CORS_ORIGIN=https://tu-frontend.com,https://admin.tu-frontend.com
```

### Backup Automático
- Render.com crea backups automáticos de PostgreSQL
- Retention: 7 días (plan gratuito), 30 días (plan pago)

---

## 💰 Costos Estimados

### Plan Gratuito Render.com
- **Limitaciones:** 
  - Servicio se apaga después de 15 min sin tráfico
  - Database limitada
  - Sin SSL personalizado
- **Recomendado para:** Testing, desarrollo

### Plan Hobby ($7/mes)
- **Ventajas:**
  - Siempre activo
  - Database más grande
  - SSL personalizado
  - Soporte
- **Recomendado para:** Producción pequeña clínica

### Plan Standard ($25/mes)
- **Ventajas:**
  - Múltiples servicios
  - Database dedicada
  - Mejor performance
- **Recomendado para:** Clínicas medianas

---

## 🚨 Resolución de Problemas

### Error: Build Failed
```bash
# Verificar en logs:
# - Node.js versión (usar Node 20 en render.yaml)
# - Dependencias incompatibles
# - Variables de entorno faltantes
```

### Error: Database Connection
```bash
# Verificar:
# - Credenciales de PostgreSQL
# - Variables DB_TYPE=postgres
# - Connection string correcta
```

### Error: WhatsApp Disconnected
```bash
# Baileys requiere:
# - Servicio siempre activo
# - Configurar "Always On" en Render.com
# - Verificar logs de sesión
```

### Error: High Response Time
```bash
# Optimizaciones:
# - Reducir consultas a base de datos
# - Implementar caching con Redis
# - Optimizar índices de base de datos
```

---

## ✅ Checklist Final

### Antes del Primer Deploy
- [ ] Repositorio GitHub creado y código subido
- [ ] Variables de entorno configuradas
- [ ] Tests ejecutados localmente
- [ ] Backup de datos existentes

### Durante el Deploy
- [ ] Build successful
- [ ] Health check passing
- [ ] Database connections working
- [ ] Endpoints responding

### Después del Deploy
- [ ] WhatsApp configurado y conectado
- [ ] Verifactu configurado (si aplica)
- [ ] Dominio personalizado configurado (opcional)
- [ ] Monitoreo configurado
- [ ] Backup automático funcionando

---

## 📞 Soporte

- **Render.com Docs:** https://render.com/docs
- **GitHub Actions:** https://docs.github.com/en/actions
- **PostgreSQL Docs:** https://www.postgresql.org/docs/

---

**🎉 ¡Sistema desplegado y funcionando en la nube!**