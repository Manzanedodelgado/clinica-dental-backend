# 🚀 Guía de Instalación Rápida - Backend API

## ⚡ Instalación en 5 Minutos

### 1. Instalar Dependencias
```bash
cd backend
npm install
```

### 2. Configurar Variables de Entorno
```bash
cp .env.example .env
```

Editar `.env` con tus datos:
```env
PORT=3000
DB_SERVER=localhost
DB_DATABASE=RubioGarciaDental
DB_USER=sa
DB_PASSWORD=TuPassword
JWT_SECRET=MiJWTSecretSeguro2025
```

### 3. Configurar Base de Datos

#### Opción A: Script Automático (Recomendado)
```bash
npm run init-db
```

#### Opción B: Manual
1. Crear base de datos en SQL Server:
   ```sql
   CREATE DATABASE RubioGarciaDental;
   ```
2. Ejecutar contenido de `scripts/init-database.js`

### 4. Iniciar Servidor
```bash
# Desarrollo (con recarga automática)
npm run dev

# Producción
npm start
```

### 5. Verificar Instalación
```bash
# Health Check
curl http://localhost:3000/health

# API Info
curl http://localhost:3000/api

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}'
```

## 🔐 Credenciales por Defecto

**Usuario Administrador:**
- Usuario: `admin`
- Contraseña: `Admin123!`
- Email: `admin@rubiogacialdental.com`

⚠️ **CAMBIAR LA CONTRASEÑA INMEDIATAMENTE EN PRODUCCIÓN**

## 📋 Verificación Rápida

### Base de Datos Conectada
```bash
curl http://localhost:3000/api/system/health
```
✅ Debe devolver: `"status": "healthy"`

### Autenticación Funcionando
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}'
```
✅ Debe devolver: `accessToken` y `refreshToken`

### API Endpoints
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/appointments
```
✅ Debe devolver lista de citas (vacía inicialmente)

## 🛠️ Solución de Problemas Comunes

### Error de Conexión a BD
```
Error: Login failed for user 'sa'
```
**Solución:**
1. Verificar que SQL Server está ejecutándose
2. Verificar credenciales en `.env`
3. Habilitar autenticación SQL en SQL Server

### Puerto en Uso
```
Error: listen EADDRINUSE :::3000
```
**Solución:**
```bash
# Cambiar puerto en .env
PORT=3001

# O matar proceso
kill -9 $(lsof -ti:3000)
```

### Error de Dependencias
```
npm ERR! peer dep missing
```
**Solución:**
```bash
# Limpiar cache e instalar
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 📁 Estructura de Archivos Importantes

```
backend/
├── .env                    # ⚙️ Configuración (editar)
├── server.js               # 🚀 Servidor principal
├── package.json            # 📦 Dependencias
├── scripts/init-database.js # 🗄️ Inicialización BD
└── README.md              # 📚 Documentación completa
```

## 🔧 Comandos Útiles

```bash
# Instalar dependencias
npm install

# Iniciar en desarrollo
npm run dev

# Iniciar en producción
npm start

# Inicializar base de datos
npm run init-db

# Ejecutar tests
npm test

# Ver logs
tail -f logs/combined.log
```

## 🌐 Endpoints Básicos a Probar

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/health` | GET | Estado del sistema |
| `/api` | GET | Información de la API |
| `/api/auth/login` | POST | Iniciar sesión |
| `/api/appointments` | GET | Listar citas |
| `/api/patients` | GET | Listar pacientes |
| `/api/system/stats` | GET | Estadísticas |

## 📞 ¿Necesitas Ayuda?

1. **Revisar logs:** `tail -f logs/error.log`
2. **Verificar configuración:** Revisar variables en `.env`
3. **Comprobar BD:** Verificar conexión SQL Server
4. **Documentación completa:** Ver `README.md`

¡El backend debería estar funcionando en menos de 5 minutos! 🎉