import React from 'react';
import { Workflow, Zap } from 'lucide-react';

const Automation = () => {
  return (
    <div className="automation-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="text-h1">Automatización</h1>
          <p className="text-body">Configura flujos automatizados y respuestas automáticas</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary">
            <Workflow size={16} />
            Nuevo Flujo
          </button>
        </div>
      </div>

      <div className="coming-soon">
        <div className="coming-soon-icon">
          <Workflow size={64} color="var(--primary-500)" />
        </div>
        <h2 className="text-h2">Sistema de Automatización</h2>
        <p className="text-body">
          Esta funcionalidad está en desarrollo. Incluirá:
        </p>
        <ul className="features-list">
          <li>Flujos de trabajo automatizados</li>
          <li>Respuestas automáticas</li>
          <li>Recordatorios programados</li>
          <li>Notificaciones inteligentes</li>
          <li>Gestión de estados</li>
        </ul>
      </div>
    </div>
  );
};

export default Automation;