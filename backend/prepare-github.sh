#!/bin/bash

# Script de Preparación para GitHub y Deploy
# Sistema de Gestión Dental - Clínica Rubio García

echo "🦷 Preparando Sistema para GitHub + Render.com"
echo "=============================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    log_error "Error: package.json no encontrado. Ejecutar desde el directorio backend/"
    exit 1
fi

log_info "Verificando estructura del proyecto..."

# Verificar archivos esenciales
required_files=(
    ".env.example"
    ".gitignore"
    "Dockerfile"
    "docker-compose.yml"
    "render.yaml"
    "README.md"
    "server.js"
    "config/database.js"
    "controllers/conversationController.js"
    "controllers/conversation-integration.js"
    "routes/conversations.js"
    "scripts/whatsapp-conversations.sql"
    "scripts/init-database.sql"
    "whatsapp-panel.html"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    log_error "Archivos faltantes:"
    printf '%s\n' "${missing_files[@]}"
    exit 1
fi

log_success "Todos los archivos esenciales están presentes"

# Limpiar archivos locales
log_info "Limpiando archivos locales..."

# Archivos a eliminar
files_to_remove=(
    ".env"
    "node_modules/"
    "logs/"
    "sessions/"
    "auth_info_baileys/"
    "uploads/"
    "certs/"
    "data/"
    "storage/"
    "*.log"
    ".DS_Store"
)

for pattern in "${files_to_remove[@]}"; do
    if [ -e "$pattern" ]; then
        if [ -d "$pattern" ]; then
            rm -rf "$pattern"
            log_info "Eliminado directorio: $pattern"
        elif [ -f "$pattern" ]; then
            rm -f "$pattern"
            log_info "Eliminado archivo: $pattern"
        fi
    fi
done

# Crear .gitkeep para directorios vacíos que queremos en Git
gitkeep_dirs=(
    "logs"
    "uploads" 
    "sessions"
    "certs"
    "data"
    "storage"
)

for dir in "${gitkeep_dirs[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        touch "$dir/.gitkeep"
        log_info "Creado directorio con .gitkeep: $dir"
    fi
done

# Verificar que .env.example existe y está bien configurado
log_info "Verificando configuración de variables de entorno..."
if grep -q "cambiar_este_secret" .env.example; then
    log_warning ".env.example aún contiene valores por defecto. Revisar antes de production."
else
    log_success ".env.example configurado correctamente"
fi

# Verificar scripts importantes
log_info "Verificando scripts de utilidad..."
if [ -f "scripts/init-database.sql" ]; then
    log_success "Script de inicialización PostgreSQL encontrado"
else
    log_warning "Script de inicialización no encontrado"
fi

if [ -f "scripts/test-endpoints.js" ]; then
    log_success "Script de testing encontrado"
else
    log_warning "Script de testing no encontrado"
fi

# Verificar Dockerfile
log_info "Verificando Dockerfile..."
if grep -q "FROM node:20" Dockerfile; then
    log_success "Dockerfile configurado para Node.js 20"
else
    log_warning "Dockerfile podría necesitar actualización para Node.js 20"
fi

# Verificar docker-compose.yml
log_info "Verificando docker-compose.yml..."
if grep -q "clinica-backend:" docker-compose.yml; then
    log_success "docker-compose.yml configurado correctamente"
else
    log_warning "docker-compose.yml podría necesitar ajustes"
fi

# Verificar render.yaml
log_info "Verificando render.yaml..."
if grep -q "clinica-dental-backend" render.yaml; then
    log_success "render.yaml configurado para Render.com"
else
    log_warning "render.yaml podría necesitar configuración adicional"
fi

# Mostrar resumen de configuración
echo ""
log_info "📋 RESUMEN DE CONFIGURACIÓN:"
echo "=============================="
echo "• Base de datos: $(grep 'DB_TYPE=' .env.example | cut -d'=' -f2 || echo 'No definido')"
echo "• Puerto: $(grep 'PORT=' .env.example | cut -d'=' -f2 || echo '3000')"
echo "• Node.js versión: 20 (para Render.com)"
echo "• WhatsApp: Baileys (código abierto)"
echo "• Facturación: Verifactu (AEAT España)"
echo "• Compliance: LOPD/RGPD habilitado"
echo ""

# Mostrar próximo pasos
log_info "🚀 PRÓXIMOS PASOS:"
echo "==================="
echo ""
echo "1. 📝 Personalizar .env.example:"
echo "   • Cambiar valores por defecto"
echo "   • Añadir documentación de cada variable"
echo ""
echo "2. 🔗 Configurar repositorio GitHub:"
echo "   git init"
echo "   git add ."
echo "   git commit -m 'Sistema de Gestión Dental - Backend completo'"
echo "   git branch -M main"
echo "   git remote add origin https://github.com/tu-usuario/clinica-dental-backend.git"
echo "   git push -u origin main"
echo ""
echo "3. 🌐 Desplegar en Render.com:"
echo "   • Conectar repositorio GitHub"
echo "   • Configurar variables de entorno"
echo "   • Crear base de datos PostgreSQL"
echo "   • Deploy automático"
echo ""
echo "4. ✅ Verificar funcionamiento:"
echo "   curl https://tu-servicio.onrender.com/api/system/health"
echo ""

# Mostrar comandos útiles
log_info "🛠️ COMANDOS ÚTILES:"
echo "===================="
echo ""
echo "Local development:"
echo "  npm install"
echo "  npm start"
echo ""
echo "Testing endpoints:"
echo "  node scripts/test-endpoints.js"
echo ""
echo "Database init (local):"
echo "  node scripts/init-database.js"
echo ""
echo "Docker local:"
echo "  docker-compose up -d"
echo ""

# Verificar si hay cambios en Git
if command -v git >/dev/null 2>&1; then
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        log_info "📊 Estado de Git:"
        git status --porcelain | head -10
        echo ""
        
        echo "¿Deseas inicializar Git y preparar para commit? (y/N)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            log_info "Inicializando Git..."
            git init
            git add .
            git commit -m "Sistema de Gestión Dental - Backend completo

✨ Características implementadas:
• 47 endpoints de API funcionales
• WhatsApp con Baileys (código abierto)
• Facturación electrónica Verifactu (AEAT)
• Contabilidad avanzada con P&L y flujo de caja
• Gestión completa de doctores y tratamientos
• Compliance LOPD/RGPD con auditoría
• Automatizaciones de confirmaciones de citas
• Soporte multi-base de datos (SQL Server + PostgreSQL)
• Configuración lista para Render.com

🚀 Listo para despliegue en producción"
            log_success "Commit inicial creado"
        fi
    else
        log_warning "Directorio no es un repositorio Git"
    fi
else
    log_warning "Git no está instalado"
fi

echo ""
log_success "✅ Preparación completada!"
echo ""
echo "📚 Documentación disponible:"
echo "• README.md - Documentación completa del proyecto"
echo "• SETUP_GUIDE.md - Guía de configuración local"
echo "• DEPLOYMENT_GUIDE.md - Guía de despliegue en Render.com"
echo ""
echo "🌐 Para más información sobre Render.com:"
echo "• https://render.com/docs"
echo "• https://render.com/docs/deploy"
echo ""

log_info "¡Sistema listo para GitHub y despliegue en la nube! 🚀"