// Calendar Management System
class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.currentView = 'month';
        this.appointments = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadMockAppointments();
        this.renderCalendar();
    }

    setupEventListeners() {
        // View controls
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.getAttribute('data-view');
                this.changeView(view);
            });
        });

        // Navigation
        const prevMonth = document.getElementById('prevMonth');
        const nextMonth = document.getElementById('nextMonth');
        
        if (prevMonth) prevMonth.addEventListener('click', () => this.previousMonth());
        if (nextMonth) nextMonth.addEventListener('click', () => this.nextMonth());

        // New appointment button
        const newAppointmentBtn = document.getElementById('newAppointmentBtn');
        if (newAppointmentBtn) {
            newAppointmentBtn.addEventListener('click', () => this.showNewAppointmentModal());
        }
    }

    changeView(view) {
        this.currentView = view;
        
        // Update button states
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        this.renderCalendar();
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }

    renderCalendar() {
        this.updateCalendarTitle();
        
        switch (this.currentView) {
            case 'day':
                this.renderDayView();
                break;
            case 'week':
                this.renderWeekView();
                break;
            case 'month':
            default:
                this.renderMonthView();
                break;
        }
    }

    updateCalendarTitle() {
        const titleElement = document.getElementById('calendarTitle');
        if (!titleElement) return;

        const options = { 
            year: 'numeric', 
            month: 'long'
        };
        
        titleElement.textContent = this.currentDate.toLocaleDateString('es-ES', options);
    }

    renderMonthView() {
        const container = document.getElementById('calendarGrid');
        if (!container) return;

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        // Clear container
        container.innerHTML = '';

        // Add day headers
        const dayHeaders = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-day-header';
            header.textContent = day;
            container.appendChild(header);
        });

        // Calculate days to show (including previous and next month days)
        const totalDays = 42; // 6 weeks × 7 days
        const days = [];

        for (let i = 0; i < totalDays; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            days.push(currentDate);
        }

        // Render days
        days.forEach(date => {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            // Add classes
            if (date.getMonth() !== month) {
                dayElement.classList.add('other-month');
            }
            if (this.isToday(date)) {
                dayElement.classList.add('today');
            }
            
            // Check if has appointments
            const dayAppointments = this.getAppointmentsForDate(date);
            if (dayAppointments.length > 0) {
                dayElement.classList.add('has-appointments');
            }

            // Day number
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = date.getDate();
            dayElement.appendChild(dayNumber);

            // Appointment dots
            if (dayAppointments.length > 0) {
                const dotsContainer = document.createElement('div');
                dotsContainer.className = 'appointment-dots';
                
                // Show up to 3 dots, then +X if more
                const maxDots = 3;
                dayAppointments.slice(0, maxDots).forEach(() => {
                    const dot = document.createElement('div');
                    dot.className = 'appointment-dot';
                    dotsContainer.appendChild(dot);
                });
                
                if (dayAppointments.length > maxDots) {
                    const extra = document.createElement('div');
                    extra.className = 'appointment-dot';
                    extra.textContent = `+${dayAppointments.length - maxDots}`;
                    extra.style.fontSize = '8px';
                    extra.style.width = '16px';
                    extra.style.height = '16px';
                    extra.style.display = 'flex';
                    extra.style.alignItems = 'center';
                    extra.style.justifyContent = 'center';
                    dotsContainer.appendChild(extra);
                }
                
                dayElement.appendChild(dotsContainer);
            }

            // Click handler
            dayElement.addEventListener('click', () => {
                this.selectDate(date);
            });

            container.appendChild(dayElement);
        });
    }

    renderWeekView() {
        const container = document.getElementById('calendarGrid');
        if (!container) return;

        // Simplified week view - showing current week
        container.innerHTML = '';

        const startOfWeek = this.getStartOfWeek(this.currentDate);
        const days = [];

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            days.push(date);
        }

        // Header with days
        days.forEach(date => {
            const header = document.createElement('div');
            header.className = 'calendar-day-header';
            header.textContent = date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
            container.appendChild(header);
        });

        // Time slots (simplified)
        const timeSlots = ['09:00', '10:00', '11:00', '12:00', '16:00', '17:00', '18:00'];
        
        timeSlots.forEach(time => {
            const timeLabel = document.createElement('div');
            timeLabel.className = 'calendar-day-header';
            timeLabel.textContent = time;
            container.appendChild(timeLabel);

            days.forEach(date => {
                const slotElement = document.createElement('div');
                slotElement.className = 'calendar-day';
                
                if (this.isToday(date)) {
                    slotElement.classList.add('today');
                }

                const appointments = this.getAppointmentsForDateTime(date, time);
                if (appointments.length > 0) {
                    slotElement.classList.add('has-appointments');
                    slotElement.innerHTML = `<div class="appointment-text">${appointments[0].patient}</div>`;
                }

                container.appendChild(slotElement);
            });
        });
    }

    renderDayView() {
        const container = document.getElementById('calendarGrid');
        if (!container) return;

        container.innerHTML = '';

        const appointments = this.getAppointmentsForDate(this.currentDate);
        
        if (appointments.length === 0) {
            container.innerHTML = `
                <div class="no-appointments">
                    <h3>No hay citas para este día</h3>
                    <button class="btn btn-primary" onclick="calendarManager.showNewAppointmentModal()">
                        <i class="fas fa-plus"></i> Nueva Cita
                    </button>
                </div>
            `;
            return;
        }

        appointments.forEach(appointment => {
            const appointmentElement = document.createElement('div');
            appointmentElement.className = 'calendar-appointment-card';
            appointmentElement.innerHTML = `
                <div class="appointment-time">${appointment.time}</div>
                <div class="appointment-details">
                    <h4>${appointment.patient}</h4>
                    <p>${appointment.treatment}</p>
                    <span class="appointment-status ${appointment.status}">${this.getStatusText(appointment.status)}</span>
                </div>
                <div class="appointment-actions">
                    <button onclick="calendarManager.editAppointment(${appointment.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="calendarManager.cancelAppointment(${appointment.id})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            container.appendChild(appointmentElement);
        });
    }

    selectDate(date) {
        this.currentDate = new Date(date);
        
        if (this.currentView === 'month') {
            // If clicking on a day in month view, switch to day view
            this.changeView('day');
        } else {
            this.renderCalendar();
        }
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    getStartOfWeek(date) {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day;
        start.setDate(diff);
        return start;
    }

    getAppointmentsForDate(date) {
        return this.appointments.filter(apt => {
            const aptDate = new Date(apt.date);
            return aptDate.toDateString() === date.toDateString();
        });
    }

    getAppointmentsForDateTime(date, time) {
        return this.appointments.filter(apt => {
            const aptDate = new Date(apt.date);
            return aptDate.toDateString() === date.toDateString() && apt.time === time;
        });
    }

    getStatusText(status) {
        const statusTexts = {
            'confirmed': 'Confirmada',
            'pending': 'Pendiente',
            'cancelled': 'Cancelada',
            'completed': 'Completada',
            'urgent': 'Urgente'
        };
        return statusTexts[status] || status;
    }

    loadMockAppointments() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        this.appointments = [
            {
                id: 1,
                date: today.toISOString().split('T')[0],
                time: '09:00',
                patient: 'María García',
                treatment: 'Consulta General',
                status: 'confirmed',
                duration: 30
            },
            {
                id: 2,
                date: today.toISOString().split('T')[0],
                time: '10:30',
                patient: 'Carlos Ruiz',
                treatment: 'Limpieza Dental',
                status: 'confirmed',
                duration: 60
            },
            {
                id: 3,
                date: tomorrow.toISOString().split('T')[0],
                time: '11:00',
                patient: 'Ana López',
                treatment: 'Revisión',
                status: 'pending',
                duration: 30
            },
            {
                id: 4,
                date: tomorrow.toISOString().split('T')[0],
                time: '14:00',
                patient: 'Pedro Martín',
                treatment: 'Implante',
                status: 'confirmed',
                duration: 90
            }
        ];
    }

    showNewAppointmentModal() {
        // Set default date to selected date
        const dateInput = document.querySelector('#appointmentForm input[name="date"]');
        if (dateInput) {
            dateInput.value = this.currentDate.toISOString().split('T')[0];
        }

        // Open modal
        if (window.dentalApp) {
            window.dentalApp.openModal('appointmentModal');
        }
    }

    editAppointment(appointmentId) {
        const appointment = this.appointments.find(apt => apt.id === appointmentId);
        if (!appointment) return;

        // Populate form with appointment data
        const form = document.getElementById('appointmentForm');
        if (form) {
            form.querySelector('select[name="patient"]').value = appointment.patientId || '';
            form.querySelector('input[name="date"]').value = appointment.date;
            form.querySelector('input[name="time"]').value = appointment.time;
            form.querySelector('select[name="duration"]').value = appointment.duration;
            form.querySelector('select[name="treatment"]').value = appointment.treatment;
            form.querySelector('textarea[name="notes"]').value = appointment.notes || '';
            
            // Change submit button text
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Actualizar Cita';
            }
        }

        // Open modal
        if (window.dentalApp) {
            window.dentalApp.openModal('appointmentModal');
        }
    }

    cancelAppointment(appointmentId) {
        if (confirm('¿Estás seguro de que quieres cancelar esta cita?')) {
            const appointment = this.appointments.find(apt => apt.id === appointmentId);
            if (appointment) {
                appointment.status = 'cancelled';
                this.renderCalendar();
                
                if (window.dentalApp) {
                    window.dentalApp.showNotification('Cita cancelada', 'info');
                }
            }
        }
    }

    addAppointment(appointment) {
        appointment.id = Math.max(...this.appointments.map(a => a.id), 0) + 1;
        this.appointments.push(appointment);
        this.renderCalendar();
    }

    async updateAppointment(appointmentId, updatedData) {
        try {
            console.log('✏️ Actualizando cita:', appointmentId);
            
            if (window.dbManager) {
                await window.dbManager.updateAppointment(appointmentId, updatedData);
                await this.loadAppointments();
                this.renderCalendar();
            } else {
                // Fallback a localStorage
                const index = this.appointments.findIndex(apt => apt.id === appointmentId);
                if (index !== -1) {
                    this.appointments[index] = { ...this.appointments[index], ...updatedData };
                    localStorage.setItem('appointments', JSON.stringify(this.appointments));
                    this.renderCalendar();
                }
            }
            
            this.showNotification('Cita actualizada exitosamente', 'success');
        } catch (error) {
            console.error('❌ Error actualizando cita:', error);
            this.showNotification('Error actualizando la cita', 'error');
        }
    }

    async deleteAppointment(appointmentId) {
        try {
            console.log('🗑️ Eliminando cita:', appointmentId);
            
            if (window.dbManager) {
                await window.dbManager.deleteAppointment(appointmentId);
                await this.loadAppointments();
                this.renderCalendar();
            } else {
                // Fallback a localStorage
                this.appointments = this.appointments.filter(apt => apt.id !== appointmentId);
                localStorage.setItem('appointments', JSON.stringify(this.appointments));
                this.renderCalendar();
            }
            
            this.showNotification('Cita eliminada exitosamente', 'success');
        } catch (error) {
            console.error('❌ Error eliminando cita:', error);
            this.showNotification('Error eliminando la cita', 'error');
        }
    }

    // Export appointments data
    exportAppointments(format = 'json') {
        const data = {
            appointments: this.appointments,
            exportDate: new Date().toISOString(),
            clinic: 'Rubio García Dental'
        };

        switch (format) {
            case 'json':
                return JSON.stringify(data, null, 2);
            case 'csv':
                return this.convertToCSV(this.appointments);
            default:
                return JSON.stringify(data, null, 2);
        }
    }

    convertToCSV(appointments) {
        const headers = ['ID', 'Fecha', 'Hora', 'Paciente', 'Tratamiento', 'Estado', 'Duración'];
        const rows = appointments.map(apt => [
            apt.id,
            apt.date,
            apt.time,
            apt.patient,
            apt.treatment,
            apt.status,
            apt.duration
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    /**
     * Mostrar notificaciones al usuario
     */
    showNotification(message, type = 'info') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;

        // Agregar al DOM
        const container = document.getElementById('notificationContainer') || document.body;
        container.appendChild(notification);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

        // Botón de cerrar
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });
    }
}

// Initialize calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.calendarManager = new CalendarManager();
});