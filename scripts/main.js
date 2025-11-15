// Main Application JavaScript
class DentalClinicApp {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'home';
        this.sidebarCollapsed = false;
        this.isLoading = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeData();
        this.showLoadingScreen();
        
        // Simulate loading time
        setTimeout(() => {
            this.hideLoadingScreen();
            this.showLoginScreen();
        }, 3000);
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-section]')) {
                e.preventDefault();
                const section = e.target.getAttribute('data-section');
                this.navigateToSection(section);
            }
        });

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Quick actions
        document.addEventListener('click', (e) => {
            if (e.target.matches('.action-btn, .action-btn *')) {
                e.preventDefault();
                const action = e.target.closest('.action-btn').getAttribute('data-action');
                this.handleQuickAction(action);
            }
        });

        // Modal handling
        document.addEventListener('click', (e) => {
            if (e.target.matches('.modal, .modal *')) {
                if (e.target.classList.contains('modal-close') || e.target === e.currentTarget) {
                    this.closeModal();
                }
            }
        });

        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.matches('#appointmentForm')) {
                e.preventDefault();
                this.handleNewAppointment(e.target);
            } else if (e.target.matches('#patientForm')) {
                e.preventDefault();
                this.handleNewPatient(e.target);
            } else if (e.target.matches('#invoiceForm')) {
                e.preventDefault();
                this.handleNewInvoice(e.target);
            } else if (e.target.matches('#clinicForm')) {
                e.preventDefault();
                this.handleClinicUpdate(e.target);
            }
        });

        // Add item button for invoices
        document.addEventListener('click', (e) => {
            if (e.target.id === 'addItem') {
                this.addInvoiceItem();
            } else if (e.target.classList.contains('btn-remove-item')) {
                this.removeInvoiceItem(e.target);
            }
        });

        // Auto-calculate invoice totals
        document.addEventListener('input', (e) => {
            if (e.target.closest('#invoiceForm')) {
                this.calculateInvoiceTotals();
            }
        });
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }

    showLoginScreen() {
        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen) {
            loginScreen.classList.remove('hidden');
        }
    }

    hideLoginScreen() {
        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen) {
            loginScreen.classList.add('hidden');
        }
    }

    showMainApp() {
        const mainApp = document.getElementById('mainApp');
        if (mainApp) {
            mainApp.classList.remove('hidden');
        }
    }

    handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const username = formData.get('username');
        const password = formData.get('password');

        // Hardcoded credentials for demo
        if (username === 'JMD' && password === '190582') {
            this.currentUser = {
                username: 'JMD',
                name: 'Juan Antonio Manzanedo',
                email: 'info@rubiogarciadental.com',
                role: 'admin'
            };

            this.hideLoginScreen();
            this.showMainApp();
            this.loadInitialData();
            this.showNotification('Login exitoso', 'success');
        } else {
            this.showNotification('Credenciales incorrectas', 'error');
        }
    }

    handleLogout() {
        this.currentUser = null;
        this.showLoginScreen();
        this.hideMainApp();
        this.showNotification('Sesión cerrada', 'info');
    }

    hideMainApp() {
        const mainApp = document.getElementById('mainApp');
        if (mainApp) {
            mainApp.classList.add('hidden');
        }
    }

    navigateToSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeMenuItem = document.querySelector(`[data-section="${sectionName}"]`).closest('.menu-item');
        if (activeMenuItem) {
            activeMenuItem.classList.add('active');
        }

        // Update content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update breadcrumb
        const breadcrumb = document.getElementById('currentSection');
        if (breadcrumb) {
            const sectionTitles = {
                'home': 'Panel de Control',
                'agenda': 'Agenda de Citas',
                'pacientes': 'Pacientes',
                'whatsapp': 'WhatsApp',
                'agente-ia': 'Agente IA',
                'documentos': 'Documentos',
                'facturas': 'Facturas',
                'contabilidad': 'Contabilidad',
                'configuracion': 'Configuración'
            };
            breadcrumb.textContent = sectionTitles[sectionName] || 'Panel de Control';
        }

        this.currentSection = sectionName;

        // Load section-specific data
        this.loadSectionData(sectionName);
    }

    loadSectionData(sectionName) {
        switch (sectionName) {
            case 'home':
                this.loadDashboardData();
                break;
            case 'agenda':
                this.loadCalendarData();
                break;
            case 'pacientes':
                this.loadPatientsData();
                break;
            case 'whatsapp':
                this.loadWhatsAppData();
                break;
            case 'agente-ia':
                this.loadAIData();
                break;
            case 'documentos':
                this.loadDocumentsData();
                break;
            case 'facturas':
                this.loadInvoicesData();
                break;
            case 'contabilidad':
                this.loadAccountingData();
                break;
            case 'configuracion':
                this.loadConfigData();
                break;
        }
    }

    loadInitialData() {
        this.loadDashboardData();
        this.initializePatientsList();
        this.initializeCalendar();
        this.initializeWhatsApp();
        this.initializeAI();
        this.initializeInvoices();
        this.initializeAccounting();
    }

    loadDashboardData() {
        this.loadTodayAppointments();
        this.loadUrgentMessages();
    }

    loadTodayAppointments() {
        const container = document.getElementById('todayAppointments');
        if (!container) return;

        const appointments = [
            {
                time: '09:00',
                patient: 'María García',
                treatment: 'Consulta General',
                status: 'confirmed'
            },
            {
                time: '10:30',
                patient: 'Carlos Ruiz',
                treatment: 'Limpieza Dental',
                status: 'confirmed'
            },
            {
                time: '11:15',
                patient: 'Ana López',
                treatment: 'Revisión',
                status: 'urgent'
            },
            {
                time: '12:00',
                patient: 'Pedro Martín',
                treatment: 'Tratamiento',
                status: 'confirmed'
            }
        ];

        container.innerHTML = appointments.map(apt => `
            <div class="appointment-item">
                <div class="item-icon appointment">
                    <i class="fas fa-calendar"></i>
                </div>
                <div class="item-content">
                    <div class="item-title">${apt.patient}</div>
                    <div class="item-subtitle">${apt.treatment}</div>
                </div>
                <div class="item-time">${apt.time}</div>
            </div>
        `).join('');
    }

    loadUrgentMessages() {
        const container = document.getElementById('urgentMessages');
        if (!container) return;

        const messages = [
            {
                patient: 'Laura Fernández',
                message: 'Dolor de muela, necesito cita urgente',
                time: '10:45'
            },
            {
                patient: 'Miguel Santos',
                message: 'Consulta sobre tratamiento de ortodoncia',
                time: '11:20'
            },
            {
                patient: 'Sofia Romero',
                message: 'Aplazar cita de mañana',
                time: '11:55'
            }
        ];

        container.innerHTML = messages.map(msg => `
            <div class="message-item">
                <div class="item-icon message">
                    <i class="fas fa-comment"></i>
                </div>
                <div class="item-content">
                    <div class="item-title">${msg.patient}</div>
                    <div class="item-subtitle">${msg.message}</div>
                </div>
                <div class="item-time">${msg.time}</div>
            </div>
        `).join('');
    }

    handleQuickAction(action) {
        switch (action) {
            case 'new-appointment':
                this.openModal('appointmentModal');
                break;
            case 'new-patient':
                this.openModal('patientModal');
                break;
            case 'send-message':
                this.navigateToSection('whatsapp');
                break;
            case 'new-invoice':
                this.openModal('invoiceModal');
                break;
        }
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            // Initialize form if needed
            if (modalId === 'invoiceModal') {
                this.generateInvoiceNumber();
                this.calculateInvoiceTotals();
            }
        }
    }

    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('active');
        }
    }

    handleNewAppointment(form) {
        const formData = new FormData(form);
        const appointment = Object.fromEntries(formData.entries());
        
        // Add appointment logic here
        console.log('Nueva cita:', appointment);
        
        this.showNotification('Cita creada exitosamente', 'success');
        this.closeModal();
        form.reset();
        
        // Reload calendar
        this.loadCalendarData();
    }

    handleNewPatient(form) {
        const formData = new FormData(form);
        const patient = Object.fromEntries(formData.entries());
        
        // Add patient logic here
        console.log('Nuevo paciente:', patient);
        
        this.showNotification('Paciente creado exitosamente', 'success');
        this.closeModal();
        form.reset();
        
        // Reload patients list
        this.loadPatientsData();
    }

    handleNewInvoice(form) {
        const formData = new FormData(form);
        const invoice = Object.fromEntries(formData.entries());
        
        // Add invoice logic here
        console.log('Nueva factura:', invoice);
        
        this.showNotification('Factura creada exitosamente', 'success');
        this.closeModal();
        form.reset();
        
        // Reload invoices list
        this.loadInvoicesData();
    }

    handleClinicUpdate(form) {
        const formData = new FormData(form);
        const clinicData = Object.fromEntries(formData.entries());
        
        // Update clinic data logic here
        console.log('Datos de clínica actualizados:', clinicData);
        
        this.showNotification('Datos de clínica actualizados', 'success');
    }

    generateInvoiceNumber() {
        const invoiceNumberInput = document.querySelector('#invoiceForm input[name="invoiceNumber"]');
        if (invoiceNumberInput) {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            
            invoiceNumberInput.value = `F${year}${month}${day}-${random}`;
        }

        // Generate hash (simplified)
        const hashElement = document.getElementById('invoiceHash');
        if (hashElement) {
            const hash = this.generateSimpleHash();
            hashElement.textContent = hash;
        }
    }

    generateSimpleHash() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 32; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    addInvoiceItem() {
        const tbody = document.getElementById('invoiceItems');
        if (tbody) {
            const newRow = tbody.querySelector('tr').cloneNode(true);
            // Clear inputs in new row
            newRow.querySelectorAll('input').forEach(input => {
                if (input.type === 'number') {
                    input.value = '1';
                } else {
                    input.value = '';
                }
            });
            tbody.appendChild(newRow);
            this.calculateInvoiceTotals();
        }
    }

    removeInvoiceItem(button) {
        const row = button.closest('tr');
        const tbody = document.getElementById('invoiceItems');
        if (tbody && tbody.children.length > 1) {
            row.remove();
            this.calculateInvoiceTotals();
        }
    }

    calculateInvoiceTotals() {
        const tbody = document.getElementById('invoiceItems');
        if (!tbody) return;

        let subtotal = 0;
        let totalIva = 0;

        tbody.querySelectorAll('tr').forEach(row => {
            const quantity = parseFloat(row.querySelector('input[name="quantity[]"]').value) || 0;
            const price = parseFloat(row.querySelector('input[name="price[]"]').value) || 0;
            const iva = parseFloat(row.querySelector('select[name="iva[]"]').value) || 0;

            const itemTotal = quantity * price;
            const itemIva = itemTotal * (iva / 100);
            const itemTotalWithIva = itemTotal + itemIva;

            row.querySelector('.item-total').textContent = itemTotalWithIva.toFixed(2) + '€';

            subtotal += itemTotal;
            totalIva += itemIva;
        });

        const total = subtotal + totalIva;

        // Update totals display
        document.getElementById('subtotal').textContent = subtotal.toFixed(2) + '€';
        document.getElementById('totalIva').textContent = totalIva.toFixed(2) + '€';
        document.getElementById('totalAmount').textContent = total.toFixed(2) + '€';
    }

    initializeData() {
        // Initialize with mock data
        this.mockData = {
            patients: [
                {
                    id: 1,
                    name: 'María García',
                    surname: 'López',
                    phone: '+34 600 123 456',
                    email: 'maria@email.com',
                    status: 'active'
                },
                {
                    id: 2,
                    name: 'Carlos',
                    surname: 'Ruiz',
                    phone: '+34 600 234 567',
                    email: 'carlos@email.com',
                    status: 'active'
                },
                {
                    id: 3,
                    name: 'Ana',
                    surname: 'Martín',
                    phone: '+34 600 345 678',
                    email: 'ana@email.com',
                    status: 'active'
                }
            ],
            appointments: [],
            invoices: []
        };
    }

    initializePatientsList() {
        const select = document.querySelector('#appointmentForm select[name="patient"]');
        if (select) {
            select.innerHTML = '<option value="">Seleccionar paciente</option>';
            this.mockData.patients.forEach(patient => {
                select.innerHTML += `<option value="${patient.id}">${patient.name} ${patient.surname}</option>`;
            });
        }
    }

    loadPatientsData() {
        const container = document.getElementById('patientsList');
        if (!container) return;

        container.innerHTML = this.mockData.patients.map(patient => `
            <div class="patient-card">
                <div class="patient-info">
                    <div class="patient-avatar">
                        ${patient.name.charAt(0)}${patient.surname.charAt(0)}
                    </div>
                    <div class="patient-details">
                        <div class="patient-name">${patient.name} ${patient.surname}</div>
                        <div class="patient-contact">
                            ${patient.phone} | ${patient.email}
                        </div>
                    </div>
                    <div class="patient-status ${patient.status}">
                        ${patient.status === 'active' ? 'Activo' : 'Inactivo'}
                    </div>
                </div>
            </div>
        `).join('');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);

        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Placeholder methods for other sections
    loadCalendarData() {
        // Calendar data loading
        console.log('Loading calendar data...');
    }

    loadWhatsAppData() {
        // WhatsApp data loading
        console.log('Loading WhatsApp data...');
    }

    loadAIData() {
        // AI agent data loading
        console.log('Loading AI data...');
    }

    loadDocumentsData() {
        // Documents data loading
        console.log('Loading documents data...');
    }

    loadInvoicesData() {
        // Invoices data loading
        console.log('Loading invoices data...');
    }

    loadAccountingData() {
        // Accounting data loading
        console.log('Loading accounting data...');
    }

    loadConfigData() {
        // Configuration data loading
        console.log('Loading config data...');
    }

    // Calendar initialization
    initializeCalendar() {
        // Calendar initialization
        console.log('Initializing calendar...');
    }

    // WhatsApp initialization
    initializeWhatsApp() {
        // WhatsApp initialization
        console.log('Initializing WhatsApp...');
    }

    // AI initialization
    initializeAI() {
        // AI initialization
        console.log('Initializing AI...');
    }

    // Invoice initialization
    initializeInvoices() {
        // Invoice initialization
        console.log('Initializing invoices...');
    }

    // Accounting initialization
    initializeAccounting() {
        // Accounting initialization
        console.log('Initializing accounting...');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dentalApp = new DentalClinicApp();
});

// Add notification styles
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 10000;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
    }
    
    .notification-success { border-left: 4px solid #198754; }
    .notification-error { border-left: 4px solid #DC3545; }
    .notification-warning { border-left: 4px solid #FFC107; }
    .notification-info { border-left: 4px solid #0F74A8; }
    
    .notification i {
        font-size: 16px;
    }
    
    .notification-success i { color: #198754; }
    .notification-error i { color: #DC3545; }
    .notification-warning i { color: #FFC107; }
    .notification-info i { color: #0F74A8; }
    
    .notification-close {
        background: none;
        border: none;
        font-size: 18px;
        color: #6C757D;
        cursor: pointer;
        margin-left: auto;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);