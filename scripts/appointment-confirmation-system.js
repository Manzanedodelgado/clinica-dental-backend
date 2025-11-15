// Sistema de Confirmación de Citas Automático
// Envío 24h antes con respuestas diferenciadas

class AppointmentConfirmationSystem {
    constructor() {
        this.config = {
            confirmationLeadTime: 24, // horas antes de la cita
            checkInterval: 60000, // revisar cada minuto
            responseDelay: 2000, // retraso para respuesta automática
            maxRetries: 3
        };
        this.activeConfirmations = new Map();
        this.confirmationQueue = [];
        this.isRunning = false;
        
        this.init();
    }

    init() {
        this.loadConfig();
        this.setupEventListeners();
        this.startAutomaticMonitoring();
        console.log('✅ Sistema de confirmación de citas iniciado');
    }

    /**
     * Configuración inicial
     */
    loadConfig() {
        // Configuración específica del sistema de confirmación
        this.responses = {
            confirmation: {
                message: 'Muchas gracias por ayudarnos a mejorar nuestra atención!',
                color: 'success'
            },
            cancellation: {
                message: 'Desea que le demos una nueva cita',
                color: 'warning',
                action: 'offer_reschedule'
            },
            confirmationButtons: [
                {
                    id: 'confirm_yes',
                    text: 'Confirmar',
                    value: 'confirm',
                    class: 'btn-success'
                },
                {
                    id: 'confirm_no', 
                    text: 'Cancelar',
                    value: 'cancel',
                    class: 'btn-danger'
                }
            ]
        };
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Escuchar eventos del calendario
        document.addEventListener('appointmentCreated', (e) => {
            this.scheduleConfirmationMessage(e.detail.appointment);
        });

        document.addEventListener('appointmentUpdated', (e) => {
            this.updateScheduledConfirmation(e.detail.appointment);
        });
    }

    /**
     * Iniciar monitoreo automático
     */
    startAutomaticMonitoring() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        
        // Verificar cada minuto si hay citas que requieren mensaje de confirmación
        setInterval(() => {
            this.checkAppointmentsForConfirmation();
        }, this.config.checkInterval);
        
        console.log('🔄 Monitoreo automático de confirmaciones iniciado');
    }

    /**
     * Verificar citas que necesitan mensaje de confirmación (24h antes)
     */
    async checkAppointmentsForConfirmation() {
        try {
            // Obtener citas del día siguiente (24h antes)
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateString = tomorrow.toISOString().split('T')[0];

            if (window.dbManager) {
                const appointments = await window.dbManager.getAppointmentsByDate(dateString);
                await this.processAppointmentsForConfirmation(appointments);
            } else if (window.calendarManager) {
                const appointments = window.calendarManager.appointments.filter(apt => {
                    const aptDate = new Date(apt.date).toISOString().split('T')[0];
                    return aptDate === dateString;
                });
                await this.processAppointmentsForConfirmation(appointments);
            }
        } catch (error) {
            console.error('❌ Error verificando citas para confirmación:', error);
        }
    }

    /**
     * Procesar citas para enviar mensajes de confirmación
     */
    async processAppointmentsForConfirmation(appointments) {
        for (const appointment of appointments) {
            const confirmationKey = `${appointment.id}_${appointment.date}`;
            
            // Solo enviar si no se ha enviado ya
            if (!this.activeConfirmations.has(confirmationKey) && 
                appointment.status === 'Programada') {
                await this.scheduleConfirmationMessage(appointment);
            }
        }
    }

    /**
     * Programar mensaje de confirmación para una cita específica
     */
    async scheduleConfirmationMessage(appointment) {
        const confirmationKey = `${appointment.id}_${appointment.date}`;
        
        const confirmationData = {
            appointmentId: appointment.id,
            patientName: appointment.patientName,
            patientPhone: appointment.patientPhone,
            appointmentDate: appointment.date,
            appointmentTime: appointment.time,
            service: appointment.service,
            status: 'pending',
            scheduledAt: new Date().toISOString(),
            confirmationType: 'automatic_24h'
        };

        // Guardar en el mapa de confirmaciones activas
        this.activeConfirmations.set(confirmationKey, confirmationData);
        
        // Agregar a la cola de procesamiento
        this.confirmationQueue.push(confirmationData);
        
        // Simular envío del mensaje (en producción sería WhatsApp API)
        setTimeout(() => {
            this.sendConfirmationMessage(confirmationData);
        }, 1000);
        
        console.log(`📅 Mensaje de confirmación programado para ${appointment.patientName} - ${appointment.date} ${appointment.time}`);
    }

    /**
     * Enviar mensaje de confirmación con botones
     */
    sendConfirmationMessage(confirmationData) {
        const messageData = {
            to: confirmationData.patientPhone,
            message: this.generateConfirmationMessage(confirmationData),
            buttons: this.responses.confirmationButtons,
            appointmentId: confirmationData.appointmentId,
            scheduledAt: new Date().toISOString()
        };

        // En producción, aquí se enviaría por WhatsApp Business API
        this.logConfirmationActivity('confirmation_message_sent', messageData);
        
        // Mostrar en la interfaz de demostración
        this.displayConfirmationMessage(messageData);
        
        console.log(`📱 Mensaje de confirmación enviado a ${confirmationData.patientName} (${confirmationData.patientPhone})`);
    }

    /**
     * Generar mensaje de confirmación personalizado
     */
    generateConfirmationMessage(confirmationData) {
        const date = new Date(confirmationData.appointmentDate);
        const formattedDate = date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric', 
            month: 'long',
            day: 'numeric'
        });
        
        const time = confirmationData.appointmentTime;
        const service = confirmationData.service || 'consulta dental';

        return `Hola ${confirmationData.patientName},

Su cita de ${service} está programada para:
📅 ${formattedDate}
🕐 ${time}

¿Podría confirmar su asistencia? 

Por favor seleccione una opción:`;
    }

    /**
     * Mostrar mensaje de confirmación en la interfaz
     */
    displayConfirmationMessage(messageData) {
        const container = document.getElementById('confirmationMessages');
        if (!container) return;

        const messageElement = document.createElement('div');
        messageElement.className = 'confirmation-message';
        messageElement.innerHTML = `
            <div class="message-header">
                <h4>📱 Mensaje de Confirmación Enviado</h4>
                <span class="message-time">${new Date().toLocaleTimeString()}</span>
            </div>
            <div class="message-content">
                <p><strong>Para:</strong> ${messageData.to}</p>
                <div class="message-text">
                    ${messageData.message.replace(/\n/g, '<br>')}
                </div>
                <div class="confirmation-buttons">
                    <button class="btn btn-success" onclick="window.confirmationSystem.handleButtonResponse('${messageData.appointmentId}', 'confirm', '${messageData.to}')">
                        ✅ Confirmar
                    </button>
                    <button class="btn btn-danger" onclick="window.confirmationSystem.handleButtonResponse('${messageData.appointmentId}', 'cancel', '${messageData.to}')">
                        ❌ Cancelar
                    </button>
                </div>
            </div>
            <div class="message-status">⏳ Esperando respuesta...</div>
        `;
        
        container.appendChild(messageElement);
        container.scrollTop = container.scrollHeight;
    }

    /**
     * Manejar respuesta del botón (confirmar/cancelar)
     */
    async handleButtonResponse(appointmentId, response, patientPhone) {
        console.log(`🔘 Respuesta recibida: ${response} para cita ${appointmentId}`);
        
        try {
            // Actualizar el estado del mensaje
            await this.processPatientResponse({
                appointmentId,
                response,
                patientPhone,
                timestamp: new Date().toISOString()
            });
            
            // Enviar respuesta automática diferenciada
            await this.sendDifferentiatedResponse(response, patientPhone, appointmentId);
            
        } catch (error) {
            console.error('❌ Error procesando respuesta del botón:', error);
        }
    }

    /**
     * Enviar respuesta diferenciada según la acción
     */
    async sendDifferentiatedResponse(response, patientPhone, appointmentId) {
        let responseMessage;
        
        if (response === 'confirm') {
            responseMessage = this.responses.confirmation.message;
            
            // Confirmar cita en el sistema
            await this.confirmAppointment(appointmentId);
            
        } else if (response === 'cancel') {
            responseMessage = this.responses.cancellation.message;
            
            // Cancelar cita en el sistema
            await this.cancelAppointment(appointmentId);
            
            // Ofrecer reprogramación
            setTimeout(() => {
                this.offerRescheduleOptions(patientPhone, appointmentId);
            }, 3000);
        }

        // Simular envío de respuesta
        console.log(`📤 Respuesta automática para ${patientPhone}: ${responseMessage}`);
        
        // Actualizar interfaz
        this.updateMessageStatus(appointmentId, response, responseMessage);
    }

    /**
     * Ofrecer opciones de reprogramación
     */
    offerRescheduleOptions(patientPhone, originalAppointmentId) {
        const rescheduleMessage = `Para reprogramar su cita, puede:

1️⃣ Llamarnos al 912 345 678
2️⃣ Escribirnos con fechas disponibles
3️⃣ Usar nuestra aplicación web

Le agradecemos su comprensión.`;

        console.log(`📋 Opciones de reprogramación enviadas a ${patientPhone}`);
        
        // En producción, enviar por WhatsApp
        this.logConfirmationActivity('reschedule_offer_sent', {
            patientPhone,
            originalAppointmentId,
            message: rescheduleMessage
        });
    }

    /**
     * Confirmar cita en el sistema
     */
    async confirmAppointment(appointmentId) {
        console.log('✅ Confirmando cita:', appointmentId);
        
        try {
            if (window.dbManager) {
                await window.dbManager.updateAppointment(appointmentId, {
                    status: 'Confirmada'
                });
            }
            
            if (window.calendarManager) {
                await window.calendarManager.loadAppointments();
                window.calendarManager.renderCalendar();
            }
            
            // Marcar confirmación como completada
            this.markConfirmationCompleted(appointmentId, 'confirmed');
            
            this.logConfirmationActivity('appointment_confirmed', {
                appointmentId,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Error confirmando cita:', error);
            throw error;
        }
    }

    /**
     * Cancelar cita en el sistema
     */
    async cancelAppointment(appointmentId) {
        console.log('❌ Cancelando cita:', appointmentId);
        
        try {
            if (window.dbManager) {
                await window.dbManager.updateAppointment(appointmentId, {
                    status: 'Cancelada'
                });
            }
            
            if (window.calendarManager) {
                await window.calendarManager.loadAppointments();
                window.calendarManager.renderCalendar();
            }
            
            // Marcar confirmación como cancelada
            this.markConfirmationCompleted(appointmentId, 'cancelled');
            
            this.logConfirmationActivity('appointment_cancelled', {
                appointmentId,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Error cancelando cita:', error);
            throw error;
        }
    }

    /**
     * Marcar confirmación como completada
     */
    markConfirmationCompleted(appointmentId, status) {
        for (const [key, confirmation] of this.activeConfirmations) {
            if (confirmation.appointmentId === appointmentId) {
                confirmation.status = status;
                confirmation.completedAt = new Date().toISOString();
                this.activeConfirmations.set(key, confirmation);
                break;
            }
        }
    }

    /**
     * Actualizar estado del mensaje en la interfaz
     */
    updateMessageStatus(appointmentId, response, message) {
        const messages = document.querySelectorAll('.confirmation-message');
        
        messages.forEach(msgElement => {
            const appointmentIdInElement = msgElement.querySelector('[data-appointment-id]')?.dataset.appointmentId;
            if (appointmentIdInElement === appointmentId) {
                const statusElement = msgElement.querySelector('.message-status');
                const responseElement = msgElement.querySelector('.message-response');
                
                if (statusElement) {
                    const statusText = response === 'confirm' ? '✅ Confirmada' : '❌ Cancelada';
                    statusElement.textContent = statusText;
                    statusElement.className = `message-status ${response === 'confirm' ? 'status-confirmed' : 'status-cancelled'}`;
                }
                
                if (responseElement) {
                    responseElement.innerHTML = `<strong>Respuesta automática:</strong> ${message}`;
                    responseElement.style.display = 'block';
                }
            }
        });
    }

    /**
     * Procesar respuesta del paciente
     */
    async processPatientResponse(responseData) {
        const { appointmentId, response, patientPhone } = responseData;
        
        // Actualizar base de datos según la respuesta
        if (response === 'confirm') {
            await this.confirmAppointment(appointmentId);
        } else if (response === 'cancel') {
            await this.cancelAppointment(appointmentId);
        }
        
        // Log de la actividad
        this.logConfirmationActivity('patient_response_processed', responseData);
    }

    /**
     * Registrar actividad del sistema de confirmación
     */
    logConfirmationActivity(action, data) {
        const activity = {
            timestamp: new Date().toISOString(),
            action,
            data,
            system: 'appointment_confirmation'
        };
        
        console.log(`📊 [Confirmación] ${action}:`, data);
        
        // Guardar en localStorage para persistencia
        const activities = JSON.parse(localStorage.getItem('confirmationActivities') || '[]');
        activities.push(activity);
        
        // Mantener solo las últimas 1000 actividades
        if (activities.length > 1000) {
            activities.splice(0, activities.length - 1000);
        }
        
        localStorage.setItem('confirmationActivities', JSON.stringify(activities));
    }

    /**
     * Obtener estadísticas del sistema de confirmación
     */
    getConfirmationStats() {
        const activities = JSON.parse(localStorage.getItem('confirmationActivities') || '[]');
        
        const stats = {
            totalMessagesSent: activities.filter(a => a.action === 'confirmation_message_sent').length,
            confirmed: activities.filter(a => a.action === 'appointment_confirmed').length,
            cancelled: activities.filter(a => a.action === 'appointment_cancelled').length,
            reschedulesOffered: activities.filter(a => a.action === 'reschedule_offer_sent').length,
            activeConfirmations: this.activeConfirmations.size
        };
        
        return stats;
    }

    /**
     * Forzar envío de mensaje de confirmación para testing
     */
    async testConfirmationMessage(appointmentData) {
        console.log('🧪 Enviando mensaje de prueba...');
        
        const testConfirmation = {
            appointmentId: appointmentData.id || 'test_001',
            patientName: appointmentData.patientName || 'Paciente de Prueba',
            patientPhone: appointmentData.patientPhone || '666123456',
            appointmentDate: appointmentData.date || new Date().toISOString().split('T')[0],
            appointmentTime: appointmentData.time || '10:00',
            service: appointmentData.service || 'consulta general'
        };
        
        await this.scheduleConfirmationMessage(testConfirmation);
        
        // Mostrar estadísticas
        setTimeout(() => {
            const stats = this.getConfirmationStats();
            console.log('📊 Estadísticas de confirmación:', stats);
        }, 2000);
    }

    /**
     * Limpiar confirmaciones completadas
     */
    cleanupCompletedConfirmations() {
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - 48); // Mantener por 48h
        
        for (const [key, confirmation] of this.activeConfirmations) {
            if (confirmation.completedAt && new Date(confirmation.completedAt) < cutoffTime) {
                this.activeConfirmations.delete(key);
            }
        }
    }

    /**
     * Detener el sistema (para mantenimiento)
     */
    stop() {
        this.isRunning = false;
        console.log('⏹️ Sistema de confirmación de citas detenido');
    }
}

// Inicializar sistema cuando se cargue la página
document.addEventListener('DOMContentLoaded', () => {
    window.confirmationSystem = new AppointmentConfirmationSystem();
    
    // Exponer función de prueba globalmente
    window.testAppointmentConfirmation = () => {
        window.confirmationSystem.testConfirmationMessage({
            patientName: 'Juan Pérez',
            date: new Date().toISOString().split('T')[0],
            time: '15:30',
            service: 'limpieza dental'
        });
    };
});

console.log('📋 Sistema de Confirmación de Citas cargado');