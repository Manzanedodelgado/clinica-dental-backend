# Dockerfile para Sistema de Gestión Dental
# Optimizado para Render.com y otros servicios de hosting

# Usar imagen oficial de Node.js 20 LTS
FROM node:20-alpine

# Información del contenedor
LABEL maintainer="MiniMax Agent"
LABEL description="Sistema de Gestión Dental - Clínica Rubio García"
LABEL version="1.0.0"

# Crear directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Copiar archivos de configuración de Node.js
COPY package*.json ./

# Instalar dependencias de Node.js
RUN npm ci --only=production && npm cache clean --force

# Crear directorios necesarios para la aplicación
RUN mkdir -p logs sessions certs uploads

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Cambiar propietario de la aplicación al usuario nodejs
RUN chown -R nodejs:nodejs /app

# Cambiar al usuario no-root
USER nodejs

# Exponer puerto
EXPOSE 3000

# Health check para Render.com
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/system/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => { process.exit(1) })"

# Comando de inicio
CMD ["npm", "start"]