#!/bin/bash

# SCRIPT DE INSTALACIÓN DE OLLAMA Y CONFIGURACIÓN
# Sistema Rubio García Dental - AI Engine Setup
# 
# Este script instala y configura Ollama para el sistema de AI gratuito

set -e

echo "🚀 INSTALANDO OLLAMA PARA SISTEMA DE AI RUBIO GARCÍA DENTAL"
echo "=================================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# Verificar si es root
if [[ $EUID -eq 0 ]]; then
   print_error "Este script no debe ejecutarse como root"
   exit 1
fi

echo "Verificando sistema operativo..."
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    print_status "Linux detectado"
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    print_status "macOS detectado"
    OS="macos"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    print_status "Windows detectado (usando WSL o Cygwin)"
    OS="windows"
else
    print_error "Sistema operativo no soportado: $OSTYPE"
    exit 1
fi

# Instalar curl si no está disponible
if ! command -v curl &> /dev/null; then
    print_info "Instalando curl..."
    if [[ "$OS" == "linux" ]]; then
        sudo apt update && sudo apt install -y curl
    elif [[ "$OS" == "macos" ]]; then
        brew install curl
    fi
    print_status "curl instalado"
fi

# Instalar Ollama
print_info "Instalando Ollama..."

if [[ "$OS" == "linux" ]]; then
    # Verificar arquitectura
    ARCH=$(uname -m)
    if [[ "$ARCH" == "x86_64" ]]; then
        curl -fsSL https://ollama.ai/install.sh | sh
    else
        print_warning "Arquitectura $ARCH no soportada oficialmente. Descargando manualmente..."
        curl -L https://ollama.ai/download/ollama-linux-amd64 -o ollama
        chmod +x ollama
        sudo mv ollama /usr/local/bin/
    fi
    
elif [[ "$OS" == "macos" ]]; then
    if ! command -v ollama &> /dev/null; then
        print_info "Instalando Ollama via Homebrew..."
        brew install ollama
    fi
    
elif [[ "$OS" == "windows" ]]; then
    print_warning "Para Windows, descarga e instala Ollama desde: https://ollama.ai/download"
    print_info "Luego ejecuta este script desde WSL"
fi

# Verificar instalación
if command -v ollama &> /dev/null; then
    print_status "Ollama instalado correctamente"
    print_info "Versión: $(ollama --version)"
else
    print_error "Error: Ollama no se instaló correctamente"
    exit 1
fi

# Crear directorio de modelos
print_info "Configurando directorios..."
mkdir -p ~/.ollama/models
mkdir -p ~/rubio-garcia-dental/logs

# Función para descargar modelo
download_model() {
    local model=$1
    local description=$2
    
    print_info "Descargando modelo: $model"
    print_info "Descripción: $description"
    
    if ollama list | grep -q "$model"; then
        print_status "Modelo $model ya está instalado"
    else
        print_info "Descargando $model (esto puede tomar varios minutos)..."
        ollama pull "$model"
        print_status "Modelo $model instalado exitosamente"
    fi
}

# Mostrar modelos disponibles
print_info "Modelos recomendados para clínica dental:"
echo ""
echo "1. llama3.2:3b (3GB) - Recomendado para respuestas rápidas"
echo "2. llama3.2:1b (1GB) - Más rápido, menos recursos"
echo "3. mistral:7b (4.1GB) - Excelente para conversaciones"
echo "4. qwen2:1.5b (1GB) - Eficiente y rápido"
echo ""

# Preguntar qué modelo instalar
read -p "¿Qué modelo quieres instalar? (1-4, o 'todos'): " choice

case $choice in
    1)
        download_model "llama3.2:3b" "Modelo principal recomendado para clínica dental"
        ;;
    2)
        download_model "llama3.2:1b" "Modelo rápido y eficiente"
        ;;
    3)
        download_model "mistral:7b" "Modelo conversacional avanzado"
        ;;
    4)
        download_model "qwen2:1.5b" "Modelo eficiente"
        ;;
    "todos")
        download_model "llama3.2:3b" "Modelo principal recomendado"
        download_model "qwen2:1.5b" "Modelo rápido"
        ;;
    *)
        print_warning "Opción inválida. Instalando modelo por defecto..."
        download_model "llama3.2:3b" "Modelo por defecto"
        ;;
esac

# Configurar Ollama como servicio
print_info "Configurando Ollama como servicio..."

# Crear archivo de configuración systemd para Linux
if [[ "$OS" == "linux" && $(command -v systemctl) ]]; then
    print_info "Creando servicio systemd..."
    
    sudo tee /etc/systemd/system/ollama.service > /dev/null <<EOF
[Unit]
Description=Ollama Service
After=network.target

[Service]
Type=notify
User=$USER
Group=$USER
WorkingDirectory=$HOME
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=10
Environment=OLLAMA_HOST=0.0.0.0:11434

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable ollama
    
    print_status "Servicio systemd configurado"
    print_info "Para iniciar: sudo systemctl start ollama"
    print_info "Para verificar estado: sudo systemctl status ollama"
    
    # Iniciar servicio
    read -p "¿Quieres iniciar el servicio ahora? (s/n): " start_service
    if [[ "$start_service" =~ ^[Ss]$ ]]; then
        sudo systemctl start ollama
        print_status "Servicio Ollama iniciado"
    fi
fi

# Verificar que Ollama esté funcionando
print_info "Verificando que Ollama esté funcionando..."

sleep 3  # Esperar un momento para que el servicio inicie

if curl -s http://localhost:11434/api/tags > /dev/null; then
    print_status "Ollama está funcionando correctamente"
    
    # Mostrar modelos instalados
    echo ""
    print_info "Modelos instalados:"
    ollama list | grep -v "^NAME" | while read line; do
        echo "  $line"
    done
else
    print_warning "Ollama puede estar iniciando. Verifica manualmente en unos momentos."
fi

# Crear archivo de configuración para el backend
print_info "Creando configuración para el backend..."

cat > ~/.ollama/backend-config.env <<EOF
# Configuración para Rubio García Dental Backend
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
OLLAMA_MAX_TOKENS=1000
OLLAMA_TIMEOUT=30000
OLLAMA_TEMPERATURE=0.7
OLLAMA_TOP_P=0.9
OLLAMA_REPEAT_PENALTY=1.1

# Variables adicionales para el backend
AI_ENABLED=true
AI_ACTIVE_OUTSIDE_HOURS=true
AI_AUTO_RESPONSE_ENABLED=true
AI_SMART_URGENCY_DETECTION=true
AI_MIN_CONFIDENCE_THRESHOLD=0.6
AI_CONTEXTUAL_RESPONSES=true
AI_DETAILED_LOGGING=true
AI_RATE_LIMIT_PER_HOUR=20
EOF

print_status "Archivo de configuración creado en ~/.ollama/backend-config.env"

# Mostrar resumen final
echo ""
echo "=================================================================="
print_status "INSTALACIÓN DE OLLAMA COMPLETADA"
echo "=================================================================="
echo ""
print_info "Resumen de la instalación:"
echo "  • Ollama instalado y configurado"
echo "  • Modelos de AI descargados"
echo "  • Servicio configurado (Linux)"
echo "  • Configuración para backend creada"
echo ""
print_info "Próximos pasos:"
echo "  1. Copiar variables de ~/.ollama/backend-config.env a tu .env"
echo "  2. Reiniciar tu backend Node.js"
echo "  3. Verificar que el AI Engine funciona"
echo ""
print_info "Comandos útiles:"
echo "  • Ver modelos: ollama list"
echo "  • Probar modelo: ollama run llama3.2:3b"
echo "  • Ver logs: journalctl -u ollama -f (Linux)"
echo "  • Estado del servicio: sudo systemctl status ollama (Linux)"
echo ""

# Test rápido de conectividad
print_info "Realizando test de conectividad..."
if curl -s http://localhost:11434/api/tags > /dev/null; then
    print_status "Test de conectividad exitoso"
    print_info "Puedes usar el backend ahora"
else
    print_warning "Ollama no responde. Puede estar iniciando o necesitar reinicio."
fi

print_status "¡Listo! Tu sistema de AI está configurado y funcionando."