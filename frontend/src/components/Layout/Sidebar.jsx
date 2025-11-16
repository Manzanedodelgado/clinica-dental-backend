import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  Calendar,
  Stethoscope,
  FileText,
  MessageSquare,
  Receipt,
  Workflow,
  Shield,
  Settings
} from 'lucide-react';

const Sidebar = ({ collapsed, onToggle }) => {
  const location = useLocation();

  const navigationItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard', description: 'Panel principal' },
    { path: '/patients', icon: Users, label: 'Pacientes', description: 'Gestión de pacientes' },
    { path: '/appointments', icon: Calendar, label: 'Citas', description: 'Calendario y citas' },
    { path: '/doctors', icon: Stethoscope, label: 'Doctores', description: 'Doctores y horarios' },
    { path: '/questionnaires', icon: FileText, label: 'Cuestionarios', description: 'Formularios y respuestas' },
    { path: '/whatsapp', icon: MessageSquare, label: 'WhatsApp', description: 'Conversaciones' },
    { path: '/invoices', icon: Receipt, label: 'Facturación', description: 'Facturas y pagos' },
    { path: '/automation', icon: Workflow, label: 'Automatización', description: 'Flujos automáticos' },
    { path: '/legal', icon: Shield, label: 'Legal/LOPD', description: 'Documentos legales' },
    { path: '/system', icon: Settings, label: 'Sistema', description: 'Configuración' }
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          {collapsed ? (
            <div className="logo-icon">
              <Stethoscope size={24} color="var(--primary-500)" />
            </div>
          ) : (
            <div className="logo-full">
              <Stethoscope size={32} color="var(--primary-500)" />
              <span className="logo-text">
                <strong>Rubio García</strong>
                <small>Clínica Dental</small>
              </span>
            </div>
          )}
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path} className="nav-item">
                <NavLink
                  to={item.path}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  title={collapsed ? item.label : ''}
                >
                  <IconComponent size={20} className="nav-icon" />
                  {!collapsed && (
                    <span className="nav-label">{item.label}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button 
          className="collapse-btn"
          onClick={onToggle}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;