/**
 * CONFIGURACIÓN DE TESTS - WhatsApp Conversations System
 * Script para ejecutar todos los tests del sistema
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class TestRunner {
  constructor() {
    this.testDir = path.join(__dirname, '../');
    this.reportsDir = path.join(__dirname, '../test-reports');
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async createTestReportsDirectory() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
      this.log('✅ Directorio de reportes creado', 'green');
    }
  }

  async checkDependencies() {
    this.log('\n🔍 Verificando dependencias de testing...', 'cyan');
    
    const requiredPackages = [
      'jest',
      'supertest',
      '@types/jest',
      'jest-environment-node'
    ];

    try {
      for (const pkg of requiredPackages) {
        execSync(`npm list ${pkg}`, { stdio: 'pipe' });
        this.log(`✅ ${pkg} instalado`, 'green');
      }
      return true;
    } catch (error) {
      this.log(`❌ Error: Algunas dependencias no están instaladas`, 'red');
      this.log('Ejecuta: npm install --save-dev jest supertest @types/jest', 'yellow');
      return false;
    }
  }

  async runUnitTests() {
    this.log('\n🧪 Ejecutando tests unitarios...', 'cyan');
    
    try {
      const result = execSync(
        'npx jest tests/unit --coverage --coverageDirectory=test-reports/unit --coverageReporters=html --coverageReporters=json',
        { 
          encoding: 'utf8',
          stdio: 'pipe'
        }
      );
      
      this.log('✅ Tests unitarios completados exitosamente', 'green');
      this.log(result, 'green');
      return true;
    } catch (error) {
      this.log('❌ Tests unitarios fallaron', 'red');
      this.log(error.stdout || error.message, 'red');
      return false;
    }
  }

  async runIntegrationTests() {
    this.log('\n🔗 Ejecutando tests de integración...', 'cyan');
    
    try {
      const result = execSync(
        'npx jest tests/integration --coverage --coverageDirectory=test-reports/integration --coverageReporters=html --coverageReporters=json',
        { 
          encoding: 'utf8',
          stdio: 'pipe'
        }
      );
      
      this.log('✅ Tests de integración completados exitosamente', 'green');
      this.log(result, 'green');
      return true;
    } catch (error) {
      this.log('❌ Tests de integración fallaron', 'red');
      this.log(error.stdout || error.message, 'red');
      return false;
    }
  }

  async runApiTests() {
    this.log('\n🌐 Ejecutando tests de API...', 'cyan');
    
    try {
      const result = execSync(
        'npx jest tests/api --coverage --coverageDirectory=test-reports/api --coverageReporters=html --coverageReporters=json',
        { 
          encoding: 'utf8',
          stdio: 'pipe'
        }
      );
      
      this.log('✅ Tests de API completados exitosamente', 'green');
      this.log(result, 'green');
      return true;
    } catch (error) {
      this.log('❌ Tests de API fallaron', 'red');
      this.log(error.stdout || error.message, 'red');
      return false;
    }
  }

  async runDatabaseTests() {
    this.log('\n🗄️ Ejecutando tests de base de datos...', 'cyan');
    
    try {
      const result = execSync(
        'npx jest tests/database --coverage --coverageDirectory=test-reports/database --coverageReporters=html --coverageReporters=json',
        { 
          encoding: 'utf8',
          stdio: 'pipe'
        }
      );
      
      this.log('✅ Tests de base de datos completados exitosamente', 'green');
      this.log(result, 'green');
      return true;
    } catch (error) {
      this.log('❌ Tests de base de datos fallaron', 'red');
      this.log(error.stdout || error.message, 'red');
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 INICIANDO SUITE COMPLETA DE TESTS', 'bright');
    this.log('========================================\n', 'bright');

    const startTime = Date.now();

    // Crear directorio de reportes
    await this.createTestReportsDirectory();

    // Verificar dependencias
    const depsOk = await this.checkDependencies();
    if (!depsOk) {
      process.exit(1);
    }

    // Resultados de tests
    const results = {
      unit: false,
      integration: false,
      api: false,
      database: false
    };

    // Ejecutar tests en secuencia
    try {
      results.unit = await this.runUnitTests();
      results.integration = await this.runIntegrationTests();
      results.api = await this.runApiTests();
      results.database = await this.runDatabaseTests();
    } catch (error) {
      this.log(`❌ Error durante la ejecución de tests: ${error.message}`, 'red');
    }

    // Generar reporte final
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    this.generateTestReport(results, duration);
  }

  generateTestReport(results, duration) {
    this.log('\n📊 REPORTE FINAL DE TESTS', 'bright');
    this.log('========================================', 'bright');

    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(r => r).length;
    const failedTests = totalTests - passedTests;

    this.log(`⏱️  Duración total: ${duration} segundos`, 'cyan');
    this.log(`📋 Tests ejecutados: ${totalTests}`, 'cyan');
    this.log(`✅ Tests exitosos: ${passedTests}`, 'green');
    this.log(`❌ Tests fallidos: ${failedTests}`, 'red');

    // Detalle por categoría
    this.log('\n📁 Detalle por categoría:', 'magenta');
    Object.entries(results).forEach(([category, success]) => {
      const status = success ? '✅' : '❌';
      const color = success ? 'green' : 'red';
      this.log(`  ${status} Tests ${category.toUpperCase()}`, color);
    });

    // Cobertura
    this.log('\n📈 Reportes de cobertura generados:', 'cyan');
    const coverageFiles = [
      'test-reports/unit/coverage-summary.json',
      'test-reports/integration/coverage-summary.json',
      'test-reports/api/coverage-summary.json',
      'test-reports/database/coverage-summary.json'
    ];

    coverageFiles.forEach(file => {
      if (fs.existsSync(file)) {
        this.log(`  ✅ ${file}`, 'green');
      }
    });

    // HTML Reports
    this.log('\n🌐 Reportes HTML disponibles:', 'cyan');
    const htmlReports = [
      'test-reports/unit/coverage/index.html',
      'test-reports/integration/coverage/index.html',
      'test-reports/api/coverage/index.html',
      'test-reports/database/coverage/index.html'
    ];

    htmlReports.forEach(file => {
      if (fs.existsSync(file)) {
        this.log(`  📄 ${file}`, 'blue');
      }
    });

    // Resultado final
    this.log('\n🎯 RESULTADO FINAL:', 'bright');
    if (failedTests === 0) {
      this.log('✅ TODOS LOS TESTS PASARON EXITOSAMENTE', 'green');
      this.log('🚀 Sistema listo para deployment', 'green');
    } else {
      this.log('❌ ALGUNOS TESTS FALLARON', 'red');
      this.log('🔧 Revisa los errores antes del deployment', 'yellow');
      process.exit(1);
    }

    this.log('\n📝 Para ver detalles específicos:', 'cyan');
    this.log('  - coverage-summary.json: Resumen de cobertura');
    this.log('  - index.html: Reporte detallado en navegador');
    this.log('  - Ver logs de consola para errores específicos\n', 'cyan');
  }

  async runSpecificTest(category) {
    this.log(`🎯 Ejecutando tests específicos: ${category.toUpperCase()}`, 'bright');
    
    switch (category.toLowerCase()) {
      case 'unit':
        await this.runUnitTests();
        break;
      case 'integration':
        await this.runIntegrationTests();
        break;
      case 'api':
        await this.runApiTests();
        break;
      case 'database':
        await this.runDatabaseTests();
        break;
      default:
        this.log(`❌ Categoría '${category}' no reconocida`, 'red');
        this.log('Categorías disponibles: unit, integration, api, database', 'yellow');
    }
  }
}

// CLI Interface
if (require.main === module) {
  const runner = new TestRunner();
  const args = process.argv.slice(2);

  if (args.length === 0) {
    runner.runAllTests();
  } else if (args[0] === '--category' && args[1]) {
    runner.runSpecificTest(args[1]);
  } else if (args[0] === '--help') {
    console.log(`
🧪 Test Runner - WhatsApp Conversations System

Uso:
  node run-tests.js                    # Ejecutar todos los tests
  node run-tests.js --category unit    # Ejecutar tests específicos
  node run-tests.js --help             # Mostrar esta ayuda

Categorías disponibles:
  - unit: Tests unitarios (controllers, utilities)
  - integration: Tests de integración (API, componentes)
  - api: Tests de endpoints de API
  - database: Tests de base de datos y schema

Reportes generados en:
  - test-reports/[category]/coverage/
    - coverage-summary.json
    - index.html (reporte detallado)
`);
  } else {
    this.log('❌ Argumento no reconocido. Usa --help para ver ayuda.', 'red');
  }
}

module.exports = TestRunner;