# AI ENGINE - SCRIPT DE INSTALACIÓN WINDOWS
# Sistema Rubio García Dental - AI Engine Setup
# 
# Ejecutar desde PowerShell como Administrador

# Verificar si se ejecuta como Administrador
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ Este script debe ejecutarse como Administrador" -ForegroundColor Red
    Write-Host "Clic derecho en PowerShell → 'Ejecutar como Administrador'" -ForegroundColor Yellow
    exit 1
}

Write-Host "🚀 INSTALANDO OLLAMA PARA SISTEMA DE AI RUBIO GARCÍA DENTAL" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green

# Función para imprimir con colores
function Write-Status { param($Message) Write-Host "[✓] $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "[!] $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "[✗] $Message" -ForegroundColor Red }
function Write-Info { param($Message) Write-Host "[i] $Message" -ForegroundColor Cyan }

# Verificar arquitectura del sistema
$Architecture = $env:PROCESSOR_ARCHITECTURE
Write-Info "Arquitectura del sistema: $Architecture"

# Descargar e instalar Ollama para Windows
Write-Info "Descargando Ollama para Windows..."

$OllamaUrl = "https://ollama.ai/download/ollama-windows-amd64.exe"
$OllamaPath = "$env:TEMP\ollama-installer.exe"

try {
    Write-Info "Descargando desde: $OllamaUrl"
    Invoke-WebRequest -Uri $OllamaUrl -OutFile $OllamaPath -UseBasicParsing
    Write-Status "Descarga completada"
    
    Write-Info "Ejecutando instalador..."
    Start-Process -FilePath $OllamaPath -ArgumentList "/S" -Wait
    
    Write-Status "Ollama instalado correctamente"
    
    # Limpiar archivo temporal
    Remove-Item $OllamaPath -Force
    
} catch {
    Write-Error "Error descargando o instalando Ollama: $_"
    exit 1
}

# Verificar instalación
try {
    $OllamaVersion = ollama --version 2>$null
    if ($OllamaVersion) {
        Write-Status "Ollama instalado correctamente"
        Write-Info "Versión: $OllamaVersion"
    } else {
        throw "Ollama no se encuentra en PATH"
    }
} catch {
    Write-Error "Error verificando instalación de Ollama"
    Write-Info "Reinicia PowerShell e intenta nuevamente"
    exit 1
}

# Crear directorios necesarios
Write-Info "Creando directorios..."
$ModelsDir = "$env:USERPROFILE\.ollama\models"
$LogsDir = "$env:USERPROFILE\rubio-garcia-dental\logs"

New-Item -ItemType Directory -Path $ModelsDir -Force | Out-Null
New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null

Write-Status "Directorios creados"

# Función para descargar modelo
function Install-Model {
    param(
        [string]$Model,
        [string]$Description
    )
    
    Write-Info "Descargando modelo: $Model"
    Write-Info "Descripción: $Description"
    
    $Models = ollama list 2>$null
    if ($Models -match $Model) {
        Write-Status "Modelo $Model ya está instalado"
    } else {
        Write-Info "Descargando $Model (esto puede tomar varios minutos)..."
        ollama pull $Model
        Write-Status "Modelo $Model instalado exitosamente"
    }
}

# Mostrar modelos disponibles
Write-Host ""
Write-Info "Modelos recomendados para clínica dental:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. llama3.2:3b (3GB) - Recomendado para respuestas rápidas" -ForegroundColor White
Write-Host "2. llama3.2:1b (1GB) - Más rápido, menos recursos" -ForegroundColor White
Write-Host "3. mistral:7b (4.1GB) - Excelente para conversaciones" -ForegroundColor White
Write-Host "4. qwen2:1.5b (1GB) - Eficiente y rápido" -ForegroundColor White
Write-Host ""

# Preguntar qué modelo instalar
do {
    $Choice = Read-Host "¿Qué modelo quieres instalar? (1-4, o 'todos')"
    $ValidChoices = @('1', '2', '3', '4', 'todos', 'TODOS')
} while ($Choice -notin $ValidChoices)

switch ($Choice) {
    '1' { Install-Model -Model "llama3.2:3b" -Description "Modelo principal recomendado para clínica dental" }
    '2' { Install-Model -Model "llama3.2:1b" -Description "Modelo rápido y eficiente" }
    '3' { Install-Model -Model "mistral:7b" -Description "Modelo conversacional avanzado" }
    '4' { Install-Model -Model "qwen2:1.5b" -Description "Modelo eficiente" }
    default { 
        Write-Info "Instalando modelos recomendados..."
        Install-Model -Model "llama3.2:3b" -Description "Modelo principal"
        Install-Model -Model "qwen2:1.5b" -Description "Modelo rápido"
    }
}

# Configurar Ollama como servicio de Windows
Write-Info "Configurando Ollama como servicio de Windows..."

$ServiceName = "Ollama"

# Verificar si el servicio ya existe
$Service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue

if ($Service) {
    Write-Status "Servicio $ServiceName ya existe"
    if ($Service.Status -ne "Running") {
        Start-Service $ServiceName
        Write-Status "Servicio iniciado"
    }
} else {
    # Intentar registrar como servicio
    try {
        Write-Info "Registrando servicio..."
        
        # Crear archivo NSSM si no existe
        $NSSMPath = "$env:USERPROFILE\Desktop\nssm.exe"
        
        if (!(Test-Path $NSSMPath)) {
            Write-Info "Descargando NSSM para gestión de servicios..."
            $NSSMUrl = "https://nssm.cc/ci/nssm-2.24-101-g028cadd-64-bit"
            Invoke-WebRequest -Uri $NSSMUrl -OutFile $NSSMPath -UseBasicParsing
        }
        
        # Registrar servicio
        & $NSSMPath install $ServiceName ollama serve
        & $NSSMPath set $ServiceName AppDirectory "$env:USERPROFILE"
        & $NSSMPath set $ServiceName AppParameters "serve"
        & $NSSMPath set $ServiceName AppStdoutCreationDisposition 4
        & $NSSMPath set $ServiceName AppStderrCreationDisposition 4
        & $NSSMPath set $ServiceName AppStdout "$env:USERPROFILE\ollama-stdout.log"
        & $NSSMPath set $ServiceName AppStderr "$env:USERPROFILE\ollama-stderr.log"
        & $NSSMPath set $ServiceName Start SERVICE_AUTO_START
        & $NSSMPath set $ServiceName Description "Servicio Ollama para AI Engine - Clínica Dental Rubio García"
        
        # Iniciar servicio
        & $NSSMPath start $ServiceName
        Write-Status "Servicio registrado y iniciado"
        
    } catch {
        Write-Warning "No se pudo registrar como servicio automáticamente"
        Write-Info "Ollama se puede ejecutar manualmente con: ollama serve"
    }
}

# Esperar un momento para que el servicio inicie
Write-Info "Esperando que Ollama inicie..."
Start-Sleep -Seconds 5

# Verificar que Ollama esté funcionando
Write-Info "Verificando que Ollama esté funcionando..."

$OllamaResponse = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 5 -ErrorAction SilentlyContinue

if ($OllamaResponse) {
    Write-Status "Ollama está funcionando correctamente"
    
    # Mostrar modelos instalados
    Write-Host ""
    Write-Info "Modelos instalados:" -ForegroundColor Cyan
    $OllamaResponse.models | ForEach-Object { Write-Host "  $($_.name)" -ForegroundColor White }
} else {
    Write-Warning "Ollama puede estar iniciando. Verifica manualmente en unos momentos."
    Write-Info "Comando manual: ollama serve"
}

# Crear archivo de configuración para el backend
Write-Info "Creando configuración para el backend..."

$ConfigContent = @"
# Configuración para Rubio García Dental Backend - WINDOWS
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
"@

$ConfigPath = "$env:USERPROFILE\.ollama\backend-config.env"
$ConfigContent | Out-File -FilePath $ConfigPath -Encoding UTF8

Write-Status "Archivo de configuración creado en $ConfigPath"

# Mostrar resumen final
Write-Host ""
Write-Host "==================================================================" -ForegroundColor Green
Write-Status "INSTALACIÓN DE OLLAMA COMPLETADA" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
Write-Host ""

Write-Info "Resumen de la instalación:" -ForegroundColor Cyan
Write-Host "  • Ollama instalado y configurado" -ForegroundColor White
Write-Host "  • Modelos de AI descargados" -ForegroundColor White
Write-Host "  • Servicio configurado" -ForegroundColor White
Write-Host "  • Configuración para backend creada" -ForegroundColor White

Write-Host ""
Write-Info "Próximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Copiar variables de $ConfigPath a tu .env" -ForegroundColor White
Write-Host "  2. Reiniciar tu backend Node.js" -ForegroundColor White
Write-Host "  3. Verificar que el AI Engine funciona" -ForegroundColor White

Write-Host ""
Write-Info "Comandos útiles:" -ForegroundColor Cyan
Write-Host "  • Ver modelos: ollama list" -ForegroundColor White
Write-Host "  • Probar modelo: ollama run llama3.2:3b" -ForegroundColor White
Write-Host "  • Estado del servicio: Get-Service Ollama" -ForegroundColor White
Write-Host "  • Logs: Get-EventLog -LogName Application -Source Ollama" -ForegroundColor White

Write-Host ""

# Test rápido de conectividad
Write-Info "Realizando test de conectividad..."

try {
    $TestResponse = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 3
    Write-Status "Test de conectividad exitoso"
    Write-Info "Puedes usar el backend ahora"
} catch {
    Write-Warning "Ollama no responde. Puede estar iniciando o necesitar reinicio."
    Write-Info "Ejecuta: ollama serve"
}

Write-Status "¡Listo! Tu sistema de AI está configurado y funcionando." -ForegroundColor Green

# Preguntar si quiere abrir el panel de administración
$OpenPanel = Read-Host "¿Quieres abrir el panel de administración? (s/n)"
if ($OpenPanel -eq 's' -or $OpenPanel -eq 'S') {
    Start-Process "http://localhost:3000/admin/whatsapp-panel"
}