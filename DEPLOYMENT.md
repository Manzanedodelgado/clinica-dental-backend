# 🚀 Guía de Despliegue en Producción

## 📋 Checklist de Producción

### ✅ Pre-requisitos
- [ ] SQL Server 2016+ configurado
- [ ] SSL/TLS certificados instalados
- [ ] Dominio/subdominio configurado
- [ ] Firewall configurado (puertos 80, 443, 1433)
- [ ] Backup automático de BD configurado

### ✅ Seguridad
- [ ] Contraseña de administrador cambiada
- [ ] JWT_SECRET con valor seguro aleatorio
- [ ] Variables de entorno en production
- [ ] Rate limiting configurado
- [ ] Logs de seguridad habilitados

### ✅ Rendimiento
- [ ] Base de datos optimizada (índices)
- [ ] Cache Redis configurado (opcional)
- [ ] Load balancer configurado (si necesario)
- [ ] Monitoreo de recursos habilitado

### ✅ Compliance
- [ ] GDPR/LOPD configurado
- [ ] Auditoría habilitada
- [ ] Política de retención de datos
- [ ] Certificados SSL válidos

## 🏗️ Arquitectura de Producción

```
Internet
    ↓
SSL/TLS Termination (Nginx/Apache)
    ↓
Load Balancer (Opcional)
    ↓
Node.js Application Servers (Cluster)
    ↓
SQL Server Cluster
    ↓
Backup System
```

## 🔧 Configuración de Producción

### 1. Variables de Entorno

```bash
# .env.production
NODE_ENV=production
PORT=3000

# Base de Datos
DB_SERVER=prod-db-server.com
DB_DATABASE=RubioGarciaDental
DB_USER=rubio_dental_user
DB_PASSWORD=<secure_password>
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false

# Seguridad
JWT_SECRET=<generate_secure_random_64_chars>
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@rubiogacialdental.com
SMTP_PASSWORD=<app_specific_password>

# LOPD/Compliance
LOPD_ENABLED=true
GDPR_COMPLIANCE_VERSION=2.0
LEGAL_DOCUMENTS_PATH=/secure/legal-docs

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logs
LOG_LEVEL=info
LOG_FILE=/var/log/rubio-dental/api.log

# Whitelist de CORS
CORS_ORIGINS=https://rubiogacialdental.com,https://admin.rubiogacialdental.com
```

### 2. Generar JWT Secret Seguro

```bash
# Generar secreto aleatorio
openssl rand -hex 64
# o usar Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Configurar SSL/TLS

#### Nginx (Recomendado)
```nginx
server {
    listen 443 ssl http2;
    server_name api.rubiogacialdental.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Apache
```apache
<VirtualHost *:443>
    ServerName api.rubiogacialdental.com
    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem
    
    ProxyPass /api/ http://localhost:3000/api/
    ProxyPassReverse /api/ http://localhost:3000/api/
</VirtualHost>
```

## 📦 Proceso de Despliegue

### Opción 1: Despliegue Manual

1. **Preparar servidor**
```bash
# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 para gestión de procesos
sudo npm install -g pm2

# Crear usuario para la aplicación
sudo adduser rubio-dental
sudo usermod -aG sudo rubio-dental
```

2. **Clonar y configurar**
```bash
sudo -u rubio-dental git clone <repository> /opt/rubio-dental-api
cd /opt/rubio-dental-api
sudo -u rubio-dental npm install --production
```

3. **Configurar variables**
```bash
sudo -u rubio-dental cp .env.example .env.production
sudo -u rubio-dental nano .env.production
```

4. **Inicializar base de datos**
```bash
sudo -u rubio-dental npm run init-db
```

5. **Configurar PM2**
```bash
# Crear ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'rubio-dental-api',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024'
  }]
};
EOF

# Iniciar con PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

6. **Configurar Nginx**
```bash
sudo cp nginx-config.conf /etc/nginx/sites-available/rubio-dental-api
sudo ln -s /etc/nginx/sites-available/rubio-dental-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Opción 2: Docker (Recomendado)

1. **Crear Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./
RUN npm ci --only=production

# Copiar código
COPY . .

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Crear directorios de logs
RUN mkdir -p logs && chown -R nodejs:nodejs logs

USER nodejs

EXPOSE 3000

CMD ["npm", "start"]
```

2. **docker-compose.yml**
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - api
    restart: unless-stopped

volumes:
  logs:
```

3. **Desplegar**
```bash
docker-compose up -d
```

## 🔍 Monitoreo y Mantenimiento

### Health Checks
```bash
# Health check externo
curl https://api.rubiogacialdental.com/health

# Health check interno
curl http://localhost:3000/health
```

### Logs
```bash
# Ver logs en tiempo real
tail -f /opt/rubio-dental-api/logs/combined.log

# Ver logs de errores
tail -f /opt/rubio-dental-api/logs/err.log

# Ver logs con PM2
pm2 logs rubio-dental-api
```

### Métricas
```bash
# Uso de recursos
pm2 monit

# Estado de la aplicación
pm2 status

# Reiniciar aplicación
pm2 restart rubio-dental-api

# Actualizar aplicación
pm2 reload rubio-dental-api
```

### Backup de Base de Datos
```bash
# Backup diario automatizado
crontab -e
# Agregar línea:
0 2 * * * /usr/bin/sqlcmd -S server -E -Q "BACKUP DATABASE RubioGarciaDental TO DISK = '/backups/BD_$(date +\%Y\%m\%d).bak'"

# Rotación de backups (mantener 30 días)
find /backups -name "BD_*.bak" -mtime +30 -delete
```

## 🚨 Solución de Problemas

### Aplicación no inicia
```bash
# Verificar logs
tail -f logs/error.log

# Verificar variables de entorno
cat .env.production

# Verificar conexión BD
npm run test-db-connection

# Verificar permisos
ls -la logs/
```

### Problemas de rendimiento
```bash
# Monitorear recursos
top -p $(pgrep -f "node server.js")

# Ver uso de memoria
pm2 monit

# Optimizar BD
sqlcmd -S server -E -Q "EXEC sp_updatestats"
```

### Problemas de SSL
```bash
# Verificar certificado
openssl x509 -in /path/to/cert.pem -text -noout

# Test SSL
curl -I https://api.rubiogacialdental.com

# Verificar configuración Nginx
nginx -t
```

## 📊 Dashboard de Monitoreo

### Métricas Clave
- **Tiempo de respuesta API**: < 200ms
- **Uso de CPU**: < 80%
- **Uso de memoria**: < 80%
- **Errores 5xx**: < 1%
- **Disponibilidad**: > 99.9%

### Alertas Recomendadas
- Error rate > 5% por 5 minutos
- Response time > 1s por 3 minutos
- CPU usage > 90% por 10 minutos
- Disk space < 10% disponible
- Database connection errors

## 🔐 Configuración de Seguridad Adicional

### Firewall (UFW)
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Fail2Ban
```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

### Actualizaciones Automáticas
```bash
# Configurar actualizaciones de seguridad
sudo unattended-upgrade -d
```

## 📞 Contacto de Soporte

- **Email**: support@rubiogacialdental.com
- **Documentación**: https://docs.rubiogacialdental.com
- **Estado del servicio**: https://status.rubiogacialdental.com

---

✅ **¡Listo para producción!** 

El backend está completamente configurado para despliegue en producción con todas las medidas de seguridad, monitoreo y escalabilidad necesarias.