/**
 * Test Script para Confirmación de Citas
 * Rubio García Dental - SQL Server Integration
 */

// Script de prueba para verificar la funcionalidad bidireccional
class ConfirmationTest {
    constructor() {
        this.testResults = [];
    }

    /**
     * Simular mensaje de confirmación de paciente
     */
    async simulatePatientConfirmation() {
        console.log('🧪 Simulando confirmación de paciente...');
        
        try {
            // Simular mensaje entrante
            const incomingMessage = {
                id: 'test_msg_' + Date.now(),
                patientPhone: '666123456',
                patientName: 'Paciente Test',
                text: 'Confirmo la cita de mañana',
                appointmentId: 'apt_test_001',
                appointmentDate: '2025-11-17',
                appointmentTime: '09:00',
                status: 'pending'
            };

            console.log('📱 Mensaje simulado:', incomingMessage);

            // Procesar mensaje a través del agente IA
            if (window.aiAgent) {
                const result = await window.aiAgent.handleAppointmentConfirmation();
                console.log('✅ Resultado del procesamiento:', result);
                
                this.testResults.push({
                    test: 'patient_confirmation',
                    success: result.success,
                    confirmed: result.confirmed,
                    cancelled: result.cancelled,
                    timestamp: new Date().toISOString()
                });
                
                return result;
            } else {
                console.error('❌ Agente IA no disponible');
                return { success: false, error: 'AI Agent not available' };
            }
            
        } catch (error) {
            console.error('❌ Error en prueba de confirmación:', error);
            this.testResults.push({
                test: 'patient_confirmation',
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            return { success: false, error: error.message };
        }
    }

    /**
     * Simular mensaje de cancelación de paciente
     */
    async simulatePatientCancellation() {
        console.log('🧪 Simulando cancelación de paciente...');
        
        try {
            const incomingMessage = {
                id: 'test_cancel_' + Date.now(),
                patientPhone: '666789123',
                patientName: 'Paciente Cancelador',
                text: 'No puedo asistir, voy a cancelar',
                appointmentId: 'apt_test_002',
                appointmentDate: '2025-11-18',
                appointmentTime: '14:30',
                status: 'pending'
            };

            console.log('📱 Mensaje de cancelación simulado:', incomingMessage);

            if (window.aiAgent) {
                const result = await window.aiAgent.handleAppointmentConfirmation();
                console.log('✅ Resultado de cancelación:', result);
                
                this.testResults.push({
                    test: 'patient_cancellation',
                    success: result.success,
                    confirmed: result.confirmed,
                    cancelled: result.cancelled,
                    timestamp: new Date().toISOString()
                });
                
                return result;
            } else {
                console.error('❌ Agente IA no disponible');
                return { success: false, error: 'AI Agent not available' };
            }
            
        } catch (error) {
            console.error('❌ Error en prueba de cancelación:', error);
            this.testResults.push({
                test: 'patient_cancellation',
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            return { success: false, error: error.message };
        }
    }

    /**
     * Verificar sincronización bidireccional
     */
    async testBidirectionalSync() {
        console.log('🧪 Verificando sincronización bidireccional...');
        
        try {
            // 1. Verificar estado inicial de citas en SQL Server
            const initialAppointments = await this.getAppointmentsFromSQL();
            console.log('📋 Estado inicial:', initialAppointments.length, 'citas');
            
            // 2. Procesar confirmación
            const confirmationResult = await this.simulatePatientConfirmation();
            
            // 3. Verificar cambios en SQL Server
            const updatedAppointments = await this.getAppointmentsFromSQL();
            console.log('📋 Estado después de confirmación:', updatedAppointments.length, 'citas');
            
            // 4. Verificar actualización en calendario
            if (window.calendarManager) {
                await window.calendarManager.loadAppointments();
                window.calendarManager.renderCalendar();
                console.log('📅 Calendario actualizado');
            }
            
            const syncTestResult = {
                test: 'bidirectional_sync',
                success: confirmationResult.success,
                initialCount: initialAppointments.length,
                finalCount: updatedAppointments.length,
                changesApplied: confirmationResult.confirmed > 0,
                timestamp: new Date().toISOString()
            };
            
            this.testResults.push(syncTestResult);
            console.log('✅ Resultado de sincronización:', syncTestResult);
            
            return syncTestResult;
            
        } catch (error) {
            console.error('❌ Error en prueba de sincronización:', error);
            this.testResults.push({
                test: 'bidirectional_sync',
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            return { success: false, error: error.message };
        }
    }

    /**
     * Obtener citas desde SQL Server
     */
    async getAppointmentsFromSQL() {
        if (window.dbManager) {
            try {
                return await window.dbManager.getAppointments();
            } catch (error) {
                console.error('Error obteniendo citas:', error);
                return [];
            }
        }
        return [];
    }

    /**
     * Ejecutar todas las pruebas
     */
    async runAllTests() {
        console.log('🚀 Iniciando pruebas de confirmación bidireccional...');
        
        // Test 1: Confirmación de paciente
        await this.simulatePatientConfirmation();
        
        // Test 2: Cancelación de paciente
        await this.simulatePatientCancellation();
        
        // Test 3: Sincronización bidireccional
        await this.testBidirectionalSync();
        
        // Mostrar resultados
        this.displayTestResults();
        
        return this.testResults;
    }

    /**
     * Mostrar resultados de las pruebas
     */
    displayTestResults() {
        console.log('📊 RESULTADOS DE PRUEBAS:');
        console.log('============================');
        
        this.testResults.forEach((result, index) => {
            console.log(`\n${index + 1}. ${result.test}`);
            console.log(`   ✅ Éxito: ${result.success ? 'Sí' : 'No'}`);
            console.log(`   ⏰ Tiempo: ${result.timestamp}`);
            
            if (result.confirmed !== undefined) {
                console.log(`   📋 Confirmadas: ${result.confirmed}`);
                console.log(`   ❌ Canceladas: ${result.cancelled}`);
            }
            
            if (result.error) {
                console.log(`   ❌ Error: ${result.error}`);
            }
        });
        
        const totalTests = this.testResults.length;
        const successfulTests = this.testResults.filter(t => t.success).length;
        console.log(`\n📈 RESUMEN: ${successfulTests}/${totalTests} pruebas exitosas`);
    }

    /**
     * Obtener estado de conexión SQL Server
     */
    async getSQLConnectionStatus() {
        if (window.dbManager) {
            return window.dbManager.getConnectionStatus();
        }
        return { error: 'Database Manager no disponible' };
    }

    /**
     * Limpiar resultados de pruebas
     */
    clearTestResults() {
        this.testResults = [];
        console.log('🧹 Resultados de pruebas limpiados');
    }
}

// Inicializar test cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    window.confirmationTest = new ConfirmationTest();
    
    // Hacer funciones globales para testing en consola
    window.testConfirmation = () => confirmationTest.simulatePatientConfirmation();
    window.testCancellation = () => confirmationTest.simulatePatientCancellation();
    window.testSync = () => confirmationTest.testBidirectionalSync();
    window.runAllTests = () => confirmationTest.runAllTests();
    window.getTestResults = () => confirmationTest.testResults;
    window.clearTests = () => confirmationTest.clearTestResults();
    
    console.log('🧪 Script de pruebas cargado. Usa:');
    console.log('   testConfirmation() - Probar confirmación');
    console.log('   testCancellation() - Probar cancelación');
    console.log('   testSync() - Probar sincronización');
    console.log('   runAllTests() - Ejecutar todas las pruebas');
});

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfirmationTest;
}