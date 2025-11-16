// Mock de servicios API para pruebas de frontend
// Eliminar cuando el backend esté disponible en producción

const API_DELAY = 1000; // Simular latencia de red

// Mock data para pruebas
const mockUser = {
  id: '1',
  name: 'Dr. María Rubio',
  email: 'admin@clinicadental.com',
  role: 'admin',
  clinicName: 'Clínica Dental Rubio García'
};

const mockStats = {
  totalPatients: 247,
  todayAppointments: 8,
  monthlyIncome: 15250.50,
  pendingAppointments: 12,
  completedThisWeek: 34,
  newPatients: 5
};

const mockPatients = [
  {
    id: '1',
    name: 'Ana García López',
    phone: '+34 612 345 678',
    email: 'ana.garcia@email.com',
    lastVisit: '2025-11-15',
    status: 'active',
    lopdConsent: true,
    nextAppointment: '2025-11-20'
  },
  {
    id: '2',
    name: 'Carlos Rodríguez Martín',
    phone: '+34 613 456 789',
    email: 'carlos.rodriguez@email.com',
    lastVisit: '2025-11-12',
    status: 'active',
    lopdConsent: true,
    nextAppointment: '2025-11-18'
  },
  {
    id: '3',
    name: 'Laura Fernández Silva',
    phone: '+34 614 567 890',
    email: 'laura.fernandez@email.com',
    lastVisit: '2025-11-10',
    status: 'inactive',
    lopdConsent: false,
    nextAppointment: null
  }
];

const mockAppointments = [
  {
    id: '1',
    patientName: 'Ana García López',
    patientPhone: '+34 612 345 678',
    date: '2025-11-16',
    time: '10:00',
    status: 'confirmed',
    type: 'Consulta general',
    notes: 'Revisión rutinaria'
  },
  {
    id: '2',
    patientName: 'Carlos Rodríguez Martín',
    patientPhone: '+34 613 456 789',
    date: '2025-11-16',
    time: '11:30',
    status: 'pending',
    type: 'Limpieza dental',
    notes: ''
  },
  {
    id: '3',
    patientName: 'Laura Fernández Silva',
    patientPhone: '+34 614 567 890',
    date: '2025-11-16',
    time: '16:00',
    status: 'confirmed',
    type: 'Ortodoncia',
    notes: 'Ajuste de brackets'
  }
];

export const apiMock = {
  // Login
  login: async (credentials) => {
    await new Promise(resolve => setTimeout(resolve, API_DELAY));
    
    if (credentials.email === 'admin@clinicadental.com' && credentials.password === 'password123') {
      return {
        success: true,
        token: 'mock-jwt-token-12345',
        user: mockUser
      };
    }
    
    throw new Error('Credenciales incorrectas');
  },

  // Profile
  getProfile: async (token) => {
    await new Promise(resolve => setTimeout(resolve, API_DELAY));
    
    if (token) {
      return {
        success: true,
        user: mockUser
      };
    }
    
    throw new Error('Token inválido');
  },

  // Dashboard stats
  getStats: async () => {
    await new Promise(resolve => setTimeout(resolve, API_DELAY));
    
    return {
      success: true,
      data: mockStats
    };
  },

  // Patients
  getPatients: async (params = {}) => {
    await new Promise(resolve => setTimeout(resolve, API_DELAY));
    
    let filtered = [...mockPatients];
    
    if (params.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search) ||
        p.phone.includes(search) ||
        p.email.toLowerCase().includes(search)
      );
    }
    
    if (params.lopdStatus) {
      filtered = filtered.filter(p => p.lopdConsent === (params.lopdStatus === 'consented'));
    }
    
    return {
      success: true,
      data: filtered,
      total: filtered.length
    };
  },

  // Appointments
  getAppointments: async (params = {}) => {
    await new Promise(resolve => setTimeout(resolve, API_DELAY));
    
    let filtered = [...mockAppointments];
    
    if (params.date === 'today') {
      filtered = filtered.filter(a => a.date === '2025-11-16');
    }
    
    if (params.date) {
      filtered = filtered.filter(a => a.date === params.date);
    }
    
    return {
      success: true,
      data: filtered,
      total: filtered.length
    };
  },

  // Health check
  healthCheck: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      data: {
        status: 'ok',
        message: 'Mock API funcionando correctamente',
        timestamp: new Date().toISOString()
      }
    };
  }
};

export default apiMock;