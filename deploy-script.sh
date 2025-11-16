#!/bin/bash

# 🎯 SCRIPT DE DEPLOY AUTOMÁTICO
# Clinica Dental Backend - Cloud Deployment

echo "🚀 INICIANDO DEPLOY AUTOMÁTICO..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error "Error: No se encontró package.json. Ejecuta desde el directorio raíz del proyecto."
    exit 1
fi

success "Directorio del proyecto encontrado"

# Función para generar JWT_SECRET
generate_jwt_secret() {
    log "Generando JWT_SECRET seguro..."
    if command -v node &> /dev/null; then
        JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
        echo "JWT_SECRET=$JWT_SECRET"
        success "JWT_SECRET generado: ${JWT_SECRET:0:32}..."
    else
        JWT_SECRET=$(openssl rand -hex 64)
        echo "JWT_SECRET=$JWT_SECRET"
        success "JWT_SECRET generado: ${JWT_SECRET:0:32}..."
    fi
}

# Función para verificar dependencias
check_dependencies() {
    log "Verificando dependencias..."
    
    # Verificar Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        success "Node.js encontrado: $NODE_VERSION"
    else
        error "Node.js no está instalado. Instálalo desde: https://nodejs.org"
        exit 1
    fi
    
    # Verificar npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        success "npm encontrado: v$NPM_VERSION"
    else
        error "npm no está instalado"
        exit 1
    fi
    
    # Verificar git
    if command -v git &> /dev/null; then
        success "Git encontrado"
    else
        warning "Git no está instalado"
    fi
}

# Función para instalar dependencias
install_dependencies() {
    log "Instalando dependencias..."
    npm install
    if [ $? -eq 0 ]; then
        success "Dependencias instaladas correctamente"
    else
        error "Error al instalar dependencias"
        exit 1
    fi
}

# Función para verificar archivos críticos
check_critical_files() {
    log "Verificando archivos críticos..."
    
    critical_files=(
        "server.js"
        "package.json"
        ".env.example"
        "whatsapp-panel.html"
    )
    
    for file in "${critical_files[@]}"; do
        if [ -f "$file" ]; then
            success "Archivo encontrado: $file"
        else
            error "Archivo faltante: $file"
            exit 1
        fi
    done
}

# Función para generar .env para deploy
generate_deploy_env() {
    log "Generando archivo .env para deploy..."
    
    JWT_SECRET=$(generate_jwt_secret)
    
    cat > .env.deploy << EOF
# 🚀 CONFIGURACIÓN DE PRODUCCIÓN
# Generado automáticamente: $(date)

# Entorno
NODE_ENV=production
PORT=3000

# Seguridad - CRÍTICO: Cambiar estos valores
JWT_SECRET=$JWT_SECRET

# Base de Datos - CONFIGURAR ESTOS VALORES
DB_SERVER=tu-servidor-sql.com
DB_DATABASE=RubioGarciaDental
DB_USER=rubio_dental_user
DB_PASSWORD=password_seguro_aqui

# WhatsApp - Configurado
WHATSAPP_PHONE_NUMBER=34664218253

# Clínica - Configurado
CLINIC_PHONE=916410841
CLINIC_MOBILE=664218253
CLINIC_EMAIL=info@rubiogarciadental.com

# LOPD/GDPR - Habilitado
LOPD_ENABLED=true
GDPR_COMPLIANCE_VERSION=2.0

# Rate Limiting - Configurado
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# AI Engine - Configurado sin límites
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
OLLAMA_MAX_TOKENS=50000

# Logs
LOG_LEVEL=info

# CORS - Configurado para producción
CORS_ORIGINS=*
EOF

    success "Archivo .env.deploy generado"
    warning "⚠️  IMPORTANTE: Edita .env.deploy con tus valores reales antes del deploy"
}

# Función para crear comandos de deploy
create_deploy_commands() {
    log "Generando comandos de deploy..."
    
    cat > DEPLOY-COMMANDS.md << EOF
# 📋 COMANDOS DE DEPLOY

## 🌐 RENDER.COM
\`\`\`bash
# 1. Ir a render.com
# 2. Conectar GitHub
# 3. New Web Service
# 4. Seleccionar: clinica-dental-backend
# 5. Environment: Node
# 6. Build Command: npm install
# 7. Start Command: npm start
# 8. Variables: Copiar desde .env.deploy
\`\`\`

## 🚂 RAILWAY
\`\`\`bash
# 1. Ir a railway.app
# 2. New Project
# 3. Deploy from GitHub repo
# 4. Seleccionar: clinica-dental-backend
# 5. Variables: Copiar desde .env.deploy
\`\`\`

## ☁️ HEROKU
\`\`\`bash
heroku create tu-app-name
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$JWT_SECRET
# ... agregar todas las variables
git push heroku main
\`\`\`

## 🔧 VERIFICACIÓN POST-DEPLOY
\`\`\`bash
# Verificar que la app responde
curl https://tu-app-url.com/health

# Verificar panel WhatsApp
curl https://tu-app-url.com/whatsapp-panel.html
\`\`\`
EOF

    success "Comandos de deploy guardados en DEPLOY-COMMANDS.md"
}

# Función para crear script de verificación
create_verify_script() {
    log "Creando script de verificación..."
    
    cat > verify-deployment.sh << 'EOF'
#!/bin/bash

# 🔍 SCRIPT DE VERIFICACIÓN POST-DEPLOY

if [ $# -eq 0 ]; then
    echo "Uso: ./verify-deployment.sh <URL_DE_TU_APP>"
    echo "Ejemplo: ./verify-deployment.sh https://tu-app.onrender.com"
    exit 1
fi

BASE_URL=$1
echo "🔍 Verificando deploy en: $BASE_URL"

# Verificar health endpoint
echo -n "Health Check: "
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ OK"
else
    echo "❌ FAILED (HTTP $HEALTH_RESPONSE)"
fi

# Verificar API
echo -n "API Check: "
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api")
if [ "$API_RESPONSE" = "200" ] || [ "$API_RESPONSE" = "404" ]; then
    echo "✅ OK"
else
    echo "❌ FAILED (HTTP $API_RESPONSE)"
fi

# Verificar WhatsApp Panel
echo -n "WhatsApp Panel: "
PANEL_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/whatsapp-panel.html")
if [ "$PANEL_RESPONSE" = "200" ]; then
    echo "✅ OK"
else
    echo "❌ FAILED (HTTP $PANEL_RESPONSE)"
fi

echo "✅ Verificación completada"
EOF

    chmod +x verify-deployment.sh
    success "Script de verificación creado: verify-deployment.sh"
}

# Función principal
main() {
    echo ""
    echo "🎯 SCRIPT DE DEPLOY - CLÍNICA DENTAL BACKEND"
    echo "=============================================="
    echo ""
    
    check_dependencies
    check_critical_files
    install_dependencies
    generate_deploy_env
    create_deploy_commands
    create_verify_script
    
    echo ""
    success "🎉 ¡PREPARACIÓN COMPLETADA!"
    echo ""
    echo "📋 PRÓXIMOS PASOS:"
    echo "1. Edita .env.deploy con tus valores reales"
    echo "2. Ve a tu plataforma de deploy preferida:"
    echo "   - Render.com (recomendado)"
    echo "   - Railway.app"
    echo "   - Heroku"
    echo "3. Conecta tu repositorio de GitHub"
    echo "4. Copia las variables desde .env.deploy"
    echo "5. ¡Deploy!"
    echo ""
    echo "📖 Lee GUIA-DEPLOY-CLOUD.md para instrucciones detalladas"
    echo ""
}

# Ejecutar función principal
main

EOF

# Hacer ejecutable el script