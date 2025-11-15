/**
 * Database Manager - Rubio García Dental
 * Manejo de conexión y operaciones con SQL Server
 */

class DatabaseManager {
    constructor() {
        this.connection = null;
        this.isConnected = false;
        this.cache = new Map();
        this.lastSyncTime = null;
        this.syncInterval = null;
        
        this.init();
    }

    async init() {
        console.log('🔄 Inicializando Database Manager...');
        this.setupEventListeners();
        this.startSync();
    }

    /**
     * Configurar event listeners para sincronización
     */
    setupEventListeners() {
        // Sincronizar cuando la página se carga
        document.addEventListener('DOMContentLoaded', () => {
            this.syncWithServer();
        });

        // Sincronizar antes de cerrar la página
        window.addEventListener('beforeunload', () => {
            this.syncWithServer();
        });

        // Sincronizar cada 30 segundos
        setInterval(() => {
            this.syncWithServer();
        }, 30000);
    }

    /**
     * Simular conexión SQL Server (en producción, esto sería real)
     * Por ahora mantenemos la simulación pero con estructura real
     */
    async connect() {
        try {
            console.log('🔌 Conectando a SQL Server...');
            
            // En producción, aquí iría la conexión real con SQL Server
            // const connection = new sql.Connection(SQL_CONFIG.server, SQL_CONFIG.authentication);
            // await connection.connect();
            
            // Simulación de conexión exitosa
            this.isConnected = true;
            console.log('✅ Conexión establecida con SQL Server');
            
            // Cargar datos iniciales
            await this.loadInitialData();
            
            return true;
        } catch (error) {
            console.error('❌ Error de conexión:', error);
            this.isConnected = false;
            return false;
        }
    }

    /**
     * Cargar datos iniciales desde SQL Server
     */
    async loadInitialData() {
        try {
            console.log('📥 Cargando datos desde SQL Server...');
            
            // Simular carga de datos
            const appointments = await this.getAppointments();
            const patients = await this.getPatients();
            
            // Cachear datos
            this.cache.set('appointments', appointments);
            this.cache.set('patients', patients);
            
            console.log(`✅ Datos cargados: ${appointments.length} citas, ${patients.length} pacientes`);
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
        }
    }

    /**
     * Obtener todas las citas (simulado)
     */
    async getAppointments(date = null) {
        try {
            if (this.isConnected) {
                // En producción: const result = await this.connection.query(SQL_CONFIG.queries.getAppointmentsByDate, [date]);
                
                // Simulación de datos desde SQL Server
                let appointments = JSON.parse(localStorage.getItem('appointments')) || this.getSampleAppointments();
                
                if (date) {
                    appointments = appointments.filter(apt => apt.date === date);
                }
                
                return appointments;
            } else {
                return JSON.parse(localStorage.getItem('appointments')) || [];
            }
        } catch (error) {
            console.error('❌ Error obteniendo citas:', error);
            return [];
        }
    }

    /**
     * Crear nueva cita
     */
    async createAppointment(appointmentData) {
        try {
            console.log('➕ Creando nueva cita:', appointmentData);
            
            const newAppointment = {
                id: this.generateId(),
                ...appointmentData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (this.isConnected) {
                // En producción: await this.connection.query(SQL_CONFIG.queries.createAppointment, [
                //     appointmentData.patientId,
                //     appointmentData.date,
                //     appointmentData.time,
                //     appointmentData.duration,
                //     appointmentData.treatment,
                //     appointmentData.notes
                // ]);
                
                // Actualizar cache
                const appointments = this.cache.get('appointments') || [];
                appointments.push(newAppointment);
                this.cache.set('appointments', appointments);
            }

            // Actualizar localStorage
            const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
            appointments.push(newAppointment);
            localStorage.setItem('appointments', JSON.stringify(appointments));

            // Notificar cambios
            this.notifyChange('appointment', 'create', newAppointment);

            console.log('✅ Cita creada exitosamente');
            return newAppointment;

        } catch (error) {
            console.error('❌ Error creando cita:', error);
            throw error;
        }
    }

    /**
     * Actualizar cita existente
     */
    async updateAppointment(id, appointmentData) {
        try {
            console.log('✏️ Actualizando cita:', id, appointmentData);
            
            const updatedAppointment = {
                ...appointmentData,
                id: id,
                updatedAt: new Date().toISOString()
            };

            if (this.isConnected) {
                // En producción: await this.connection.query(SQL_CONFIG.queries.updateAppointment, [
                //     appointmentData.date,
                //     appointmentData.time,
                //     appointmentData.duration,
                //     appointmentData.treatment,
                //     appointmentData.notes,
                //     id
                // ]);
                
                // Actualizar cache
                const appointments = this.cache.get('appointments') || [];
                const index = appointments.findIndex(apt => apt.id === id);
                if (index !== -1) {
                    appointments[index] = updatedAppointment;
                    this.cache.set('appointments', appointments);
                }
            }

            // Actualizar localStorage
            const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
            const index = appointments.findIndex(apt => apt.id === id);
            if (index !== -1) {
                appointments[index] = updatedAppointment;
                localStorage.setItem('appointments', JSON.stringify(appointments));
            }

            // Notificar cambios
            this.notifyChange('appointment', 'update', updatedAppointment);

            console.log('✅ Cita actualizada exitosamente');
            return updatedAppointment;

        } catch (error) {
            console.error('❌ Error actualizando cita:', error);
            throw error;
        }
    }

    /**
     * Eliminar cita
     */
    async deleteAppointment(id) {
        try {
            console.log('🗑️ Eliminando cita:', id);
            
            if (this.isConnected) {
                // En producción: await this.connection.query(SQL_CONFIG.queries.deleteAppointment, [id]);
                
                // Actualizar cache
                const appointments = this.cache.get('appointments') || [];
                const filteredAppointments = appointments.filter(apt => apt.id !== id);
                this.cache.set('appointments', filteredAppointments);
            }

            // Actualizar localStorage
            const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
            const filteredAppointments = appointments.filter(apt => apt.id !== id);
            localStorage.setItem('appointments', JSON.stringify(filteredAppointments));

            // Notificar cambios
            this.notifyChange('appointment', 'delete', { id });

            console.log('✅ Cita eliminada exitosamente');
            return true;

        } catch (error) {
            console.error('❌ Error eliminando cita:', error);
            throw error;
        }
    }

    /**
     * Obtener todos los pacientes
     */
    async getPatients() {
        try {
            if (this.isConnected) {
                // En producción: const result = await this.connection.query(SQL_CONFIG.queries.getAllPatients);
                
                // Simulación de datos desde SQL Server
                const patients = JSON.parse(localStorage.getItem('patients')) || this.getSamplePatients();
                return patients;
            } else {
                return JSON.parse(localStorage.getItem('patients')) || [];
            }
        } catch (error) {
            console.error('❌ Error obteniendo pacientes:', error);
            return [];
        }
    }

    /**
     * Sincronizar con SQL Server
     */
    async syncWithServer() {
        try {
            console.log('🔄 Sincronizando con SQL Server...');
            
            if (!this.isConnected) {
                await this.connect();
            }

            this.lastSyncTime = new Date();
            
            // Obtener datos recientes desde el servidor
            const serverAppointments = await this.getAppointments();
            const serverPatients = await this.getPatients();
            
            // Actualizar localStorage con datos del servidor
            localStorage.setItem('appointments', JSON.stringify(serverAppointments));
            localStorage.setItem('patients', JSON.stringify(serverPatients));
            localStorage.setItem('lastSyncTime', this.lastSyncTime.toISOString());
            
            // Actualizar cache
            this.cache.set('appointments', serverAppointments);
            this.cache.set('patients', serverPatients);
            
            console.log('✅ Sincronización completada');
            
        } catch (error) {
            console.error('❌ Error en sincronización:', error);
        }
    }

    /**
     * Notificar cambios a otros componentes
     */
    notifyChange(type, action, data) {
        const event = new CustomEvent('databaseChange', {
            detail: { type, action, data, timestamp: new Date().toISOString() }
        });
        document.dispatchEvent(event);
    }

    /**
     * Generar ID único
     */
    generateId() {
        return 'apt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Obtener datos de ejemplo
     */
    getSampleAppointments() {
        return [
            {
                id: 'apt_001',
                patientId: 'pat_001',
                date: '2025-11-16',
                time: '09:00',
                duration: 60,
                treatment: 'Limpieza dental',
                status: 'Programada',
                patientName: 'María García López',
                phone: '666123456',
                notes: 'Primera cita'
            },
            {
                id: 'apt_002',
                patientId: 'pat_002',
                date: '2025-11-16',
                time: '10:30',
                duration: 45,
                treatment: 'Revisión',
                status: 'Confirmada',
                patientName: 'Juan Pérez Martín',
                phone: '666789123',
                notes: 'Control anual'
            }
        ];
    }

    getSamplePatients() {
        return [
            {
                id: 'pat_001',
                firstName: 'María',
                lastName: 'García López',
                phone: '666123456',
                email: 'maria.garcia@email.com',
                dateOfBirth: '1985-03-15'
            },
            {
                id: 'pat_002',
                firstName: 'Juan',
                lastName: 'Pérez Martín',
                phone: '666789123',
                email: 'juan.perez@email.com',
                dateOfBirth: '1978-11-22'
            }
        ];
    }

    /**
     * Iniciar sincronización automática
     */
    startSync() {
        // Sincronización inicial
        this.syncWithServer();
        
        // Configurar intervalo de sincronización
        this.syncInterval = setInterval(() => {
            this.syncWithServer();
        }, LOCAL_SYNC.syncInterval);
    }

    /**
     * Detener sincronización
     */
    stopSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    /**
     * Obtener estado de conexión
     */
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            lastSyncTime: this.lastSyncTime,
            cacheSize: this.cache.size
        };
    }
}

// Inicializar Database Manager cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    window.dbManager = new DatabaseManager();
});

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseManager;
}