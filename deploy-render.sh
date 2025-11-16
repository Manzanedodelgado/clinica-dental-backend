#!/bin/bash

# Script de Deployment Completo - Clínica Dental Rubio García
# Configuración para Render.com con frontend y backend integrados

set -e

echo "🏥 CLÍNICA DENTAL RUBIO GARCÍA - DEPLOYMENT COMPLETO"
echo "==============================================="

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 1. Verificando dependencias...${NC}"
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

echo -e "${BLUE}📋 2. Instalando dependencias del backend...${NC}"
cd backend
npm install
echo -e "${GREEN}✅ Backend dependencies installed${NC}"

echo -e "${BLUE}📋 3. Instalando dependencias del frontend...${NC}"
cd ../frontend
npm install
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"

echo -e "${BLUE}📋 4. Building frontend para producción...${NC}"
npm run build
echo -e "${GREEN}✅ Frontend build completed${NC}"

echo -e "${BLUE}📋 5. Copiando frontend al directorio del backend...${NC}"
# Crear directorio dist en backend si no existe
mkdir -p ../backend/dist
# Copiar archivos del frontend al backend
cp -r dist/* ../backend/dist/
echo -e "${GREEN}✅ Frontend copied to backend/dist${NC}"

echo -e "${BLUE}📋 6. Verificando estructura final...${NC}"
echo "Backend structure:"
ls -la ../backend/
echo -e "\nFrontend built files:"
ls -la dist/

echo -e "${BLUE}📋 7. Iniciando servidor integrado...${NC}"
cd ../backend

# Configurar variables de entorno para producción
export NODE_ENV=production
export PORT=3000

echo -e "${GREEN}🚀 Servidor iniciando en puerto $PORT...${NC}"
echo -e "${GREEN}🌍 URL de producción: https://www.app.rubiogarciadental.com${NC}"
echo -e "${GREEN}📱 Frontend accesible en: https://www.app.rubiogarciadental.com${NC}"
echo -e "${GREEN}🔧 API accesible en: https://www.app.rubiogarciadental.com/api${NC}"

# Iniciar servidor
npm start