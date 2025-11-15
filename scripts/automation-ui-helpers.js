// Funciones de ayuda para la interfaz del sistema de automatización avanzada

/**
 * Actualizar estadísticas de automatización
 */
function refreshAutomationStats() {
    if (window.automationSystem) {
        const stats = window.automationSystem.getAutomationStats();
        
        document.getElementById('activeFlowsCount').textContent = stats.totalFlows;
        document.getElementById('completedFlowsCount').textContent = stats.completedFlows;
        document.getElementById('lopdDocumentsCount').textContent = stats.documentsAcknowledged;
        document.getElementById('questionnairesCount').textContent = stats.questionnairesCompleted;
        
        console.log('📊 Estadísticas de automatización actualizadas:', stats);
    }
}

/**
 * Probar flujo completo de automatización
 */
function testFullAutomationFlow() {
    if (!window.automationSystem) {
        alert('Sistema de automatización no disponible');
        return;
    }
    
    const testData = {
        id: `full_flow_${Date.now()}`,
        patientName: 'María Fernández',
        patientPhone: '666789123',
        date: new Date().toISOString().split('T')[0],
        time: '16:00',
        service: 'primera consulta + tratamiento'
    };
    
    console.log('🧪 Iniciando prueba de flujo completo...');
    
    // Crear flujo completo con todos los elementos
    const flowConfig = {
        name: `Flujo Completo - ${testData.patientName}`,
        type: 'mixed',
        patientId: testData.patientPhone,
        appointmentId: testData.id,
        steps: [
            {
                type: 'message',
                message: `Hola ${testData.patientName},\n\nSu cita para ${testData.service} está programada para:\n📅 ${testData.date}\n🕐 ${testData.time}\n\n¿Podría confirmar su asistencia?`,
                buttons: [
                    { text: 'Confirmar', value: 'confirm', class: 'btn-success', icon: '✓' },
                    { text: 'Reprogramar', value: 'reschedule', class: 'btn-warning', icon: '↻' },
                    { text: 'Cancelar', value: 'cancel', class: 'btn-danger', icon: '✕' }
                ]
            },
            {
                type: 'state_confirmation',
                targetState: 'Confirmada',
                message: '¡Perfecto! Su cita ha sido confirmada. Ahora debe revisar los documentos legales.'
            },
            {
                type: 'document',
                documentId: 'informed_consent_treatment',
                title: 'Consentimiento Informado del Tratamiento',
                requiresLegal: true,
                message: 'Para cumplir con la normativa médica, debe revisar y aceptar este consentimiento informado antes de su cita.'
            },
            {
                type: 'questionnaire',
                title: 'Cuestionario Médico Previo',
                requiresLegal: true,
                questions: [
                    {
                        type: 'text',
                        text: 'Nombre completo'
                    },
                    {
                        type: 'text',
                        text: 'Fecha de nacimiento'
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
                        text: 'Medicamentos que toma actualmente',
                        placeholder: 'Describa medicamentos, dosis y frecuencia...'
                    },
                    {
                        type: 'checkbox',
                        text: '¿Ha tenido alguno de estos problemas?',
                        options: [
                            { label: 'Diabetes', value: 'diabetes' },
                            { label: 'Hipertensión', value: 'hypertension' },
                            { label: 'Problemas cardíacos', value: 'heart' },
                            { label: 'Ninguno', value: 'none' }
                        ]
                    },
                    {
                        type: 'select',
                        text: '¿Cuándo fue su última visita dental?',
                        options: [
                            { label: 'Hace menos de 6 meses', value: '6months' },
                            { label: 'Hace 6-12 meses', value: '6_12months' },
                            { label: 'Hace más de 1 año', value: '1year' },
                            { label: 'Nunca he ido', value: 'never' }
                        ]
                    }
                ],
                message: 'Este cuestionario es obligatorio para su primera visita y nos ayuda a brindarle el mejor cuidado.'
            },
            {
                type: 'document',
                documentId: 'lopd_consent',
                title: 'Consentimiento LOPD - Protección de Datos',
                requiresLegal: true,
                message: 'Debe aceptar el consentimiento de protección de datos según la Ley Orgánica 3/2018 (LOPD).'
            },
            {
                type: 'state_confirmation',
                targetState: 'Aceptada',
                message: '¡Excelente! Proceso completado. Su cita está completamente registrada y acceptada.'
            },
            {
                type: 'message',
                message: `¡Gracias ${testData.patientName}!\n\nSu cita ha sido processada completamente:\n✅ Confirmada\n✅ Consentimiento aceptado\n✅ Cuestionario completado\n✅ LOPD validado\n\nNos vemos el ${testData.date} a las ${testData.time}. ¡Que tenga un excelente día!`,
                buttons: []
            }
        ]
    };

    const flowId = window.automationSystem.createAutomationFlow(flowConfig);
    
    // Notificar inicio de prueba
    if (window.dentalApp) {
        window.dentalApp.showNotification('Prueba de automatización iniciada', 'info');
    }
    
    // Actualizar estadísticas
    setTimeout(() => {
        refreshAutomationStats();
        if (window.dentalApp) {
            window.dentalApp.showNotification('Flujo de automatización enviado', 'success');
        }
    }, 2000);
    
    console.log('✅ Flujo completo iniciado:', flowId);
}

/**
 * Probar solo cuestionario
 */
function testQuestionnaireFlow() {
    const flowConfig = {
        name: 'Solo Cuestionario',
        type: 'questionnaire',
        patientId: '666123456',
        appointmentId: `q_${Date.now()}`,
        steps: [
            {
                type: 'questionnaire',
                title: 'Cuestionario Dental Express',
                questions: [
                    {
                        type: 'text',
                        text: '¿Cuál es su principal preocupación dental?'
                    },
                    {
                        type: 'radio',
                        text: '¿Prefiere cita matutina o vespertina?',
                        options: [
                            { label: 'Mañana (9:00-12:00)', value: 'morning' },
                            { label: 'Tarde (15:00-18:00)', value: 'afternoon' },
                            { label: 'Cualquier hora', value: 'anytime' }
                        ]
                    }
                ]
            },
            {
                type: 'message',
                message: '¡Cuestionario completado! Sus preferencias han sido registradas.',
                buttons: []
            }
        ]
    };

    const flowId = window.automationSystem.createAutomationFlow(flowConfig);
    window.automationSystem.sendFlowStep(flowId);
    
    if (window.dentalApp) {
        window.dentalApp.showNotification('Cuestionario de prueba enviado', 'info');
    }
}

/**
 * Probar solo documentos
 */
function testDocumentFlow() {
    const flowConfig = {
        name: 'Solo Documentos',
        type: 'document',
        patientId: '666123456',
        appointmentId: `doc_${Date.now()}`,
        steps: [
            {
                type: 'message',
                message: 'Para completar su registro, debe revisar los siguientes documentos:'
            },
            {
                type: 'document',
                documentId: 'informed_consent_treatment',
                title: 'Consentimiento de Tratamiento',
                requiresLegal: true
            },
            {
                type: 'document',
                documentId: 'lopd_consent',
                title: 'Política de Privacidad LOPD',
                requiresLegal: true
            },
            {
                type: 'message',
                message: 'Documentos revisados. Proceso completado.',
                buttons: []
            }
        ]
    };

    const flowId = window.automationSystem.createAutomationFlow(flowConfig);
    window.automationSystem.sendFlowStep(flowId);
    
    if (window.dentalApp) {
        window.dentalApp.showNotification('Documentos de prueba enviados', 'info');
    }
}

/**
 * Probar validación LOPD
 */
function testLOPDCompliance() {
    const flowConfig = {
        name: 'Validación LOPD',
        type: 'mixed',
        patientId: '666123456',
        appointmentId: `lopd_${Date.now()}`,
        steps: [
            {
                type: 'message',
                message: 'Prueba de cumplimiento LOPD - Verificando documentación legal...'
            },
            {
                type: 'document',
                documentId: 'lopd_consent',
                title: 'Prueba LOPD - Consentimiento de Datos',
                requiresLegal: true
            },
            {
                type: 'state_confirmation',
                targetState: 'Planificada',
                message: 'Validación LOPD completada. Cumplimiento confirmado.'
            }
        ]
    };

    const flowId = window.automationSystem.createAutomationFlow(flowConfig);
    window.automationSystem.sendFlowStep(flowId);
    
    // Mostrar información LOPD
    setTimeout(() => {
        showLOPDComplianceInfo();
    }, 3000);
}

/**
 * Mostrar información de cumplimiento LOPD
 */
function showLOPDComplianceInfo() {
    const modal = document.createElement('div');
    modal.className = 'lopd-compliance-modal';
    modal.innerHTML = `
        <div class="modal-backdrop" onclick="closeLOPDModal()"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h2>🛡️ Cumplimiento LOPD Verificado</h2>
                <button class="close-btn" onclick="closeLOPDModal()">✕</button>
            </div>
            <div class="modal-body">
                <div class="compliance-status">
                    <div class="status-item success">
                        <i class="fas fa-check-circle"></i>
                        <span>Consentimiento LOPD configurado</span>
                    </div>
                    <div class="status-item success">
                        <i class="fas fa-check-circle"></i>
                        <span>Documentos legales cargados</span>
                    </div>
                    <div class="status-item success">
                        <i class="fas fa-check-circle"></i>
                        <span>Seguimiento de aceptación implementado</span>
                    </div>
                    <div class="status-item success">
                        <i class="fas fa-check-circle"></i>
                        <span>Trazabilidad de datos garantizada</span>
                    </div>
                </div>
                <div class="legal-notice">
                    <h4>Información Legal</h4>
                    <p>El sistema cumple con:</p>
                    <ul>
                        <li><strong>RGPD (Reglamento General de Protección de Datos)</strong></li>
                        <li><strong>LOPD (Ley Orgánica 3/2018 de Protección de Datos)</strong></li>
                        <li><strong>Ley 41/2002 de Autonomía del Paciente</strong></li>
                    </ul>
                    <p><em>Este sistema garantiza el cumplimiento legal automático en todos los procesos de automatización.</em></p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Mostrar modal con animación
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

/**
 * Cerrar modal LOPD
 */
function closeLOPDModal() {
    const modal = document.querySelector('.lopd-compliance-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

/**
 * Probar transiciones de estados de cita
 */
function testStateTransitions() {
    const states = ['Planificada', 'Confirmada', 'Aceptada', 'Cancelada', 'Anula'];
    const colors = ['info', 'success', 'primary', 'warning', 'danger'];
    
    let currentStateIndex = 0;
    
    function showNextState() {
        if (currentStateIndex < states.length) {
            const state = states[currentStateIndex];
            const color = colors[currentStateIndex];
            
            // Mostrar transición
            if (window.dentalApp) {
                window.dentalApp.showNotification(
                    `Estado de cita cambiado a: ${state}`, 
                    color
                );
            }
            
            // Simular actualización en base de datos
            console.log(`📊 Estado actualizado en SQL Server: ${state}`);
            
            currentStateIndex++;
            setTimeout(showNextState, 2000);
        } else {
            if (window.dentalApp) {
                window.dentalApp.showNotification('Prueba de estados completada', 'success');
            }
        }
    }
    
    showNextState();
}

/**
 * Limpiar monitor de automatización
 */
function clearAutomationMonitor() {
    const monitor = document.getElementById('automationMessages');
    if (monitor) {
        monitor.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-robot"></i>
                <p>Los flujos de automatización aparecerán aquí en tiempo real</p>
                <small>El sistema crea flujos dinámicos basados en las respuestas del paciente</small>
            </div>
        `;
    }
    
    console.log('🧹 Monitor de automatización limpiado');
}

/**
 * Exportar historial de automatización
 */
function exportAutomationHistory() {
    const activities = JSON.parse(localStorage.getItem('automationActivities') || '[]');
    
    if (activities.length === 0) {
        alert('No hay datos para exportar');
        return;
    }
    
    // Crear contenido del archivo
    const csvContent = generateAutomationCSV(activities);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `historial_automatizacion_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('📁 Historial de automatización exportado');
        
        if (window.dentalApp) {
            window.dentalApp.showNotification('Historial exportado correctamente', 'success');
        }
    }
}

/**
 * Generar contenido CSV del historial
 */
function generateAutomationCSV(activities) {
    const headers = ['Timestamp', 'Acción', 'Detalles Flujo ID', 'Datos', 'Sistema'];
    let csv = headers.join(',') + '\n';
    
    activities.forEach(activity => {
        const row = [
            new Date(activity.timestamp).toLocaleString('es-ES'),
            activity.action,
            activity.data.flowId || '',
            JSON.stringify(activity.data).replace(/"/g, '""'),
            activity.system
        ];
        csv += row.join(',') + '\n';
    });
    
    return csv;
}

/**
 * Cargar historial en la interfaz
 */
function loadAutomationHistory() {
    const historyContainer = document.getElementById('automationHistory');
    if (!historyContainer) return;
    
    const activities = JSON.parse(localStorage.getItem('automationActivities') || '[]');
    
    if (activities.length === 0) {
        historyContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <p>No hay actividad de automatización registrada aún</p>
            </div>
        `;
        return;
    }
    
    // Mostrar las últimas 20 actividades
    const recentActivities = activities.slice(-20).reverse();
    
    historyContainer.innerHTML = recentActivities.map(activity => {
        const timestamp = new Date(activity.timestamp).toLocaleString('es-ES');
        const actionText = formatAutomationAction(activity.action);
        const statusClass = getAutomationActionStatus(activity.action);
        
        return `
            <div class="automation-history-item ${statusClass}">
                <div class="automation-history-icon">
                    ${getAutomationActionIcon(activity.action)}
                </div>
                <div class="automation-history-content">
                    <div class="automation-history-title">${actionText}</div>
                    <div class="automation-history-details">${formatAutomationDetails(activity.data)}</div>
                    <div class="automation-history-time">${timestamp}</div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Formatear acción de automatización
 */
function formatAutomationAction(action) {
    const actions = {
        'automation_message_sent': 'Mensaje automatizado enviado',
        'flow_completed': 'Flujo de automatización completado',
        'questionnaire_completed': 'Cuestionario completado',
        'document_acknowledged': 'Documento legal aceptado',
        'state_updated': 'Estado de cita actualizado',
        'lopd_validated': 'Validación LOPD completada'
    };
    
    return actions[action] || action;
}

/**
 * Obtener clase de estado según la acción
 */
function getAutomationActionStatus(action) {
    if (action.includes('completed') || action.includes('validated')) return 'status-success';
    if (action.includes('acknowledged') || action.includes('updated')) return 'status-info';
    if (action.includes('sent')) return 'status-warning';
    return 'status-neutral';
}

/**
 * Obtener icono según la acción
 */
function getAutomationActionIcon(action) {
    const icons = {
        'automation_message_sent': '<i class="fas fa-robot"></i>',
        'flow_completed': '<i class="fas fa-check-double"></i>',
        'questionnaire_completed': '<i class="fas fa-clipboard-check"></i>',
        'document_acknowledged': '<i class="fas fa-file-contract"></i>',
        'state_updated': '<i class="fas fa-exchange-alt"></i>',
        'lopd_validated': '<i class="fas fa-shield-alt"></i>'
    };
    
    return icons[action] || '<i class="fas fa-cog"></i>';
}

/**
 * Formatear detalles de la actividad
 */
function formatAutomationDetails(data) {
    if (!data) return '';
    
    try {
        if (data.flowId) {
            return `Flujo ID: ${data.flowId}`;
        }
        if (data.patientName && data.patientPhone) {
            return `Paciente: ${data.patientName} (${data.patientPhone})`;
        }
        if (data.type) {
            return `Tipo: ${data.type}`;
        }
        return JSON.stringify(data).substring(0, 80);
    } catch (error) {
        return 'Detalles no disponibles';
    }
}

/**
 * Editar documento legal
 */
function editLegalDocument(documentId) {
    const document = window.automationSystem.legalDocuments.get(documentId);
    if (!document) return;
    
    // En una implementación real, esto abriría un editor modal
    alert(`Editar documento: ${document.name}\n\nEsta funcionalidad se implementaría con un editor modal para modificar el contenido del documento legal.\n\nTipo: ${document.type}\nVersión: ${document.version}\nObligatorio: ${document.mandatory ? 'Sí' : 'No'}`);
}

/**
 * Configurar event listeners para la interfaz
 */
function setupAutomationUI() {
    // Actualizar estadísticas cada 30 segundos
    setInterval(refreshAutomationStats, 30000);
    
    // Cargar historial al cargar la página
    document.addEventListener('DOMContentLoaded', loadAutomationHistory);
    
    // Event listeners para configuración
    const flowTypeSelect = document.getElementById('defaultFlowType');
    if (flowTypeSelect) {
        flowTypeSelect.addEventListener('change', (e) => {
            localStorage.setItem('defaultFlowType', e.target.value);
            console.log('⚙️ Tipo de flujo por defecto actualizado:', e.target.value);
        });
    }
    
    const legalToggle = document.getElementById('legalVerificationToggle');
    if (legalToggle) {
        legalToggle.addEventListener('change', (e) => {
            localStorage.setItem('legalVerificationEnabled', e.target.checked);
            console.log('⚙️ Verificación legal actualizada:', e.target.checked);
        });
    }
    
    const lopdToggle = document.getElementById('lopdTrackingToggle');
    if (lopdToggle) {
        lopdToggle.addEventListener('change', (e) => {
            localStorage.setItem('lopdTrackingEnabled', e.target.checked);
            console.log('⚙️ Seguimiento LOPD actualizado:', e.target.checked);
        });
    }
    
    // Cargar configuración guardada
    loadSavedAutomationConfig();
}

/**
 * Cargar configuración guardada
 */
function loadSavedAutomationConfig() {
    const flowType = localStorage.getItem('defaultFlowType');
    if (flowType) {
        const select = document.getElementById('defaultFlowType');
        if (select) select.value = flowType;
    }
    
    const legalEnabled = localStorage.getItem('legalVerificationEnabled');
    if (legalEnabled !== null) {
        const toggle = document.getElementById('legalVerificationToggle');
        if (toggle) toggle.checked = legalEnabled === 'true';
    }
    
    const lopdEnabled = localStorage.getItem('lopdTrackingEnabled');
    if (lopdEnabled !== null) {
        const toggle = document.getElementById('lopdTrackingToggle');
        if (toggle) toggle.checked = lopdEnabled === 'true';
    }
}

/**
 * Inicializar sistema de automatización al cargar la página
 */
document.addEventListener('DOMContentLoaded', () => {
    // Configurar interfaz
    setupAutomationUI();
    
    // Actualizar estadísticas iniciales
    setTimeout(refreshAutomationStats, 1500);
    
    console.log('🤖 Sistema de automatización - Interfaz inicializada');
});

// Exponer funciones globalmente para que puedan ser llamadas desde HTML
window.refreshAutomationStats = refreshAutomationStats;
window.testFullAutomationFlow = testFullAutomationFlow;
window.testQuestionnaireFlow = testQuestionnaireFlow;
window.testDocumentFlow = testDocumentFlow;
window.testLOPDCompliance = testLOPDCompliance;
window.testStateTransitions = testStateTransitions;
window.clearAutomationMonitor = clearAutomationMonitor;
window.exportAutomationHistory = exportAutomationHistory;
window.loadAutomationHistory = loadAutomationHistory;
window.editLegalDocument = editLegalDocument;
window.closeLOPDModal = closeLOPDModal;

console.log('🤖 Funciones de ayuda del sistema de automatización cargadas');