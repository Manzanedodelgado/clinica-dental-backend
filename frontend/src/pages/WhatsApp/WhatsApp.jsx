import React from 'react';
import { MessageSquare, Send } from 'lucide-react';

const WhatsApp = () => {
  return (
    <div className="whatsapp-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="text-h1">WhatsApp</h1>
          <p className="text-body">Gestiona conversaciones y automatización de WhatsApp</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary">
            <MessageSquare size={16} />
            Nueva Conversación
          </button>
        </div>
      </div>

      <div className="coming-soon">
        <div className="coming-soon-icon">
          <MessageSquare size={64} color="var(--primary-500)" />
        </div>
        <h2 className="text-h2">Integración WhatsApp</h2>
        <p className="text-body">
          Esta funcionalidad está en desarrollo. Incluirá:
        </p>
        <ul className="features-list">
          <li>Chat en tiempo real</li>
          <li>Plantillas de mensajes</li>
          <li>Automatización de respuestas</li>
          <li>Confirmación de citas</li>
          <li>Estadísticas de conversaciones</li>
        </ul>
      </div>
    </div>
  );
};

export default WhatsApp;