import React from 'react';
import { Settings, Database, Activity } from 'lucide-react';

const System = () => {
  return (
    <div className="system-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="text-h1">Sistema</h1>
          <p className="text-body">Configuración del sistema y monitoreo</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary">
            <Settings size={16} />
            Configuración
          </button>
        </div>
      </div>

      <div className="coming-soon">
        <div className="coming-soon-icon">
          <Settings size={64} color="var(--primary-500)" />
        </div>
        <h2 className="text-h2">Panel de Sistema</h2>
        <p className="text-body">
          Esta funcionalidad está en desarrollo. Incluirá:
        </p>
        <ul className="features-list">
          <li>Configuración general</li>
          <li>Monitoreo del sistema</li>
          <li>Logs y auditoría</li>
          <li>Respaldos de datos</li>
          <li>Actualizaciones</li>
        </ul>
      </div>
    </div>
  );
};

export default System;