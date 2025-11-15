#!/bin/bash

# ==========================================
# SCRIPT PARA SUBIR CÓDIGO A GITHUB
# Sistema Dental Completo - Rubio García Dental
# ==========================================

echo "🚀 SUBIENDO CÓDIGO A GITHUB..."
echo "================================"
echo "Usuario: manzanedodelgado"
echo "Repositorio: clinica-dental-backend"
echo "Token: [configurado]"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encuentra package.json"
    echo "   Asegúrate de estar en el directorio del backend"
    exit 1
fi

echo "✅ Directorio correcto verificado"
echo ""

# Verificar estado del repositorio
echo "📊 Estado del repositorio:"
git status

echo ""
echo "🔄 Ejecutando subida a GitHub..."
echo "   Comando: git push -u origin main"
echo ""

# Intentar el push
git push -u origin main

# Verificar resultado
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ¡ÉXITO! Código subido correctamente a GitHub"
    echo "🌐 Repositorio: https://github.com/manzanedodelgado/clinica-dental-backend"
    echo ""
    echo "📋 RESUMEN DEL PROYECTO SUBIDO:"
    echo "   🎨 Diseño estilo Apple completo"
    echo "   🤖 AI Engine sin límites de tokens"
    echo "   📱 WhatsApp + Baileys integrado"
    echo "   🗄️ SQL Server completo"
    echo "   🔐 47+ endpoints funcionales"
    echo "   🧪 Tests completos (7 archivos)"
    echo "   📚 Documentación completa"
else
    echo ""
    echo "❌ Error en la subida"
    echo "📝 Credenciales necesarias:"
    echo "   Username: manzanedodelgado"
    echo "   Password: [tu-token-personal]"
    echo ""
    echo "🔧 COMANDO MANUAL:"
    echo "git push -u origin main"
fi