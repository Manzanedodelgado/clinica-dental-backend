import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    monthlyRevenue: 0,
    pendingTasks: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos
    const loadDashboardData = async () => {
      setLoading(true);
      
      // Simulación de datos
      setTimeout(() => {
        setStats({
          totalPatients: 1247,
          todayAppointments: 12,
          monthlyRevenue: 45280,
          pendingTasks: 8
        });
        
        setRecentAppointments([
          {
            id: 1,
            patient: 'María García',
            time: '09:30',
            doctor: 'Dr. López',
            type: 'Revisión',
            status: 'confirmed'
          },
          {
            id: 2,
            patient: 'Carlos Ruiz',
            time: '10:15',
            doctor: 'Dr. Martín',
            type: 'Limpieza',
            status: 'pending'
          },
          {
            id: 3,
            patient: 'Ana Torres',
            time: '11:00',
            doctor: 'Dr. López',
            type: 'Consulta',
            status: 'confirmed'
          }
        ]);
        
        setLoading(false);
      }, 1000);
    };

    loadDashboardData();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle size={16} />;
      case 'pending':
        return <Clock size={16} />;
      case 'cancelled':
        return <AlertCircle size={16} />;
      default:
        return <Activity size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-h3">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="text-h1">Dashboard</h1>
        <p className="text-body">
          Bienvenido al panel de control de la Clínica Dental Rubio García
        </p>
      </div>

      {/* Métricas principales */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={24} color="var(--primary-500)" />
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.totalPatients.toLocaleString()}</h3>
            <p className="stat-label">Total Pacientes</p>
            <span className="stat-change positive">
              <TrendingUp size={12} />
              +5.2% este mes
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Calendar size={24} color="var(--success-500)" />
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.todayAppointments}</h3>
            <p className="stat-label">Citas Hoy</p>
            <span className="stat-change neutral">
              <Clock size={12} />
              8 pendientes
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <DollarSign size={24} color="var(--warning-500)" />
          </div>
          <div className="stat-content">
            <h3 className="stat-number">€{stats.monthlyRevenue.toLocaleString()}</h3>
            <p className="stat-label">Ingresos Mensuales</p>
            <span className="stat-change positive">
              <TrendingUp size={12} />
              +12.3% vs mes anterior
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <AlertCircle size={24} color="var(--error-500)" />
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{stats.pendingTasks}</h3>
            <p className="stat-label">Tareas Pendientes</p>
            <span className="stat-change negative">
              <AlertCircle size={12} />
              Requieren atención
            </span>
          </div>
        </div>
      </div>

      {/* Citas recientes */}
      <div className="dashboard-content">
        <div className="card">
          <div className="card-header">
            <h2 className="text-h2">Citas de Hoy</h2>
            <button className="btn btn-secondary btn-sm">Ver Todas</button>
          </div>
          <div className="appointments-list">
            {recentAppointments.map((appointment) => (
              <div key={appointment.id} className="appointment-item">
                <div className="appointment-info">
                  <div className="appointment-time">
                    <span className="time">{appointment.time}</span>
                    <span className="date">Hoy</span>
                  </div>
                  <div className="appointment-details">
                    <h4 className="patient-name">{appointment.patient}</h4>
                    <p className="appointment-meta">
                      {appointment.type} • {appointment.doctor}
                    </p>
                  </div>
                </div>
                <div className={`appointment-status status-${getStatusColor(appointment.status)}`}>
                  {getStatusIcon(appointment.status)}
                  <span className="status-text">
                    {appointment.status === 'confirmed' ? 'Confirmada' : 
                     appointment.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel de acciones rápidas */}
        <div className="quick-actions">
          <div className="card">
            <div className="card-header">
              <h2 className="text-h2">Acciones Rápidas</h2>
            </div>
            <div className="actions-grid">
              <button className="action-btn">
                <Users size={20} />
                <span>Nuevo Paciente</span>
              </button>
              <button className="action-btn">
                <Calendar size={20} />
                <span>Nueva Cita</span>
              </button>
              <button className="action-btn">
                <CheckCircle size={20} />
                <span>Revisar Citas</span>
              </button>
              <button className="action-btn">
                <DollarSign size={20} />
                <span>Nueva Factura</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;