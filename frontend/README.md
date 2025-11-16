# 🦷 Clínica Dental Rubio García - Frontend

## 🚀 Instrucciones de Desarrollo

### 1. **Instalación de Dependencias**
```bash
cd frontend
npm install
```

### 2. **Ejecución en Desarrollo**
```bash
npm run dev
```
La aplicación se ejecutará en: `http://localhost:5173`

### 3. **Construcción para Producción**
```bash
npm run build
npm run preview
```

## 📁 **Estructura del Proyecto**

```
frontend/
├── public/                 # Archivos estáticos
├── src/
│   ├── components/         # Componentes reutilizables
│   │   └── Layout/        # Sidebar, Header, Layout
│   ├── contexts/          # Context API (Auth)
│   ├── pages/             # Páginas de la aplicación
│   │   ├── Auth/         # Login
│   │   ├── Dashboard/    # Dashboard principal
│   │   ├── Patients/     # Gestión de pacientes
│   │   └── .../          # Otras páginas
│   ├── App.jsx           # Componente principal
│   ├── main.jsx          # Entry point
│   └── index.css         # Estilos globales
├── package.json          # Dependencias y scripts
└── vite.config.js       # Configuración de Vite
```

## 🎨 **Sistema de Diseño**

### **Colores Principales:**
- **Azul Médico**: `#2563eb` (CTAs, elementos interactivos)
- **Verde Médico**: `#059669` (Confirmaciones, éxitos)
- **Gris Profesional**: `#f8fafc` a `#111827` (Textos, fondos)
- **Semánticos**: Success, Warning, Error, Info

### **Tipografía:**
- **Fuente**: Inter (Google Fonts)
- **Tamaños**: 12px a 32px (escala coherente)
- **Pesos**: 400, 500, 600, 700

### **Espaciado:**
- **Base**: 4px (sistema coherente)
- **Valores**: xs(8px), sm(12px), md(16px), lg(24px), xl(32px), xxl(48px)

## 🔧 **Características Implementadas**

### ✅ **Autenticación**
- Login/Logout con JWT
- Protected routes
- Gestión de estado de usuario
- Redirección automática

### ✅ **Dashboard**
- Métricas principales (pacientes, citas, ingresos)
- Citas del día
- Acciones rápidas
- Estados en tiempo real

### ✅ **Gestión de Pacientes**
- Lista completa con tarjetas
- Búsqueda en tiempo real
- Filtros por estado
- Información de contacto
- Historial de visitas

### ✅ **Navegación**
- Sidebar colapsible
- Navegación responsive
- Estados activos
- Iconografía consistente (Lucide Icons)

## 🎯 **Próximos Pasos de Desarrollo**

### 1. **Integración con Backend**
```javascript
// Configurar URL del API en AuthContext.jsx
const API_BASE_URL = 'http://localhost:3000/api';
```

### 2. **Funcionalidades Críticas**
- Calendario interactivo (Citas)
- Formularios de pacientes
- WhatsApp Web integration
- Facturación automática
- Reportes y analytics

### 3. **Optimizaciones**
- Lazy loading de páginas
- Cache de datos
- Optimización de bundle
- PWA capabilities

## 🌐 **URLs de Desarrollo**

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/health

## 📊 **Estado del Proyecto**

- ✅ **Backend**: 100% funcional en Render.com
- ✅ **Frontend**: 70% completo (estructura + módulos básicos)
- 🔄 **En desarrollo**: Integración completa + funcionalidades avanzadas

---

**¡La Clínica Dental Rubio García tiene un frontend moderno y profesional listo para crecer!** 🦷✨