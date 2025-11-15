#!/bin/bash

# Script de Inicio del Sistema de Gestión Dental
# Clínica Rubio García - Backend Server

echo "🦷 Sistema de Gestión Dental - Clínica Rubio García"
echo "=================================================="
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado"
    echo "   Instalar desde: https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js detectado: $NODE_VERSION"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm no está instalado"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo "✅ npm detectado: v$NPM_VERSION"

# Verificar archivo .env
if [ ! -f .env ]; then
    echo "❌ Error: Archivo .env no encontrado"
    echo "   Asegúrate de ejecutar el script desde el directorio backend/"
    exit 1
fi

echo "✅ Archivo .env encontrado"

# Verificar dependencias
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Error instalando dependencias"
        exit 1
    fi
fi

echo "✅ Dependencias verificadas"

# Verificar puerto
PORT=${PORT:-3000}
echo "🔍 Verificando puerto $PORT..."

if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  El puerto $PORT está en uso"
    echo "   Puedes cambiarlo en el archivo .env: PORT=3001"
    read -p "¿Continuar de todos modos? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🚀 Iniciando servidor..."
echo ""
echo "📋 Información del servidor:"
echo "   • URL: http://localhost:$PORT"
echo "   • API Base: http://localhost:$PORT/api"
echo "   • Health Check: http://localhost:$PORT/api/system/health"
echo ""
echo "🔗 Endpoints importantes:"
echo "   • Login: POST http://localhost:$PORT/api/auth/login"
echo "   • Citas: GET http://localhost:$PORT/api/appointments"
echo "   • WhatsApp Status: GET http://localhost:$PORT/api/whatsapp/status"
echo ""
echo "📊 Para verificar endpoints:"
echo "   node scripts/test-endpoints.js"
echo ""
echo "🛑 Para detener el servidor: Ctrl+C"
echo ""

# Iniciar servidor
npm start