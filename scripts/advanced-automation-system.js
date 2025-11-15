// Sistema de Automatización Avanzado
// Flujos dinámicos, cuestionarios, documentos legales y cumplimiento LOPD

class AdvancedAutomationSystem {
    constructor() {
        this.config = {
            confirmationLeadTime: 24,
            checkInterval: 60000,
            responseDelay: 2000,
            maxRetries: 3,
            lopdCompliance: true,
            legalTracking: true
        };
        
        this.activeFlows = new Map();
        this.questionnaires = new Map();
        this.documentTracking = new Map();
        this.legalDocuments = new Map();
        this.isRunning = false;
        
        this.APP_STATES = {
            PLANIFICADA: 'Planificada',
            CONFIRMADA: 'Confirmada', 
            CANCELADA: 'Cancelada',
            ANULA: 'Anula',
            ACEPTADA: 'Aceptada' // Confirmada + Consentimiento aceptado
        };
        
        this.init();
    }

    init() {
        this.loadLegalDocuments();
        this.setupEventListeners();
        this.startAutomaticMonitoring();
        console.log('✅ Sistema de Automatización Avanzado iniciado');
    }

    /**
     * Cargar documentos legales LOPD
     */
    loadLegalDocuments() {
        this.legalDocuments.set('lopd_consent', {
            id: 'lopd_consent',
            name: 'Consentimiento LOPD',
            type: 'legal',
            content: `
                <h3>CONSENTIMIENTO INFORMADO - LEY DE PROTECCIÓN DE DATOS (LOPD)</h3>
                <p>En cumplimiento del Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica 3/2018 de Protección de Datos Personales y garantía de los derechos digitales (LOPD), le informamos:</p>
                
                <h4>1. RESPONSABLE DEL TRATAMIENTO</h4>
                <p>Rubio García Dental<br>
                Dirección: [Dirección de la clínica]<br>
                Teléfono: 912 345 678<br>
                Email: info@rubiogacialdental.com</p>
                
                <h4>2. FINALIDAD DEL TRATAMIENTO</h4>
                <p>Gestión de citas médicas, historial clínico, comunicación con pacientes y cumplimiento de obligaciones legales sanitarias.</p>
                
                <h4>3. LEGITIMACIÓN</h4>
                <p>Ejecución de contrato de servicios médicos, interés legítimo y cumplimiento de obligaciones legales.</p>
                
                <h4>4. DESTINATARIOS</h4>
                <p>No se cederán datos a terceros salvo obligación legal. Datos solo para Rubio García Dental.</p>
                
                <h4>5. DERECHOS</h4>
                <p>Puede ejercer derechos de acceso, rectificación, supresión, portabilidad y oposición contactando con nosotros.</p>
                
                <h4>6. PLAZO DE CONSERVACIÓN</h4>
                <p>Los datos se conservarán mientras sea necesario para la finalidad y posteriormente según obligaciones legales.</p>
                
                <p><strong>CONSINTO EL TRATAMIENTO DE MIS DATOS PERSONALES PARA LOS FINES DESCRITOS.</strong></p>
            `,
            mandatory: true,
            version: '1.0',
            date: '2025-11-16'
        });

        this.legalDocuments.set('informed_consent_treatment', {
            id: 'informed_consent_treatment',
            name: 'Consentimiento Informado - Tratamiento',
            type: 'medical',
            content: `
                <h3>CONSENTIMIENTO INFORMADO PARA TRATAMIENTO DENTAL</h3>
                
                <h4>INFORMACIÓN DEL TRATAMIENTO</h4>
                <p>He sido informado/a sobre la naturaleza y propósito del tratamiento propuesto, incluyendo:</p>
                <ul>
                    <li>Procedimiento a realizar</li>
                    <li>Alternativas disponibles</li>
                    <li>Riesgos y complicaciones posibles</li>
                    <li>Cuidados post-tratamiento</li>
                </ul>
                
                <h4>RESPONSABILIDADES DEL PACIENTE</h4>
                <ul>
                    <li>Informar sobre alergias y medicamentos</li>
                    <li>Seguir las indicaciones post-tratamiento</li>
                    <li>Asistir a las citas de seguimiento</li>
                    <li>Comunicar cualquier complicación</li>
                </ul>
                
                <h4>DECLARACIÓN</h4>
                <p>Comprendo la información proporcionada, he podido hacer preguntas y todas mis dudas han sido resueltas satisfactoriamente. Consiento la realización del tratamiento propuesto.</p>
                
                <p><strong>Firma: ______________________ Fecha: _______________</strong></p>
            `,
            mandatory: true,
            version: '1.0',
            date: '2025-11-16'
        });

        this.legalDocuments.set('first_visit_questionnaire', {
            id: 'first_visit_questionnaire',
            name: 'Cuestionario Primera Visita',
            type: 'medical_questionnaire',
            content: `
                <h3>Cuestionario para Primera Visita</h3>
                
                <h4>1. HISTORIAL MÉDICO</h4>
                <ul>
                    <li>¿Tiene alguna enfermedad crónica? (diabetes, hipertensión, etc.)</li>
                    <li>¿Toma algún medicamento actualmente?</li>
                    <li>¿Tiene alguna alergia conocida?</li>
                    <li>¿Ha tenido alguna cirugía reciente?</li>
                </ul>
                
                <h4>2. HISTORIAL DENTAL</h4>
                <ul>
                    <li>¿Cuándo fue su última visita dental?</li>
                    <li>¿Ha tenido problemas dentales anteriormente?</li>
                    <li>¿Usa prótesis dentales o implantes?</li>
                    <li>¿Tiene dolor o molestias actualmente?</li>
                </ul>
                
                <h4>3. HÁBITOS</h4>
                <ul>
                    <li>¿Con qué frecuencia cepilla sus dientes?</li>
                    <li>¿Usa hilo dental diariamente?</li>
                    <li>¿Fuma o consume alcohol?</li>
                    <li>¿Toma café o té en exceso?</li>
                </ul>
                
                <p><strong>He proporcionado información veraz y completa sobre mi historial médico y dental.</strong></p>
            `,
            mandatory: true,
            version: '1.0',
            date: '2025-11-16'
        });
    }

    /**
     * Crear flujo de automatización
     */
    createAutomationFlow(config) {
        const flowId = `flow_${Date.now()}`;
        
        const flow = {
            id: flowId,
            name: config.name || 'Flujo Automático',
            type: config.type, // 'confirmation', 'questionnaire', 'document', 'mixed'
            steps: config.steps || [],
            currentStep: 0,
            patientId: config.patientId,
            appointmentId: config.appointmentId,
            status: 'active',
            createdAt: new Date().toISOString(),
            responses: [],
            legalAccepted: false,
            lopdAccepted: false
        };

        this.activeFlows.set(flowId, flow);
        console.log('📋 Flujo de automatización creado:', flowId);
        
        return flowId;
    }

    /**
     * Enviar paso del flujo
     */
    async sendFlowStep(flowId, stepIndex = null) {
        const flow = this.activeFlows.get(flowId);
        if (!flow) return null;

        const stepIndexToUse = stepIndex !== null ? stepIndex : flow.currentStep;
        const step = flow.steps[stepIndexToUse];

        if (!step) {
            console.log('✅ Flujo completado:', flowId);
            return await this.completeFlow(flowId);
        }

        const messageData = {
            to: flow.patientId, // En producción: número de teléfono
            flowId: flowId,
            stepIndex: stepIndexToUse,
            message: step.message,
            attachments: step.attachments || [],
            buttons: step.buttons || [],
            questionnaire: step.questionnaire || null,
            document: step.document || null,
            requiresLegal: step.requiresLegal || false,
            state: this.determineAppointmentState(step, flow)
        };

        // Simular envío
        await this.sendAutomationMessage(messageData);
        
        // Mostrar en interfaz
        this.displayAutomationMessage(messageData);
        
        return messageData;
    }

    /**
     * Procesar respuesta del paciente
     */
    async processPatientResponse(flowId, responseData) {
        const flow = this.activeFlows.get(flowId);
        if (!flow) return null;

        const currentStep = flow.steps[flow.currentStep];
        
        // Registrar respuesta
        flow.responses.push({
            stepIndex: flow.currentStep,
            timestamp: new Date().toISOString(),
            response: responseData.response,
            selectedOptions: responseData.selectedOptions || [],
            freeText: responseData.freeText || ''
        });

        // Procesar según tipo de paso
        if (currentStep.type === 'single_choice') {
            await this.handleSingleChoiceResponse(flow, responseData);
        } else if (currentStep.type === 'multiple_choice') {
            await this.handleMultipleChoiceResponse(flow, responseData);
        } else if (currentStep.type === 'questionnaire') {
            await this.handleQuestionnaireResponse(flow, responseData);
        } else if (currentStep.type === 'document') {
            await this.handleDocumentResponse(flow, responseData);
        }

        // Actualizar estado de cita si es necesario
        await this.updateAppointmentState(flow, responseData);

        // Avanzar al siguiente paso
        flow.currentStep++;
        
        // Enviar siguiente paso o completar flujo
        if (flow.currentStep < flow.steps.length) {
            setTimeout(() => {
                this.sendFlowStep(flowId);
            }, 2000);
        } else {
            await this.completeFlow(flowId);
        }
    }

    /**
     * Manejar respuesta de selección única
     */
    async handleSingleChoiceResponse(flow, responseData) {
        const selectedOption = responseData.selectedOptions[0];
        
        // Determinar próximo paso basado en la respuesta
        const currentStep = flow.steps[flow.currentStep];
        const nextStep = currentStep.branches?.[selectedOption];
        
        if (nextStep) {
            // Insertar paso de ramificación
            flow.steps.splice(flow.currentStep + 1, 0, nextStep);
        }

        // Enviar respuesta automática
        const responseMessage = currentStep.responses?.[selectedOption] || 'Entendido';
        await this.sendAutomaticResponse(flow, responseMessage);
    }

    /**
     * Manejar respuesta de selección múltiple
     */
    async handleMultipleChoiceResponse(flow, responseData) {
        const selectedOptions = responseData.selectedOptions;
        const currentStep = flow.steps[flow.currentStep];
        
        // Procesar cada opción seleccionada
        for (const option of selectedOptions) {
            const branchStep = currentStep.branches?.[option];
            if (branchStep) {
                // Agregar pasos de ramificación después del actual
                flow.steps.splice(flow.currentStep + 1, 0, branchStep);
            }
        }

        // Enviar confirmación
        await this.sendAutomaticResponse(flow, `Gracias por seleccionar: ${selectedOptions.join(', ')}`);
    }

    /**
     * Manejar respuesta de cuestionario
     */
    async handleQuestionnaireResponse(flow, responseData) {
        const currentStep = flow.steps[flow.currentStep];
        
        // Guardar respuestas del cuestionario
        flow.questionnaireResponses = {
            ...flow.questionnaireResponses,
            ...responseData.responses
        };

        // Marcar cuestionario como completado
        this.documentTracking.set(`questionnaire_${flowId}`, {
            flowId: flowId,
            type: 'questionnaire',
            completedAt: new Date().toISOString(),
            responses: responseData.responses
        });

        // Enviar agradecimiento
        await this.sendAutomaticResponse(flow, 'Muchas gracias por completar el cuestionario. Sus respuestas han sido registradas.');
    }

    /**
     * Manejar respuesta de documento
     */
    async handleDocumentResponse(flow, responseData) {
        const currentStep = flow.steps[flow.currentStep];
        
        // Registrar envío/aceptación del documento
        this.documentTracking.set(`document_${flowId}`, {
            flowId: flowId,
            documentId: currentStep.documentId,
            sentAt: new Date().toISOString(),
            acknowledged: responseData.response === 'accept',
            legalValue: currentStep.requiresLegal
        });

        if (responseData.response === 'accept') {
            // Documento aceptado
            if (currentStep.documentId === 'informed_consent_treatment') {
                flow.legalAccepted = true;
            }
            if (currentStep.documentId === 'lopd_consent') {
                flow.lopdAccepted = true;
            }
            
            await this.sendAutomaticResponse(flow, 'Documento aceptado correctamente. Gracias por su confirmación.');
        } else {
            await this.sendAutomaticResponse(flow, 'Documento revisado. Continuamos con el proceso.');
        }
    }

    /**
     * Determinar estado de cita según el paso
     */
    determineAppointmentState(step, flow) {
        if (step.type === 'state_confirmation') {
            return step.targetState;
        }
        
        if (step.type === 'document' && step.documentId === 'informed_consent_treatment') {
            return this.APP_STATES.ACEPTADA; // Confirmada + Consentimiento aceptado
        }
        
        return null;
    }

    /**
     * Actualizar estado de cita
     */
    async updateAppointmentState(flow, responseData) {
        const newState = this.determineAppointmentState(flow.steps[flow.currentStep], flow);
        
        if (newState && window.dbManager) {
            await window.dbManager.updateAppointment(flow.appointmentId, {
                status: newState
            });
            
            console.log(`📊 Estado de cita actualizado a: ${newState}`);
        }
    }

    /**
     * Completar flujo de automatización
     */
    async completeFlow(flowId) {
        const flow = this.activeFlows.get(flowId);
        if (!flow) return null;

        flow.status = 'completed';
        flow.completedAt = new Date().toISOString();

        // Generar resumen del flujo
        const summary = {
            flowId: flowId,
            patientId: flow.patientId,
            appointmentId: flow.appointmentId,
            stepsCompleted: flow.currentStep,
            totalSteps: flow.steps.length,
            responses: flow.responses.length,
            legalAccepted: flow.legalAccepted,
            lopdAccepted: flow.lopdAccepted,
            completedAt: flow.completedAt
        };

        console.log('✅ Flujo completado:', summary);
        
        // Guardar en historial
        this.logAutomationActivity('flow_completed', summary);
        
        return summary;
    }

    /**
     * Enviar mensaje automatizado
     */
    async sendAutomationMessage(messageData) {
        console.log('📱 Enviando mensaje automatizado:', messageData);
        
        // En producción, aquí se enviaría por WhatsApp Business API
        this.logAutomationActivity('automation_message_sent', messageData);
    }

    /**
     * Enviar respuesta automática
     */
    async sendAutomaticResponse(flow, message) {
        const responseData = {
            to: flow.patientId,
            message: message,
            automated: true,
            flowId: flow.id
        };

        console.log('🤖 Respuesta automática:', responseData);
        this.logAutomationActivity('auto_response_sent', responseData);
    }

    /**
     * Mostrar mensaje en interfaz
     */
    displayAutomationMessage(messageData) {
        const container = document.getElementById('automationMessages');
        if (!container) return;

        const messageElement = document.createElement('div');
        messageElement.className = 'automation-message';
        messageElement.innerHTML = `
            <div class="message-header">
                <h4>🤖 Mensaje Automatizado</h4>
                <span class="message-time">${new Date().toLocaleTimeString()}</span>
            </div>
            <div class="message-content">
                <p><strong>Flujo ID:</strong> ${messageData.flowId}</p>
                <p><strong>Paso:</strong> ${messageData.stepIndex + 1}</p>
                <div class="message-text">
                    ${messageData.message.replace(/\n/g, '<br>')}
                </div>
                ${this.renderAttachments(messageData)}
                ${this.renderButtons(messageData)}
                ${this.renderQuestionnaire(messageData)}
                ${this.renderDocument(messageData)}
            </div>
            <div class="message-status">⏳ Esperando respuesta...</div>
        `;
        
        container.appendChild(messageElement);
        container.scrollTop = container.scrollHeight;
    }

    /**
     * Renderizar adjuntos
     */
    renderAttachments(messageData) {
        if (!messageData.attachments || messageData.attachments.length === 0) {
            return '';
        }

        return `
            <div class="message-attachments">
                <h5>📎 Adjuntos:</h5>
                ${messageData.attachments.map(att => `
                    <div class="attachment-item">
                        <i class="fas ${att.icon || 'fa-file'}"></i>
                        <span>${att.name}</span>
                        <button onclick="window.automationSystem.downloadAttachment('${att.url}')" class="btn btn-sm">Descargar</button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Renderizar botones
     */
    renderButtons(messageData) {
        if (!messageData.buttons || messageData.buttons.length === 0) {
            return '';
        }

        return `
            <div class="automation-buttons">
                ${messageData.buttons.map(button => `
                    <button class="btn ${button.class || 'btn-primary'}" 
                            onclick="window.automationSystem.handleButtonClick('${messageData.flowId}', '${button.value}', ${messageData.stepIndex})">
                        ${button.icon || ''} ${button.text}
                    </button>
                `).join('')}
            </div>
        `;
    }

    /**
     * Renderizar cuestionario
     */
    renderQuestionnaire(messageData) {
        if (!messageData.questionnaire) {
            return '';
        }

        const questionnaire = messageData.questionnaire;
        return `
            <div class="questionnaire-form">
                <h5>📋 ${questionnaire.title}</h5>
                ${questionnaire.questions.map((q, index) => `
                    <div class="question-item">
                        <label>${index + 1}. ${q.text}</label>
                        ${this.renderQuestionField(q, index)}
                    </div>
                `).join('')}
                <button class="btn btn-success" onclick="window.automationSystem.submitQuestionnaire('${messageData.flowId}', ${messageData.stepIndex})">
                    Enviar Respuestas
                </button>
            </div>
        `;
    }

    /**
     * Renderizar campo de pregunta
     */
    renderQuestionField(question, index) {
        switch (question.type) {
            case 'text':
                return `<input type="text" class="form-control" data-q="${index}" placeholder="${question.placeholder || ''}">`;
            case 'textarea':
                return `<textarea class="form-control" data-q="${index}" rows="3" placeholder="${question.placeholder || ''}"></textarea>`;
            case 'radio':
                return question.options.map((opt, i) => `
                    <div class="radio-option">
                        <input type="radio" name="q_${index}" value="${opt.value}" id="q_${index}_${i}">
                        <label for="q_${index}_${i}">${opt.label}</label>
                    </div>
                `).join('');
            case 'checkbox':
                return question.options.map((opt, i) => `
                    <div class="checkbox-option">
                        <input type="checkbox" name="q_${index}" value="${opt.value}" id="q_${index}_${i}">
                        <label for="q_${index}_${i}">${opt.label}</label>
                    </div>
                `).join('');
            case 'select':
                return `
                    <select class="form-control" data-q="${index}">
                        <option value="">Seleccionar...</option>
                        ${question.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                    </select>
                `;
            default:
                return `<input type="text" class="form-control" data-q="${index}">`;
        }
    }

    /**
     * Renderizar documento
     */
    renderDocument(messageData) {
        if (!messageData.document) {
            return '';
        }

        const document = messageData.document;
        return `
            <div class="document-display">
                <h5>📄 ${document.title}</h5>
                <div class="document-content">
                    ${document.content}
                </div>
                <div class="document-actions">
                    <button class="btn btn-success" onclick="window.automationSystem.handleDocumentAccept('${messageData.flowId}', ${messageData.stepIndex})">
                        ✅ Acepto
                    </button>
                    <button class="btn btn-secondary" onclick="window.automationSystem.handleDocumentReview('${messageData.flowId}', ${messageData.stepIndex})">
                        📖 Revisar
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Manejar clic en botón
     */
    handleButtonClick(flowId, value, stepIndex) {
        console.log(`🔘 Botón clickeado: ${value} en flujo ${flowId}`);
        
        this.processPatientResponse(flowId, {
            response: 'button_click',
            selectedOptions: [value],
            stepIndex: stepIndex
        });
    }

    /**
     * Enviar cuestionario
     */
    submitQuestionnaire(flowId, stepIndex) {
        const form = document.querySelector(`[data-flow-id="${flowId}"][data-step-index="${stepIndex}"]`);
        const questionnaire = document.querySelector('.questionnaire-form');
        
        const responses = {};
        const questionElements = questionnaire.querySelectorAll('[data-q]');
        
        questionElements.forEach(element => {
            const questionIndex = element.dataset.q;
            const questionType = element.type || element.tagName.toLowerCase();
            
            if (questionType === 'radio') {
                const selected = element.querySelector('input:checked');
                if (selected) {
                    responses[questionIndex] = selected.value;
                }
            } else if (questionType === 'checkbox') {
                const checked = Array.from(element.querySelectorAll('input:checked')).map(cb => cb.value);
                responses[questionIndex] = checked;
            } else {
                responses[questionIndex] = element.value;
            }
        });

        this.processPatientResponse(flowId, {
            response: 'questionnaire_completed',
            responses: responses,
            stepIndex: stepIndex
        });
    }

    /**
     * Aceptar documento
     */
    handleDocumentAccept(flowId, stepIndex) {
        this.processPatientResponse(flowId, {
            response: 'accept',
            stepIndex: stepIndex
        });
    }

    /**
     * Revisar documento
     */
    handleDocumentReview(flowId, stepIndex) {
        this.processPatientResponse(flowId, {
            response: 'review',
            stepIndex: stepIndex
        });
    }

    /**
     * Iniciar monitoreo automático
     */
    startAutomaticMonitoring() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        
        setInterval(() => {
            this.checkPendingAutomations();
        }, this.config.checkInterval);
        
        console.log('🔄 Monitoreo automático de automatización iniciado');
    }

    /**
     * Verificar automatizaciones pendientes
     */
    async checkPendingAutomations() {
        // Obtener citas que necesitan automatización
        if (window.dbManager) {
            const pendingAppointments = await window.dbManager.getPendingAutomations();
            
            for (const appointment of pendingAppointments) {
                await this.startAppointmentAutomation(appointment);
            }
        }
    }

    /**
     * Iniciar automatización de cita
     */
    async startAppointmentAutomation(appointment) {
        const flowConfig = {
            name: `Cita ${appointment.date} ${appointment.time}`,
            type: 'mixed',
            patientId: appointment.patientPhone,
            appointmentId: appointment.id,
            steps: [
                {
                    type: 'message',
                    message: `Hola ${appointment.patientName},\n\nSu cita de ${appointment.service} está programada para:\n📅 ${appointment.date}\n🕐 ${appointment.time}\n\n¿Podría confirmar su asistencia?`,
                    buttons: [
                        { text: 'Confirmar', value: 'confirm', class: 'btn-success' },
                        { text: 'Cancelar', value: 'cancel', class: 'btn-danger' }
                    ]
                },
                {
                    type: 'state_confirmation',
                    targetState: this.APP_STATES.CONFIRMADA,
                    message: '¡Perfecto! Su cita ha sido confirmada.'
                },
                {
                    type: 'document',
                    documentId: 'informed_consent_treatment',
                    title: 'Consentimiento Informado',
                    requiresLegal: true,
                    message: 'Para completar su registro, por favor revise y acepte el consentimiento informado del tratamiento.'
                },
                {
                    type: 'state_confirmation',
                    targetState: this.APP_STATES.ACEPTADA,
                    message: '¡Excelente! Cita aceptada con consentimiento informado.'
                },
                {
                    type: 'questionnaire',
                    title: 'Cuestionario de Primera Visita',
                    requiresLegal: true,
                    questions: [
                        {
                            type: 'text',
                            text: 'Nombre completo'
                        },
                        {
                            type: 'text',
                            text: 'Teléfono de contacto'
                        },
                        {
                            type: 'radio',
                            text: '¿Tiene alguna alergia conocida?',
                            options: [
                                { label: 'Sí', value: 'yes' },
                                { label: 'No', value: 'no' }
                            ]
                        },
                        {
                            type: 'textarea',
                            text: 'Medicamentos que toma actualmente (opcional)',
                            placeholder: 'Describa medicamentos, dosis y frecuencia...'
                        }
                    ],
                    message: 'Por favor complete este cuestionario para su primera visita.'
                },
                {
                    type: 'document',
                    documentId: 'lopd_consent',
                    title: 'Consentimiento LOPD',
                    requiresLegal: true,
                    message: 'Debe aceptar el consentimiento de protección de datos según la ley LOPD.'
                },
                {
                    type: 'message',
                    message: '¡Proceso completado! Gracias por su tiempo. Nos vemos en su cita.',
                    buttons: []
                }
            ]
        };

        const flowId = this.createAutomationFlow(flowConfig);
        await this.sendFlowStep(flowId);
        
        return flowId;
    }

    /**
     * Registro de actividad
     */
    logAutomationActivity(action, data) {
        const activity = {
            timestamp: new Date().toISOString(),
            action,
            data,
            system: 'advanced_automation'
        };
        
        console.log(`🤖 [Automatización] ${action}:`, data);
        
        const activities = JSON.parse(localStorage.getItem('automationActivities') || '[]');
        activities.push(activity);
        
        if (activities.length > 1000) {
            activities.splice(0, activities.length - 1000);
        }
        
        localStorage.setItem('automationActivities', JSON.stringify(activities));
    }

    /**
     * Obtener estadísticas
     */
    getAutomationStats() {
        const activities = JSON.parse(localStorage.getItem('automationActivities') || '[]');
        
        return {
            totalFlows: this.activeFlows.size,
            completedFlows: activities.filter(a => a.action === 'flow_completed').length,
            messagesSent: activities.filter(a => a.action === 'automation_message_sent').length,
            questionnairesCompleted: activities.filter(a => a.action === 'questionnaire_completed').length,
            documentsAcknowledged: activities.filter(a => a.action === 'document_acknowledged').length,
            legalAccepted: activities.filter(a => a.data.legalAccepted === true).length
        };
    }
}

// Inicializar sistema cuando se cargue la página
document.addEventListener('DOMContentLoaded', () => {
    window.automationSystem = new AdvancedAutomationSystem();
    
    // Exponer función de prueba
    window.testAdvancedAutomation = () => {
        window.automationSystem.startAppointmentAutomation({
            id: 'test_appointment',
            patientName: 'Paciente de Prueba',
            patientPhone: '666123456',
            date: new Date().toISOString().split('T')[0],
            time: '15:30',
            service: 'consulta general'
        });
    };
});

console.log('🤖 Sistema de Automatización Avanzado cargado');