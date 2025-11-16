// Servicio API unificado - Backend real con fallback a mock
import apiMock from './apiMock';

const API_BASE_URL = 'https://clinica-dental-backend.onrender.com';

class ApiService {
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.log(`Backend no disponible para ${endpoint}, usando mock:`, error.message);
      return null; // Indica que debe usarse mock
    }
  }

  // Health check
  async healthCheck() {
    const realResult = await this.request('/api/system/health');
    if (realResult) return realResult;
    return await apiMock.healthCheck();
  }

  // Dashboard stats
  async getStats() {
    const realResult = await this.request('/api/system/stats');
    if (realResult) return realResult;
    return await apiMock.getStats();
  }

  // Patients
  async getPatients(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const realResult = await this.request(`/api/patients${queryString ? '?' + queryString : ''}`);
    if (realResult) return realResult;
    return await apiMock.getPatients(params);
  }

  async getPatient(id) {
    const realResult = await this.request(`/api/patients/${id}`);
    if (realResult) return realResult;
    // Buscar en mock
    const mockResult = await apiMock.getPatients();
    return {
      success: true,
      data: mockResult.data.find(p => p.id === id)
    };
  }

  async createPatient(patientData) {
    const realResult = await this.request('/api/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
    if (realResult) return realResult;
    // Mock crear paciente
    return {
      success: true,
      data: { ...patientData, id: Date.now().toString() }
    };
  }

  async updatePatient(id, patientData) {
    const realResult = await this.request(`/api/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patientData),
    });
    if (realResult) return realResult;
    // Mock actualizar paciente
    return {
      success: true,
      data: { ...patientData, id }
    };
  }

  async deletePatient(id) {
    const realResult = await this.request(`/api/patients/${id}`, {
      method: 'DELETE',
    });
    if (realResult) return realResult;
    // Mock eliminar paciente
    return { success: true };
  }

  // Appointments
  async getAppointments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const realResult = await this.request(`/api/appointments${queryString ? '?' + queryString : ''}`);
    if (realResult) return realResult;
    return await apiMock.getAppointments(params);
  }

  async getAppointment(id) {
    const realResult = await this.request(`/api/appointments/${id}`);
    if (realResult) return realResult;
    // Buscar en mock
    const mockResult = await apiMock.getAppointments();
    return {
      success: true,
      data: mockResult.data.find(a => a.id === id)
    };
  }

  async createAppointment(appointmentData) {
    const realResult = await this.request('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
    if (realResult) return realResult;
    // Mock crear cita
    return {
      success: true,
      data: { ...appointmentData, id: Date.now().toString() }
    };
  }

  async updateAppointment(id, appointmentData) {
    const realResult = await this.request(`/api/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointmentData),
    });
    if (realResult) return realResult;
    // Mock actualizar cita
    return {
      success: true,
      data: { ...appointmentData, id }
    };
  }

  async deleteAppointment(id) {
    const realResult = await this.request(`/api/appointments/${id}`, {
      method: 'DELETE',
    });
    if (realResult) return realResult;
    // Mock eliminar cita
    return { success: true };
  }

  // Doctors
  async getDoctors() {
    const realResult = await this.request('/api/doctors');
    if (realResult) return realResult;
    // Mock doctores
    return {
      success: true,
      data: [
        { id: '1', name: 'Dr. María Rubio', specialty: 'Odontología General', email: 'maria@clinicadental.com' },
        { id: '2', name: 'Dr. Carlos García', specialty: 'Ortodoncia', email: 'carlos@clinicadental.com' },
        { id: '3', name: 'Dra. Laura Martín', specialty: 'Implantología', email: 'laura@clinicadental.com' }
      ]
    };
  }

  // Questionnaires
  async getQuestionnaires() {
    const realResult = await this.request('/api/questionnaires');
    if (realResult) return realResult;
    // Mock cuestionarios
    return {
      success: true,
      data: [
        { id: '1', title: 'Cuestionario de Salud General', active: true },
        { id: '2', title: 'Cuestionario de Alergias', active: true },
        { id: '3', title: 'Cuestionario LOPD', active: false }
      ]
    };
  }

  // Invoices
  async getInvoices() {
    const realResult = await this.request('/api/invoices');
    if (realResult) return realResult;
    // Mock facturas
    return {
      success: true,
      data: [
        { id: '1', patientName: 'Ana García', amount: 150.50, date: '2025-11-15', status: 'paid' },
        { id: '2', patientName: 'Carlos Rodríguez', amount: 89.00, date: '2025-11-14', status: 'pending' }
      ]
    };
  }

  // WhatsApp conversations
  async getConversations() {
    const realResult = await this.request('/api/whatsapp/conversations');
    if (realResult) return realResult;
    // Mock conversaciones
    return {
      success: true,
      data: [
        { id: '1', patientName: 'Ana García', lastMessage: 'Hola, necesito cambiar mi cita', timestamp: '2025-11-16T10:00:00Z' },
        { id: '2', patientName: 'Carlos Rodríguez', lastMessage: 'Gracias por la información', timestamp: '2025-11-16T09:30:00Z' }
      ]
    };
  }
}

export default new ApiService();