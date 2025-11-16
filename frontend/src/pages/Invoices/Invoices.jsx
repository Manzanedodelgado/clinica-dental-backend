import React from 'react';
import { Receipt, DollarSign } from 'lucide-react';

const Invoices = () => {
  return (
    <div className="invoices-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="text-h1">Facturación</h1>
          <p className="text-body">Gestiona facturas, pagos y reportes financieros</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary">
            <Receipt size={16} />
            Nueva Factura
          </button>
        </div>
      </div>

      <div className="coming-soon">
        <div className="coming-soon-icon">
          <Receipt size={64} color="var(--primary-500)" />
        </div>
        <h2 className="text-h2">Módulo de Facturación</h2>
        <p className="text-body">
          Esta funcionalidad está en desarrollo. Incluirá:
        </p>
        <ul className="features-list">
          <li>Generación de facturas</li>
          <li>Gestión de pagos</li>
          <li>Reportes financieros</li>
          <li>Plantillas de facturas</li>
          <li>Seguimiento de cobros</li>
        </ul>
      </div>
    </div>
  );
};

export default Invoices;