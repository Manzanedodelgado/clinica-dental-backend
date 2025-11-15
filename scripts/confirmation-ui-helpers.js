// Funciones de ayuda para la interfaz del sistema de confirmación

/**
 * Actualizar estadísticas en tiempo real
 */
function updateConfirmationStats() {
    if (window.confirmationSystem) {
        const stats = window.confirmationSystem.getConfirmationStats();
        
        document.getElementById('totalMessagesSent').textContent = stats.totalMessagesSent;
        document.getElementById('confirmedCount').textContent = stats.confirmed;
        document.getElementById('cancelledCount').textContent = stats.cancelled;
        document.getElementById('activeCount').textContent = stats.activeConfirmations;
        
        console.log('📊 Estadísticas actualizadas:', stats);
    }
}

/**
 * Probar el flujo completo de confirmación
 */
function testConfirmationFlow() {
    if (!window.confirmationSystem) {
        alert('Sistema de confirmación no disponible');
        return;
    }
    
    const testData = {
        id: `test_${Date.now()}`,
        patientName: 'Ana Martínez',
        patientPhone: '666123789',
        date: new Date().toISOString().split('T')[0],
        time: '11:30',
        service: 'revisión dental'
    };
    
    console.log('🧪 Iniciando prueba del flujo completo...');
    
    // 1. Programar mensaje de confirmación
    window.confirmationSystem.testConfirmationMessage(testData);
    
    // 2. Mostrar notificación de inicio
    if (window.dentalApp) {
        window.dentalApp.showNotification('Prueba de confirmación iniciada', 'info');
    }
    
    // 3. Actualizar estadísticas después de un tiempo
    setTimeout(() => {
        updateConfirmationStats();
        if (window.dentalApp) {
            window.dentalApp.showNotification('Mensaje de prueba enviado', 'success');
        }
    }, 2000);
}

/**
 * Simular respuesta de confirmación
 */
function testConfirmationResponse() {
    const testAppointmentId = `test_${Date.now()}`;
    const testPhone = '666123789';
    
    console.log('✅ Simulando confirmación...');
    
    if (window.confirmationSystem) {
        window.confirmationSystem.handleButtonResponse(testAppointmentId, 'confirm', testPhone);
        
        // Actualizar estadísticas
        setTimeout(() => {
            updateConfirmationStats();
            if (window.dentalApp) {
                window.dentalApp.showNotification('Cita confirmada automáticamente', 'success');
            }
        }, 1500);
    }
}

/**
 * Simular respuesta de cancelación
 */
function testCancellationResponse() {
    const testAppointmentId = `test_${Date.now()}`;
    const testPhone = '666123789';
    
    console.log('❌ Simulando cancelación...');
    
    if (window.confirmationSystem) {
        window.confirmationSystem.handleButtonResponse(testAppointmentId, 'cancel', testPhone);
        
        // Actualizar estadísticas
        setTimeout(() => {
            updateConfirmationStats();
            if (window.dentalApp) {
                window.dentalApp.showNotification('Cita cancelada - Ofreciendo reprogramación', 'warning');
            }
        }, 1500);
    }
}

/**
 * Exportar historial de confirmaciones
 */
function exportConfirmationHistory() {
    const activities = JSON.parse(localStorage.getItem('confirmationActivities') || '[]');
    
    if (activities.length === 0) {
        alert('No hay datos para exportar');
        return;
    }
    
    // Crear contenido del archivo
    const csvContent = generateConfirmationCSV(activities);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `historial_confirmaciones_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('📁 Historial exportado exitosamente');
        
        if (window.dentalApp) {
            window.dentalApp.showNotification('Historial exportado correctamente', 'success');
        }
    }
}

/**
 * Generar contenido CSV del historial
 */
function generateConfirmationCSV(activities) {
    const headers = ['Timestamp', 'Acción', 'Detalles', 'Sistema'];
    let csv = headers.join(',') + '\n';
    
    activities.forEach(activity => {
        const row = [
            new Date(activity.timestamp).toLocaleString('es-ES'),
            activity.action,
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
function loadConfirmationHistory() {
    const historyContainer = document.getElementById('confirmationHistory');
    if (!historyContainer) return;
    
    const activities = JSON.parse(localStorage.getItem('confirmationActivities') || '[]');
    
    if (activities.length === 0) {
        historyContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <p>No hay actividad registrada aún</p>
            </div>
        `;
        return;
    }
    
    // Mostrar las últimas 20 actividades
    const recentActivities = activities.slice(-20).reverse();
    
    historyContainer.innerHTML = recentActivities.map(activity => {
        const timestamp = new Date(activity.timestamp).toLocaleString('es-ES');
        const actionText = formatActionText(activity.action);
        const statusClass = getActionStatusClass(activity.action);
        
        return `
            <div class="history-item ${statusClass}">
                <div class="history-icon">
                    ${getActionIcon(activity.action)}
                </div>
                <div class="history-content">
                    <div class="history-title">${actionText}</div>
                    <div class="history-details">${formatActivityDetails(activity.data)}</div>
                    <div class="history-time">${timestamp}</div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Formatear texto de la acción
 */
function formatActionText(action) {
    const actions = {
        'confirmation_message_sent': 'Mensaje de confirmación enviado',
        'appointment_confirmed': 'Cita confirmada por paciente',
        'appointment_cancelled': 'Cita cancelada por paciente',
        'reschedule_offer_sent': 'Oferta de reprogramación enviada',
        'patient_response_processed': 'Respuesta del paciente procesada'
    };
    
    return actions[action] || action;
}

/**
 * Obtener clase de estado según la acción
 */
function getActionStatusClass(action) {
    if (action.includes('confirmed')) return 'status-success';
    if (action.includes('cancelled')) return 'status-danger';
    if (action.includes('reschedule')) return 'status-warning';
    return 'status-info';
}

/**
 * Obtener icono según la acción
 */
function getActionIcon(action) {
    const icons = {
        'confirmation_message_sent': '<i class="fas fa-paper-plane"></i>',
        'appointment_confirmed': '<i class="fas fa-check-circle"></i>',
        'appointment_cancelled': '<i class="fas fa-times-circle"></i>',
        'reschedule_offer_sent': '<i class="fas fa-calendar-plus"></i>',
        'patient_response_processed': '<i class="fas fa-cog"></i>'
    };
    
    return icons[action] || '<i class="fas fa-info-circle"></i>';
}

/**
 * Formatear detalles de la actividad
 */
function formatActivityDetails(data) {
    if (!data) return '';
    
    try {
        if (data.patientName && data.patientPhone) {
            return `Paciente: ${data.patientName} (${data.patientPhone})`;
        }
        if (data.appointmentId) {
            return `Cita ID: ${data.appointmentId}`;
        }
        if (data.message) {
            return `Mensaje: ${data.message.substring(0, 50)}...`;
        }
        return JSON.stringify(data).substring(0, 100);
    } catch (error) {
        return 'Detalles no disponibles';
    }
}

/**
 * Configurar event listeners para la interfaz
 */
function setupConfirmationUI() {
    // Actualizar estadísticas cada 30 segundos
    setInterval(updateConfirmationStats, 30000);
    
    // Cargar historial al cargar la página
    document.addEventListener('DOMContentLoaded', loadConfirmationHistory);
    
    // Event listeners para configuración
    const leadTimeSelect = document.getElementById('confirmationLeadTime');
    if (leadTimeSelect) {
        leadTimeSelect.addEventListener('change', (e) => {
            if (window.confirmationSystem) {
                window.confirmationSystem.config.confirmationLeadTime = parseInt(e.target.value);
                localStorage.setItem('confirmationLeadTime', e.target.value);
                console.log('⚙️ Tiempo de anticipación actualizado:', e.target.value);
            }
        });
    }
    
    const modeSelect = document.getElementById('confirmationMode');
    if (modeSelect) {
        modeSelect.addEventListener('change', (e) => {
            localStorage.setItem('confirmationMode', e.target.value);
            console.log('⚙️ Modo de confirmación actualizado:', e.target.value);
        });
    }
    
    const toggle = document.getElementById('confirmationSystemToggle');
    if (toggle) {
        toggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                if (window.confirmationSystem) {
                    window.confirmationSystem.startAutomaticMonitoring();
                }
                console.log('✅ Sistema de confirmación activado');
            } else {
                if (window.confirmationSystem) {
                    window.confirmationSystem.stop();
                }
                console.log('⏹️ Sistema de confirmación desactivado');
            }
        });
    }
    
    // Cargar configuración guardada
    loadSavedConfiguration();
}

/**
 * Cargar configuración guardada
 */
function loadSavedConfiguration() {
    const leadTime = localStorage.getItem('confirmationLeadTime');
    if (leadTime) {
        const select = document.getElementById('confirmationLeadTime');
        if (select) select.value = leadTime;
    }
    
    const mode = localStorage.getItem('confirmationMode');
    if (mode) {
        const select = document.getElementById('confirmationMode');
        if (select) select.value = mode;
    }
}

/**
 * Inicializar sistema de confirmación al cargar la página
 */
document.addEventListener('DOMContentLoaded', () => {
    // Configurar interfaz
    setupConfirmationUI();
    
    // Actualizar estadísticas iniciales
    setTimeout(updateConfirmationStats, 1000);
    
    console.log('🔧 Sistema de confirmación - Interfaz inicializada');
});

// Exponer funciones globalmente para que puedan ser llamadas desde HTML
window.updateConfirmationStats = updateConfirmationStats;
window.testConfirmationFlow = testConfirmationFlow;
window.testConfirmationResponse = testConfirmationResponse;
window.testCancellationResponse = testCancellationResponse;
window.exportConfirmationHistory = exportConfirmationHistory;
window.loadConfirmationHistory = loadConfirmationHistory;

console.log('📋 Funciones de ayuda del sistema de confirmación cargadas');