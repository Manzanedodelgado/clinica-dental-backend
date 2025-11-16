import React from 'react';
import { FileText, CheckCircle } from 'lucide-react';

const Questionnaires = () => {
  return (
    <div className="questionnaires-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="text-h1">Cuestionarios</h1>
          <p className="text-body">Crea y gestiona cuestionarios para pacientes</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary">
            <FileText size={16} />
            Nuevo Cuestionario
          </button>
        </div>
      </div>

      <div className="coming-soon">
        <div className="coming-soon-icon">
          <FileText size={64} color="var(--primary-500)" />
        </div>
        <h2 className="text-h2">Módulo de Cuestionarios</h2>
        <p className="text-body">
          Esta funcionalidad está en desarrollo. Incluirá:
        </p>
        <ul className="features-list">
          <li>Cuestionarios de primera visita</li>
          <li>Formularios personalizados</li>
          <li>Respuestas de pacientes</li>
          <li>Análisis de datos</li>
          <li>Exportación de resultados</li>
        </ul>
      </div>
    </div>
  );
};

export default Questionnaires;