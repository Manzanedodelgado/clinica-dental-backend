// AI Agent Management System
class AIAgentManager {
    constructor() {
        this.isActive = true;
        this.behavior = {
            responseStyle: 'professional',
            communicationTone: 'calm',
            language: 'es',
            autoResponse: true,
            escalationEnabled: true
        };
        this.automations = [];
        this.activityLog = [];
        this.statistics = {
            messagesProcessed: 0,
            autoResponses: 0,
            appointmentsScheduled: 0,
            documentsSent: 0,
            averageResponseTime: 0
        };
        
        this.init();
    }

    init() {
        this.loadMockData();
        this.setupEventListeners();
        this.renderActivityLog();
        this.renderAutomations();
        this.startMonitoring();
    }

    setupEventListeners() {
        // AI Status toggle
        const aiStatus = document.getElementById('aiStatus');
        if (aiStatus) {
            aiStatus.addEventListener('click', () => this.toggleStatus());
        }

        // Behavior configuration
        const responseStyle = document.getElementById('aiResponseStyle');
        const communicationTone = document.getElementById('aiCommunicationTone');
        
        if (responseStyle) {
            responseStyle.addEventListener('change', (e) => {
                this.behavior.responseStyle = e.target.value;
                this.updateBehavior();
            });
        }
        
        if (communicationTone) {
            communicationTone.addEventListener('change', (e) => {
                this.behavior.communicationTone = e.target.value;
                this.updateBehavior();
            });
        }

        // Automation toggles
        document.addEventListener('click', (e) => {
            if (e.target.matches('.automation-toggle')) {
                const automationId = parseInt(e.target.dataset.automationId);
                this.toggleAutomation(automationId);
            }
        });

        // Add automation button
        const addAutomationBtn = document.getElementById('addAutomationBtn');
        if (addAutomationBtn) {
            addAutomationBtn.addEventListener('click', () => this.showNewAutomationModal());
        }
    }

    loadMockData() {
        this.automations = [
            {
                id: 1,
                name: 'Recordatorios de Citas',
                description: 'Envía recordatorios automáticos 24h antes de las citas',
                isActive: true,
                type: 'appointment_reminder',
                schedule: 'daily',
                lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
                nextRun: new Date(Date.now() + 22 * 60 * 60 * 1000),
                success: true,
                stats: { sent: 15, failed: 0 }
            },
            {
                id: 2,
                name: 'Respuestas de Urgencias',
                description: 'Responde automáticamente mensajes con palabras clave de urgencia',
                isActive: true,
                type: 'urgent_response',
                schedule: 'instant',
                lastRun: new Date(Date.now() - 15 * 60 * 1000),
                nextRun: new Date(),
                success: true,
                stats: { sent: 8, failed: 1 }
            },
            {
                id: 3,
                name: 'Envío de Consentimientos',
                description: 'Envía consentimientos informados 2h antes de procedimientos',
                isActive: true,
                type: 'consent_form',
                schedule: 'scheduled',
                lastRun: new Date(Date.now() - 4 * 60 * 60 * 1000),
                nextRun: new Date(Date.now() + 8 * 60 * 60 * 1000),
                success: true,
                stats: { sent: 5, failed: 0 }
            },
            {
                id: 4,
                name: 'Cuestionario Post-Tratamiento',
                description: 'Envía cuestionarios de satisfacción después de tratamientos',
                isActive: false,
                type: 'satisfaction_survey',
                schedule: 'delayed',
                lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000),
                nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000),
                success: true,
                stats: { sent: 12, failed: 2 }
            },
            {
                id: 5,
                name: 'Seguimiento Post-Implante',
                description: 'Realiza seguimiento automático después de implantes',
                isActive: true,
                type: 'implant_followup',
                schedule: 'weekly',
                lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                success: true,
                stats: { sent: 3, failed: 0 }
            }
        ];

        this.activityLog = [
            {
                id: 1,
                timestamp: new Date(Date.now() - 5 * 60 * 1000),
                action: 'auto_response',
                description: 'Respuesta automática enviada a María García sobre dolor de muela',
                result: 'success',
                patient: 'María García'
            },
            {
                id: 2,
                timestamp: new Date(Date.now() - 15 * 60 * 1000),
                action: 'reminder_sent',
                description: 'Recordatorio de cita enviado a 12 pacientes',
                result: 'success',
                patient: 'Múltiples'
            },
            {
                id: 3,
                timestamp: new Date(Date.now() - 30 * 60 * 1000),
                action: 'document_sent',
                description: 'Consentimiento informado enviado a Pedro Santos',
                result: 'success',
                patient: 'Pedro Santos'
            },
            {
                id: 4,
                timestamp: new Date(Date.now() - 45 * 60 * 1000),
                action: 'escalation',
                description: 'Caso urgente escalado al doctor - Ana López',
                result: 'escalated',
                patient: 'Ana López'
            },
            {
                id: 5,
                timestamp: new Date(Date.now() - 60 * 60 * 1000),
                action: 'auto_response',
                description: 'Respuesta automática sobre horarios de atención',
                result: 'success',
                patient: 'Carlos Ruiz'
            },
            {
                id: 6,
                timestamp: new Date(Date.now() - 90 * 60 * 1000),
                action: 'survey_sent',
                description: 'Cuestionario de satisfacción enviado a 5 pacientes',
                result: 'success',
                patient: 'Múltiples'
            }
        ];
    }

    toggleStatus() {
        this.isActive = !this.isActive;
        
        const statusElement = document.getElementById('aiStatus');
        if (statusElement) {
            const indicator = statusElement.querySelector('.status-indicator');
            const text = statusElement.querySelector('span:last-child');
            
            if (this.isActive) {
                indicator.classList.add('active');
                text.textContent = 'IA Activa';
                statusElement.style.background = 'rgba(25, 135, 84, 0.1)';
                statusElement.style.color = '#198754';
            } else {
                indicator.classList.remove('active');
                text.textContent = 'IA Inactiva';
                statusElement.style.background = 'rgba(220, 53, 69, 0.1)';
                statusElement.style.color = '#DC3545';
            }
        }

        this.logActivity('status_change', this.isActive ? 'IA activada' : 'IA desactivada');
    }

    updateBehavior() {
        this.logActivity('behavior_update', `Estilo actualizado: ${this.behavior.responseStyle}, Tono: ${this.behavior.communicationTone}`);
        
        // Simulate configuration save
        setTimeout(() => {
            if (window.dentalApp) {
                window.dentalApp.showNotification('Configuración de IA actualizada', 'success');
            }
        }, 1000);
    }

    toggleAutomation(automationId) {
        const automation = this.automations.find(a => a.id === automationId);
        if (automation) {
            automation.isActive = !automation.isActive;
            this.renderAutomations();
            this.logActivity('automation_toggle', `${automation.isActive ? 'Activado' : 'Desactivado'}: ${automation.name}`);
        }
    }

    renderActivityLog() {
        const container = document.getElementById('aiActivityLog');
        if (!container) return;

        const recentActivities = this.activityLog.slice(0, 10);

        container.innerHTML = recentActivities.map(activity => `
            <div class="activity-item">
                <div class="activity-time">${this.formatActivityTime(activity.timestamp)}</div>
                <div class="activity-description">
                    <strong>${this.getActionLabel(activity.action)}</strong>
                    ${activity.description}
                    ${activity.patient ? `<br><em>Paciente: ${activity.patient}</em>` : ''}
                </div>
                <div class="activity-result ${activity.result}">
                    ${this.getResultLabel(activity.result)}
                </div>
            </div>
        `).join('');
    }

    renderAutomations() {
        const container = document.getElementById('activeAutomations');
        if (!container) return;

        container.innerHTML = this.automations.map(automation => `
            <div class="automation-item">
                <div class="automation-info">
                    <div class="automation-name">${automation.name}</div>
                    <div class="automation-desc">${automation.description}</div>
                    <div class="automation-schedule">
                        <small>Última ejecución: ${this.formatActivityTime(automation.lastRun)}</small>
                        ${automation.isActive ? `<br><small>Próxima ejecución: ${this.formatActivityTime(automation.nextRun)}</small>` : ''}
                    </div>
                </div>
                <div class="automation-controls">
                    <div class="automation-status">
                        <span class="automation-status-badge ${automation.isActive ? 'active' : 'inactive'}">
                            ${automation.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                    </div>
                    <div class="automation-stats">
                        <small>Enviados: ${automation.stats.sent}</small>
                        ${automation.stats.failed > 0 ? `<br><small style="color: var(--danger);">Fallidos: ${automation.stats.failed}</small>` : ''}
                    </div>
                    <div class="automation-actions">
                        <button class="btn btn-sm ${automation.isActive ? 'btn-outline' : 'btn-primary'} automation-toggle" 
                                data-automation-id="${automation.id}">
                            ${automation.isActive ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="aiAgent.editAutomation(${automation.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="aiAgent.testAutomation(${automation.id})">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    startMonitoring() {
        // Simulate continuous monitoring
        setInterval(() => {
            if (this.isActive) {
                this.processMessages();
                this.checkScheduledAutomations();
                this.updateStatistics();
            }
        }, 30000); // Every 30 seconds
    }

    processMessages() {
        // Simulate message processing
        const newActivity = {
            id: this.activityLog.length + 1,
            timestamp: new Date(),
            action: 'monitoring_check',
            description: 'Verificación automática de mensajes y citas',
            result: 'success',
            patient: null
        };

        this.activityLog.unshift(newActivity);
        this.renderActivityLog();
        
        // Keep only last 50 activities
        if (this.activityLog.length > 50) {
            this.activityLog = this.activityLog.slice(0, 50);
        }
    }

    checkScheduledAutomations() {
        const now = new Date();
        
        this.automations.forEach(automation => {
            if (automation.isActive && now >= automation.nextRun) {
                this.executeAutomation(automation);
            }
        });
    }

    executeAutomation(automation) {
        let result, description;
        
        switch (automation.type) {
            case 'appointment_reminder':
                result = this.sendAppointmentReminders();
                description = `Recordatorios de citas enviados (${result.count} mensajes)`;
                break;
                
            case 'urgent_response':
                result = this.handleUrgentResponses();
                description = `Respuestas de urgencia procesadas (${result.count} casos)`;
                break;
                
            case 'consent_form':
                result = this.sendConsentForms();
                description = `Consentimientos informados enviados (${result.count} documentos)`;
                break;
                
            case 'satisfaction_survey':
                result = this.sendSatisfactionSurveys();
                description = `Cuestionarios de satisfacción enviados (${result.count} encuestas)`;
                break;
                
            case 'implant_followup':
                result = this.sendImplantFollowUps();
                description = `Seguimientos de implantes enviados (${result.count} mensajes)`;
                break;
                
            default:
                result = { success: true, count: 0 };
                description = 'Automatización ejecutada';
        }

        // Update automation stats
        automation.lastRun = new Date();
        if (automation.schedule === 'instant') {
            automation.nextRun = new Date();
        } else if (automation.schedule === 'daily') {
            automation.nextRun = new Date(Date.now() + 24 * 60 * 60 * 1000);
        } else if (automation.schedule === 'weekly') {
            automation.nextRun = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        } else {
            automation.nextRun = new Date(Date.now() + 24 * 60 * 60 * 1000);
        }

        if (result.success) {
            automation.stats.sent += result.count;
        } else {
            automation.stats.failed += result.count;
        }

        // Log activity
        this.logActivity('automation_executed', description, result.success ? 'success' : 'failed');

        // Update display
        this.renderAutomations();
    }

    sendAppointmentReminders() {
        // Simulate sending appointment reminders
        const mockPatients = ['María García', 'Carlos Ruiz', 'Ana López'];
        const count = Math.floor(Math.random() * 5) + 1;
        
        return { success: true, count: count };
    }

    handleUrgentResponses() {
        // Simulate handling urgent messages
        const count = Math.floor(Math.random() * 3);
        return { success: true, count: count };
    }

    sendConsentForms() {
        // Simulate sending consent forms
        const count = Math.floor(Math.random() * 3) + 1;
        return { success: true, count: count };
    }

    sendSatisfactionSurveys() {
        // Simulate sending satisfaction surveys
        const count = Math.floor(Math.random() * 5) + 1;
        return { success: true, count: count };
    }

    sendImplantFollowUps() {
        // Simulate sending implant follow-up messages
        const count = Math.floor(Math.random() * 2) + 1;
        return { success: true, count: count };
    }

    generateAIResponse(message, patientName) {
        const responseTemplates = {
            professional: {
                calm: [
                    `Hola ${patientName}, gracias por contactarnos. Hemos recibido su mensaje y le responderemos pronto.`,
                    `${patientName}, su consulta es importante para nosotros. Le contactaremos en breve.`,
                    `Estimado/a ${patientName}, hemos registrado su mensaje y nos pondremos en contacto con usted.`
                ],
                enthusiastic: [
                    `¡Hola ${patientName}! Nos alegra que nos contacte. Responderemos a su consulta lo antes posible.`,
                    `${patientName}, ¡excelente! Le atendemos inmediatamente.`,
                    `¡Perfecto ${patientName}! Su mensaje ha sido recibido y le respondemos ahora mismo.`
                ],
                empathetic: [
                    `${patientName}, entendemos su preocupación. Estamos aquí para ayudarle.`,
                    `Hola ${patientName}, sabemos lo importante que es resolver su consulta. Le atenderemos pronto.`,
                    `${patientName}, gracias por confiar en nosotros. Le ayudaremos con su consulta.`
                ]
            },
            friendly: {
                calm: [
                    `¡Hola ${patientName}! 😊 Gracias por escribirnos. Te respondemos en un momento.`,
                    `${patientName}, ¡qué tal! 👋 Hemos visto tu mensaje y te escribimos pronto.`,
                    `¡Hola ${patientName}! ✨ Tu mensaje llegó bien, te escribo enseguida.`
                ],
                enthusiastic: [
                    `¡Hey ${patientName}! 🚀 ¡Genial que nos escribas! Te respondo ya mismo.`,
                    `${patientName}, ¡qué ilusión! 😊 Te atiendo ahora mismo.`,
                    `¡Hola ${patientName}! 💫 ¡Perfecto! Te respondo en un pis pas.`
                ],
                empathetic: [
                    `${patientName}, gracias por escribirnos. 😊 Entendemos tu situación y te ayudamos.`,
                    `¡Hola ${patientName}! 🤗 Sabemos lo importante que es tu consulta.`,
                    `${patientName}, estamos aquí para lo que necesites. 😊 Te escribimos pronto.`
                ]
            },
            formal: {
                calm: [
                    `Estimado/a ${patientName}, hemos recibido su consulta. Le responderemos a la mayor brevedad.`,
                    `${patientName}, su mensaje ha sido registrado. Nos pondremos en contacto con usted prontamente.`,
                    `Sr./Sra. ${patientName}, agradecemos su contacto. Le responderemos con la mayor brevedad posible.`
                ],
                enthusiastic: [
                    `${patientName}, nos complace atender su consulta. Le responderemos con la mayor prontitud.`,
                    `Estimado/a ${patientName}, hemos recibido su mensaje y le atenderemos inmediatamente.`,
                    `${patientName}, estamos encantados de poder ayudarle. Responderemos a la mayor brevedad.`
                ],
                empathetic: [
                    `${patientName}, comprendemos la importancia de su consulta. Le atenderemos con la máxima prioridad.`,
                    `Estimado/a ${patientName}, sabemos lo crucial que es resolver su consulta. Le atenderemos pronto.`,
                    `${patientName}, valoramos su confianza en nosotros. Le responderemos lo antes posible.`
                ]
            }
        };

        const styleTemplates = responseTemplates[this.behavior.responseStyle] || responseTemplates.professional;
        const toneTemplates = styleTemplates[this.behavior.communicationTone] || styleTemplates.calm;
        
        return toneTemplates[Math.floor(Math.random() * toneTemplates.length)];
    }

    logActivity(action, description, result = 'success', patient = null) {
        const activity = {
            id: this.activityLog.length + 1,
            timestamp: new Date(),
            action: action,
            description: description,
            result: result,
            patient: patient
        };

        this.activityLog.unshift(activity);
        
        // Update display if on AI section
        if (window.dentalApp && window.dentalApp.currentSection === 'agente-ia') {
            this.renderActivityLog();
        }

        // Keep only last 100 activities
        if (this.activityLog.length > 100) {
            this.activityLog = this.activityLog.slice(0, 100);
        }
    }

    updateStatistics() {
        this.statistics.messagesProcessed++;
        this.statistics.autoResponses = this.automations.reduce((total, automation) => 
            total + automation.stats.sent, 0);
        
        // Simulate average response time calculation
        this.statistics.averageResponseTime = Math.floor(Math.random() * 120) + 30; // 30-150 seconds
    }

    getActionLabel(action) {
        const labels = {
            'auto_response': '🤖 Respuesta Automática',
            'reminder_sent': '📅 Recordatorio Enviado',
            'document_sent': '📄 Documento Enviado',
            'escalation': '⚠️ Escalado',
            'survey_sent': '📋 Encuesta Enviada',
            'monitoring_check': '🔍 Verificación',
            'status_change': '🔄 Cambio de Estado',
            'behavior_update': '⚙️ Configuración',
            'automation_toggle': '🎛️ Automatización',
            'automation_executed': '⚡ Automatización Ejecutada'
        };
        return labels[action] || action;
    }

    getResultLabel(result) {
        const labels = {
            'success': '✅ Exitoso',
            'failed': '❌ Fallido',
            'escalated': '⚠️ Escalado'
        };
        return labels[result] || result;
    }

    formatActivityTime(timestamp) {
        const now = new Date();
        const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60));
        
        if (diffInMinutes < 1) {
            return 'Ahora';
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes}min`;
        } else if (diffInMinutes < 1440) {
            const hours = Math.floor(diffInMinutes / 60);
            return `${hours}h`;
        } else {
            const days = Math.floor(diffInMinutes / 1440);
            return `${days}d`;
        }
    }

    // Public methods for external use
    getBehaviorConfig() {
        return { ...this.behavior };
    }

    setBehaviorConfig(config) {
        this.behavior = { ...this.behavior, ...config };
        this.updateBehavior();
    }

    getActiveAutomations() {
        return this.automations.filter(a => a.isActive);
    }

    getActivitySummary(limit = 10) {
        return this.activityLog.slice(0, limit);
    }

    exportActivityLog() {
        const exportData = {
            activities: this.activityLog,
            automations: this.automations,
            statistics: this.statistics,
            behavior: this.behavior,
            exportDate: new Date().toISOString()
        };

        return JSON.stringify(exportData, null, 2);
    }

    testAutomation(automationId) {
        const automation = this.automations.find(a => a.id === automationId);
        if (!automation) return;

        this.logActivity('automation_test', `Prueba de automatización: ${automation.name}`);
        
        // Simulate test execution
        setTimeout(() => {
            if (window.dentalApp) {
                window.dentalApp.showNotification(`Automatización "${automation.name}" probada exitosamente`, 'success');
            }
        }, 1000);
    }

    editAutomation(automationId) {
        const automation = this.automations.find(a => a.id === automationId);
        if (!automation) return;

        // In a real app, this would open an edit modal
        alert(`Editar automatización: ${automation.name}\n\nEsta funcionalidad se implementaría con un modal de edición.`);
    }

    showNewAutomationModal() {
        // In a real app, this would show a modal to create new automation
        alert('Crear nueva automatización\n\nEsta funcionalidad se implementaría con un modal de creación.');
    }
}

// Initialize AI Agent when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.aiAgent = new AIAgentManager();
});