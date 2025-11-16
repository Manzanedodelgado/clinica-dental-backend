import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Filter,
  Download,
  Edit,
  Eye,
  Phone,
  Mail,
  Calendar,
  FileText,
  MoreHorizontal
} from 'lucide-react';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    // Simular carga de pacientes
    const loadPatients = async () => {
      setLoading(true);
      
      setTimeout(() => {
        const mockPatients = [
          {
            id: 1,
            name: 'María García López',
            email: 'maria.garcia@email.com',
            phone: '+34 612 345 678',
            lastVisit: '2024-11-15',
            nextAppointment: '2024-11-20',
            status: 'active',
            age: 34,
            treatments: 3,
            totalSpent: 1250
          },
          {
            id: 2,
            name: 'Carlos Ruiz Martín',
            email: 'carlos.ruiz@email.com',
            phone: '+34 623 456 789',
            lastVisit: '2024-11-10',
            nextAppointment: '2024-11-18',
            status: 'active',
            age: 28,
            treatments: 2,
            totalSpent: 890
          },
          {
            id: 3,
            name: 'Ana Torres Fernández',
            email: 'ana.torres@email.com',
            phone: '+34 634 567 890',
            lastVisit: '2024-11-05',
            nextAppointment: null,
            status: 'inactive',
            age: 45,
            treatments: 5,
            totalSpent: 2340
          }
        ];
        
        setPatients(mockPatients);
        setLoading(false);
      }, 800);
    };

    loadPatients();
  }, []);

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.phone.includes(searchTerm);
    
    const matchesFilter = filterStatus === 'all' || patient.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin programar';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-h3">Cargando pacientes...</div>
      </div>
    );
  }

  return (
    <div className="patients-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="text-h1">Pacientes</h1>
          <p className="text-body">Gestiona la información de tus pacientes</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary">
            <Download size={16} />
            Exportar
          </button>
          <button className="btn btn-primary">
            <Plus size={16} />
            Nuevo Paciente
          </button>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="filters-section">
        <div className="search-container">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filters">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos los pacientes</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
          
          <button className="btn btn-secondary">
            <Filter size={16} />
            Más filtros
          </button>
        </div>
      </div>

      {/* Lista de pacientes */}
      <div className="patients-grid">
        {filteredPatients.map((patient) => (
          <div key={patient.id} className="patient-card">
            <div className="patient-header">
              <div className="patient-avatar">
                {patient.name.charAt(0)}
              </div>
              <div className="patient-info">
                <h3 className="patient-name">{patient.name}</h3>
                <p className="patient-meta">
                  {patient.age} años • {patient.treatments} tratamientos
                </p>
              </div>
              <div className="patient-status">
                <span className={`status-badge status-${patient.status}`}>
                  {patient.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            <div className="patient-details">
              <div className="detail-row">
                <Mail size={14} />
                <span>{patient.email}</span>
              </div>
              <div className="detail-row">
                <Phone size={14} />
                <span>{patient.phone}</span>
              </div>
              <div className="detail-row">
                <Calendar size={14} />
                <span>Última visita: {formatDate(patient.lastVisit)}</span>
              </div>
              <div className="detail-row">
                <FileText size={14} />
                <span>Próxima cita: {formatDate(patient.nextAppointment)}</span>
              </div>
            </div>

            <div className="patient-footer">
              <div className="patient-stats">
                <span className="stat">
                  <strong>€{patient.totalSpent}</strong>
                  <small>Total gastado</small>
                </span>
              </div>
              <div className="patient-actions">
                <button className="action-btn" title="Ver perfil">
                  <Eye size={16} />
                </button>
                <button className="action-btn" title="Editar">
                  <Edit size={16} />
                </button>
                <button className="action-btn" title="Más opciones">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPatients.length === 0 && (
        <div className="no-results">
          <FileText size={48} color="var(--neutral-400)" />
          <h3 className="text-h3">No se encontraron pacientes</h3>
          <p className="text-body">
            {searchTerm || filterStatus !== 'all' 
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'No hay pacientes registrados aún'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Patients;