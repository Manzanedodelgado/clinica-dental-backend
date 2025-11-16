import React from 'react';
import { Shield, FileText } from 'lucide-react';

const Legal = () => {
  return (
    <div className="legal-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="text-h1">Legal / LOPD</h1>
          <p className="text-body">Gestiona documentos legales y cumplimiento LOPD</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary">
            <FileText size={16} />
            Nuevo Documento
          </button>
        </div>
      </div>

      <div className="coming-soon">
        <div className="coming-soon-icon">
          <Shield size={64} color="var(--primary-500)" />
        </div>
        <h2 className="text-h2">Módulo Legal / LOPD</h2>
        <p className="text-body">
          Esta funcionalidad está en desarrollo. Incluirá:
        </p>
        <ul className="features-list">
          <li>Consentimiento LOPD</li>
          <li>Documentos legales</li>
          <li>Políticas de privacidad</li>
          <li>Términos y condiciones</li>
          <li>Auditoría de compliance</li>
        </ul>
      </div>
    </div>
  );
};

export default Legal;