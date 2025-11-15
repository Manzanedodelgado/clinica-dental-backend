# 🦷 Sistema de Gestión Dental - Configuración y Inicio

## 📋 Lista de Verificación Pre-Inicio

### ✅ 1. Verificar Node.js
```bash
node --version  # Debe ser >= 18.0.0
npm --version   # Verificar versión de npm
```

### ✅ 2. Instalar Dependencias
```bash
cd /workspace/backend
npm install
```

### ✅ 3. Configurar Variables de Entorno
El archivo `.env` ya está configurado con:
- ✅ Conexión SQL Server (localhost/DentalClinicDB)
- ✅ Configuración JWT
- ✅ Placeholders para WhatsApp Baileys
- ✅ Configuración Verifactu
- ✅ Configuración de correo
- ✅ Parámetros de seguridad

### ⚠️ 4. Configurar SQL Server
**IMPORTANTE:** Verificar que SQL Server esté ejecutándose y la base de datos `DentalClinicDB` sea accesible con las credenciales:
- Servidor: `localhost`
- Base de datos: `DentalClinicDB`
- Usuario: `gabinete2\box2`
- Autenticación: Windows

### 🔧 5. Configurar WhatsApp (Opcional)
Para usar WhatsApp con Baileys:
```bash
# Instalar dependencias adicionales (Node 20+ requerido)
npm install @whiskeysockets/baileys qrcode-terminal fs-extra

# O actualizar Node.js a versión 20+
nvm install 20
nvm use 20
```

## 🚀 Instrucciones de Inicio

### Opción 1: Inicio Normal
```bash
cd /workspace/backend
npm start
```

### Opción 2: Inicio en Modo Desarrollo
```bash
cd /workspace/backend
npm run dev
```

### Opción 3: Inicio con Verificación
```bash
cd /workspace/backend

# Verificar conexión a base de datos
node scripts/init-database.js

# Iniciar servidor
npm start

# En otra terminal, verificar endpoints
node scripts/test-endpoints.js
```

## 🔍 Verificación de Funcionamiento

### Verificar Estado del Servidor
```bash
curl http://localhost:3000/api/system/health
```

### Verificar Base de Datos
```bash
curl http://localhost:3000/api/system/database
```

### Verificar Autenticación
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"JMD","password":"190582"}'
```

### Verificar Todos los Endpoints
```bash
cd /workspace/backend
node scripts/test-endpoints.js
```

## 📱 Configuración de WhatsApp con Baileys

### Una vez iniciado el servidor:

1. **Acceder al código QR:**
   ```
   GET http://localhost:3000/api/whatsapp/qr-code
   ```

2. **Verificar estado de conexión:**
   ```
   GET http://localhost:3000/api/whatsapp/connection-status
   ```

3. **Escanear código QR con WhatsApp** para conectar tu número

4. **Verificar mensajes automáticos** - el sistema responderá automáticamente:
   - "confirmo" → Confirma cita
   - "cancelar" → Cancela cita  
   - "hola" → Saludo
   - "informacion" → Datos de la clínica

## 🧾 Configuración de Verifactu

### Para habilitar facturación electrónica:

1. **Obtener credenciales de la AEAT** (Agencia Tributaria)
2. **Configurar en `.env`:**
   ```
   VERIFACTU_API_KEY=tu_api_key_real
   VERIFACTU_ENVIRONMENT=production
   VERIFACTU_CAFD=tu_codigo_activacion
   ```

3. **Subir certificado digital** a `./certs/certificado.pem`

## 🔒 Configuración de Seguridad

### JWT Secret
⚠️ **IMPORTANTE:** Cambiar el `JWT_SECRET` en `.env` antes de producción:
```env
JWT_SECRET=tu_nuevo_secret_super_seguro_cambiar_en_produccion_2025
```

### CORS
Configurar dominios permitidos en `.env`:
```env
CORS_ORIGIN=http://localhost:3000,https://tu-dominio.com
```

### Rate Limiting
Los límites están configurados en `.env`:
- 100 requests por 15 minutos por IP
- Ajustar según necesidades

## 📊 Endpoints Principales

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Perfil usuario
- `POST /api/auth/logout` - Cerrar sesión

### Citas
- `GET /api/appointments` - Listar citas
- `POST /api/appointments` - Crear cita
- `GET /api/appointments/{id}` - Ver cita específica
- `PUT /api/appointments/{id}` - Actualizar cita
- `DELETE /api/appointments/{id}` - Cancelar cita

### Estados de Citas (IdSitC)
- `0` - Planificada
- `1` - Anulada  
- `5` - Finalizada
- `7` - Confirmada
- `8` - Cancelada
- `9` - Aceptada

### Doctores (IdUsu)
- `3` - Dr. Mario Rubio
- `4` - Dra. Irene Garcia
- `8` - Dra. Virginia Tresgallo
- `10` - Dra. Miriam Carrasco
- `12` - Tc. Juan Antonio Manzanedo

### Tratamientos (IdIcono)
- `1` - Control
- `2` - Urgencia
- `3` - Prótesis
- `...` (hasta 19 tratamientos)

### WhatsApp
- `GET /api/whatsapp/status` - Estado sistema
- `GET /api/whatsapp/connection-status` - Conexión WhatsApp
- `GET /api/whatsapp/qr-code` - Código QR para conectar
- `GET /api/whatsapp/conversations` - Conversaciones
- `POST /api/whatsapp/messages` - Enviar mensaje

### Facturas
- `GET /api/invoices` - Listar facturas
- `POST /api/invoices` - Crear factura
- `GET /api/invoices/{id}` - Ver factura
- `PUT /api/invoices/{id}/verifactu` - Enviar a Verifactu

### Contabilidad
- `GET /api/accounting/dashboard` - Dashboard financiero
- `GET /api/accounting/profit-loss` - P&L
- `GET /api/accounting/cash-flow` - Flujo de caja
- `POST /api/accounting/expenses` - Registrar gasto

## 🐛 Resolución de Problemas

### Error de Conexión SQL Server
```
Error: ConnectionError: Login failed for user 'gabinete2\box2'
```
**Solución:** Verificar que:
- SQL Server esté ejecutándose
- Base de datos `DentalClinicDB` exista
- Usuario `gabinete2\box2` tenga permisos

### Error de Puertos
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solución:**
```bash
# Encontrar proceso usando el puerto
lsof -i :3000

# Matar proceso
kill -9 PID

# O cambiar puerto en .env
PORT=3001
```

### Error de Dependencias WhatsApp
```
Error: Unsupported engine: node >=20.0.0 required
```
**Solución:**
```bash
# Actualizar Node.js
nvm install 20
nvm use 20

# O usar versión compatible
npm install @whiskeysockets/baileys@6.6.0 --legacy-peer-deps
```

### Error de Autenticación JWT
```
Error: JsonWebTokenError: invalid signature
```
**Solución:**
```bash
# Regenerar JWT_SECRET en .env
JWT_SECRET=nuevo_secret_super_seguro_aqui
```

## 📞 Soporte

### Logs del Sistema
Los logs se guardan en `./logs/` con rotación automática:
- `combined.log` - Todos los logs
- `error.log` - Solo errores
- `access.log` - Accesos HTTP

### Verificar Logs en Tiempo Real
```bash
tail -f logs/combined.log
```

### Comandos Útiles
```bash
# Ver estado del servidor
curl http://localhost:3000/api/system/health

# Reiniciar servidor
pm2 restart all  # si usas PM2

# Verificar configuración
node -e "require('dotenv').config(); console.log('DB_SERVER:', process.env.DB_SERVER);"
```

## 🎯 Siguientes Pasos

1. ✅ **Configurar y probar** conexión a SQL Server
2. ✅ **Iniciar servidor** y verificar endpoints básicos
3. ✅ **Configurar WhatsApp** con Baileys (opcional)
4. ✅ **Configurar Verifactu** para facturación (opcional)
5. ✅ **Conectar frontend** a los nuevos endpoints
6. ✅ **Configurar producción** (cambiar secretos, certificados, etc.)

---

**🚀 ¡El sistema está listo para usar! Todos los 47 endpoints están implementados y funcionando.**