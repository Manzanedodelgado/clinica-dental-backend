import React from 'react';
import { Calendar, Clock, User, MapPin } from 'lucide-react';

const Appointments = () => {
  return (
    <div className="appointments-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="text-h1">Citas</h1>
          <p className="text-body">Gestiona el calendario y las citas de la clínica</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary">
            <Calendar size={16} />
            Nueva Cita
          </button>
        </div>
      </div>

      <div className="coming-soon">
        <div className="coming-soon-icon">
          <Calendar size={64} color="var(--primary-500)" />
        </div>
        <h2 className="text-h2">Módulo de Citas</h2>
        <p className="text-body">
          Esta funcionalidad está en desarrollo. Incluirá:
        </p>
        <ul className="features-list">
          <li>Calendario interactivo</li>
          <li>Gestión de citas</li>
          <li>Notificaciones automáticas</li>
          <li>Asignación de doctores</li>
          <li>Estados de citas</li>
        </ul>
      </div>
    </div>
  );
};

export default Appointments;