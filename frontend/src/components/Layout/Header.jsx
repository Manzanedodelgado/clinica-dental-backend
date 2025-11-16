import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, Search, LogOut, User } from 'lucide-react';

const Header = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-toggle" onClick={onToggleSidebar}>
          <div className="hamburger">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
        
        <div className="search-container">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar pacientes, citas, doctores..." 
            className="search-input"
          />
        </div>
      </div>

      <div className="header-right">
        <div className="notifications">
          <button className="notification-btn" title="Notificaciones">
            <Bell size={20} />
            <span className="notification-badge">3</span>
          </button>
        </div>

        <div className="user-menu">
          <div className="user-info">
            <div className="user-avatar">
              <User size={20} />
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name || 'Usuario'}</span>
              <span className="user-role">{user?.role || 'Administrador'}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Cerrar sesión">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;