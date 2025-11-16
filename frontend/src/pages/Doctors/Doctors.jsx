import React from 'react';
import { Stethoscope, Clock, Star } from 'lucide-react';

const Doctors = () => {
  return (
    <div className="doctors-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="text-h1">Doctores</h1>
          <p className="text-body">Gestiona los doctores, horarios y asignaciones</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary">
            <Stethoscope size={16} />
            Nuevo Doctor
          </button>
        </div>
      </div>

      <div className="coming-soon">
        <div className="coming-soon-icon">
          <Stethoscope size={64} color="var(--primary-500)" />
        </div>
        <h2 className="text-h2">Módulo de Doctores</h2>
        <p className="text-body">
          Esta funcionalidad está en desarrollo. Incluirá:
        </p>
        <ul className="features-list">
          <li>Perfiles de doctores</li>
          <li>Gestión de horarios</li>
          <li>Asignación de tratamientos</li>
          <li>Estadísticas de rendimiento</li>
          <li>Calendarios de disponibilidad</li>
        </ul>
      </div>
    </div>
  );
};

export default Doctors;