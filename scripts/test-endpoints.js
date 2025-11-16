#!/usr/bin/env node

/**
 * Script de Verificación de Endpoints
 * Sistema de Gestión Dental - Clínica Rubio García
 * 
 * Verifica que todos los endpoints del backend estén funcionando correctamente
 */

const axios = require('axios');
require('dotenv').config();

// Colores para la consola
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

class APIEndpointTester {
    constructor() {
        this.baseURL = process.env.API_BASE_URL || 'http://localhost:3000/api';
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
    }

    log(message, color = colors.reset) {
        console.log(color + message + colors.reset);
    }

    logTest(testName, status, responseTime = null, error = null) {
        this.totalTests++;
        if (status === 'PASS') {
            this.passedTests++;
            this.log(`✅ ${testName} - ${responseTime ? `(${responseTime}ms)` : ''}`, colors.green);
        } else {
            this.log(`❌ ${testName} - ${error}`, colors.red);
        }
        
        this.testResults.push({
            test: testName,
            status,
            responseTime,
            error
        });
    }

    async testEndpoint(method, endpoint, data = null, expectedStatus = [200, 201]) {
        const startTime = Date.now();
        
        try {
            const config = {
                method: method.toLowerCase(),
                url: `${this.baseURL}${endpoint}`,
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            if (data) {
                config.data = data;
            }

            const response = await axios(config);
            const responseTime = Date.now() - startTime;
            
            const statusCode = response.status;
            const isValid = expectedStatus.includes(statusCode) || 
                          (Array.isArray(expectedStatus) && expectedStatus.includes(statusCode));

            if (isValid) {
                this.logTest(endpoint, 'PASS', responseTime);
            } else {
                this.logTest(endpoint, 'FAIL', responseTime, `Status ${statusCode}`);
            }

            return { success: true, response: response.data, statusCode, responseTime };

        } catch (error) {
            const responseTime = Date.now() - startTime;
            const errorMessage = error.response?.status 
                ? `Status ${error.response.status}` 
                : error.message;
            
            this.logTest(endpoint, 'FAIL', responseTime, errorMessage);
            return { success: false, error: error.message, statusCode: error.response?.status };
        }
    }

    async testHealth() {
        this.log('\n🏥 Verificando Salud del Sistema', colors.cyan);
        await this.testEndpoint('GET', '/system/health');
        await this.testEndpoint('GET', '/system/status');
        await this.testEndpoint('GET', '/system/database');
    }

    async testAuthentication() {
        this.log('\n🔐 Verificando Autenticación', colors.cyan);
        
        // Test login
        const loginResult = await this.testEndpoint('POST', '/auth/login', {
            username: 'JMD',
            password: '190582'
        });

        let token = null;
        if (loginResult.success && loginResult.response.data?.token) {
            token = loginResult.response.data.token;
            
            // Configurar axios global para usar el token
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            this.log('Token JWT obtenido correctamente', colors.green);
            
            // Test protected endpoint
            await this.testEndpoint('GET', '/auth/me');
        } else {
            this.log('⚠️ No se pudo obtener token JWT - endpoints protegidos fallarán', colors.yellow);
        }
    }

    async testAppointments() {
        this.log('\n📅 Verificando Citas', colors.cyan);
        await this.testEndpoint('GET', '/appointments');
        await this.testEndpoint('GET', '/appointments/1');
        await this.testEndpoint('GET', '/appointments/status/0'); // Planificadas
        await this.testEndpoint('GET', '/appointments/today');
        await this.testEndpoint('GET', '/appointments/week');
    }

    async testPatients() {
        this.log('\n👥 Verificando Pacientes', colors.cyan);
        await this.testEndpoint('GET', '/patients');
        await this.testEndpoint('GET', '/patients/1');
        await this.testEndpoint('GET', '/patients/search', null, [200]);
    }

    async testDoctors() {
        this.log('\n👨‍⚕️ Verificando Doctores', colors.cyan);
        await this.testEndpoint('GET', '/doctors');
        await this.testEndpoint('GET', '/doctors/specialties');
        await this.testEndpoint('GET', '/doctors/availability');
    }

    async testWhatsApp() {
        this.log('\n📱 Verificando WhatsApp', colors.cyan);
        await this.testEndpoint('GET', '/whatsapp/status');
        await this.testEndpoint('GET', '/whatsapp/conversations');
        await this.testEndpoint('GET', '/whatsapp/connection-status');
    }

    async testInvoices() {
        this.log('\n🧾 Verificando Facturas', colors.cyan);
        await this.testEndpoint('GET', '/invoices');
        await this.testEndpoint('GET', '/invoices/pending-verifactu');
        await this.testEndpoint('GET', '/invoices/templates');
    }

    async testAccounting() {
        this.log('\n💰 Verificando Contabilidad', colors.cyan);
        await this.testEndpoint('GET', '/accounting/dashboard');
        await this.testEndpoint('GET', '/accounting/profit-loss');
        await this.testEndpoint('GET', '/accounting/cash-flow');
        await this.testEndpoint('GET', '/accounting/expenses');
    }

    async testAutomation() {
        this.log('\n🤖 Verificando Automatizaciones', colors.cyan);
        await this.testEndpoint('GET', '/automation/queue');
        await this.testEndpoint('GET', '/automation/templates');
        await this.testEndpoint('GET', '/automation/settings');
    }

    async testLegal() {
        this.log('\n⚖️ Verificando Compliance LOPD/RGPD', colors.cyan);
        await this.testEndpoint('GET', '/legal/consents');
        await this.testEndpoint('GET', '/legal/audit-log');
        await this.testEndpoint('GET', '/legal/data-requests');
    }

    async testCreateAppointment() {
        this.log('\n➕ Verificando Creación de Cita', colors.cyan);
        
        const appointmentData = {
            patientId: 1,
            doctorId: 3,
            appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Mañana
            appointmentTime: '10:00',
            duration: 30,
            treatmentId: 1,
            notes: 'Cita de prueba automatizada'
        };

        await this.testEndpoint('POST', '/appointments', appointmentData);
    }

    async generateReport() {
        const successRate = ((this.passedTests / this.totalTests) * 100).toFixed(1);
        
        this.log('\n📊 REPORTE DE VERIFICACIÓN', colors.bright + colors.cyan);
        this.log('=' .repeat(50));
        this.log(`Total de tests: ${this.totalTests}`);
        this.log(`Tests exitosos: ${this.passedTests}`);
        this.log(`Tests fallidos: ${this.totalTests - this.passedTests}`);
        this.log(`Tasa de éxito: ${successRate}%`);
        
        if (this.testResults.length > 0) {
            this.log('\n❌ Tests Fallidos:', colors.red);
            this.testResults
                .filter(result => result.status === 'FAIL')
                .forEach(result => {
                    this.log(`   • ${result.test} - ${result.error}`);
                });
        }

        this.log('\n' + '=' .repeat(50));
        
        if (successRate >= 80) {
            this.log('🎉 ¡Sistema funcionando correctamente!', colors.green);
        } else if (successRate >= 60) {
            this.log('⚠️ Sistema parcialmente funcional - revisar errores', colors.yellow);
        } else {
            this.log('❌ Sistema con problemas críticos', colors.red);
        }

        return {
            total: this.totalTests,
            passed: this.passedTests,
            failed: this.totalTests - this.passedTests,
            successRate: parseFloat(successRate)
        };
    }

    async runAllTests() {
        this.log('🚀 Iniciando Verificación Completa de Endpoints', colors.bright + colors.green);
        this.log('URL Base:', this.baseURL, colors.cyan);
        this.log('Timestamp:', new Date().toISOString(), colors.cyan);
        
        try {
            await this.testHealth();
            await this.testAuthentication();
            await this.testAppointments();
            await this.testPatients();
            await this.testDoctors();
            await this.testWhatsApp();
            await this.testInvoices();
            await this.testAccounting();
            await this.testAutomation();
            await this.testLegal();
            await this.testCreateAppointment();
            
            return await this.generateReport();
            
        } catch (error) {
            this.log('Error ejecutando tests:', error.message, colors.red);
            throw error;
        }
    }
}

// Función principal
async function main() {
    const tester = new APIEndpointTester();
    
    try {
        const report = await tester.runAllTests();
        
        // Guardar reporte en archivo
        const fs = require('fs');
        const reportData = {
            timestamp: new Date().toISOString(),
            baseURL: tester.baseURL,
            ...report,
            details: tester.testResults
        };
        
        fs.writeFileSync(
            './test-results.json', 
            JSON.stringify(reportData, null, 2)
        );
        
        process.exit(report.successRate >= 80 ? 0 : 1);
        
    } catch (error) {
        console.error('Error durante la verificación:', error);
        process.exit(1);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    main();
}

module.exports = APIEndpointTester;