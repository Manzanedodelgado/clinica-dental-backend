#!/bin/bash

# Script de prueba completo del sistema
echo "🧪 INICIANDO PRUEBAS DEL SISTEMA"
echo "=================================="

# Verificar que el frontend esté corriendo
echo "1. Verificando frontend..."
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend funcionando en http://localhost:5173"
else
    echo "❌ Frontend NO disponible"
fi

# Verificar que el backend esté disponible (con fallback)
echo "2. Verificando backend..."
if curl -s https://clinica-dental-backend.onrender.com/api/system/health > /dev/null; then
    echo "✅ Backend disponible en producción"
else
    echo "⚠️ Backend no disponible (usando mock API)"
fi

# Verificar archivos principales del frontend
echo "3. Verificando estructura del frontend..."
frontend_files=(
    "frontend/src/main.jsx"
    "frontend/src/App.jsx"
    "frontend/src/contexts/AuthContext.jsx"
    "frontend/src/pages/Dashboard/Dashboard.jsx"
    "frontend/src/pages/Patients/Patients.jsx"
    "frontend/src/services/api.js"
    "frontend/src/services/apiMock.js"
)

for file in "${frontend_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file NO ENCONTRADO"
    fi
done

# Verificar dependencias instaladas
echo "4. Verificando dependencias del frontend..."
if [ -d "frontend/node_modules" ]; then
    echo "✅ Dependencias instaladas"
else
    echo "❌ Dependencias NO instaladas"
fi

# Verificar estructura del backend
echo "5. Verificando estructura del backend..."
backend_files=(
    "backend/server.js"
    "backend/controllers/authController.js"
    "backend/controllers/whatsappController.js"
    "backend/package.json"
)

for file in "${backend_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file NO ENCONTRADO"
    fi
done

echo ""
echo "🎯 RESUMEN DE PRUEBAS"
echo "====================="
echo "Frontend URL: http://localhost:5173"
echo "Backend URL: https://clinica-dental-backend.onrender.com"
echo ""
echo "🔑 CREDENCIALES DE PRUEBA:"
echo "Email: admin@clinicadental.com"
echo "Password: password123"
echo ""
echo "📋 FUNCIONALIDADES DISPONIBLES:"
echo "- Login con fallback a mock API"
echo "- Dashboard con estadísticas"
echo "- Gestión de pacientes con búsqueda y filtros"
echo "- Navegación lateral colapsable"
echo "- Diseño responsive"
echo ""
echo "🚀 ¡Sistema listo para pruebas!"
echo ""
echo "Para acceder: Abre http://localhost:5173 en tu navegador"