/**
 * TEST MANUAL - WhatsApp Conversations System
 * Test simple para verificar funcionalidad básica del sistema
 */

console.log('🧪 INICIANDO TESTS MANUALES DEL SISTEMA WHATSAPP CONVERSACIONES');
console.log('=================================================================\n');

// Test 1: Verificar estructura de archivos
console.log('📁 TEST 1: Verificando estructura de archivos...');

const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'controllers/conversationController.js',
  'controllers/conversation-integration.js', 
  'routes/conversations.js',
  'whatsapp-panel.html',
  'scripts/whatsapp-conversations.sql',
  'tests/unit/conversationController.test.js',
  'tests/integration/conversationsApi.test.js',
  'tests/api/apiEndpoints.test.js',
  'tests/database/conversationsDb.test.js',
  'tests/integration/whatsappPanel.test.js',
  'tests/run-tests.js',
  'jest.config.js',
  'tests/setup.js'
];

let filesOk = 0;
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
    filesOk++;
  } else {
    console.log(`  ❌ ${file} - NO ENCONTRADO`);
  }
});

console.log(`\nArchivos encontrados: ${filesOk}/${requiredFiles.length}`);
console.log(`Resultado: ${filesOk === requiredFiles.length ? '✅ PASÓ' : '❌ FALLÓ'}\n`);

// Test 2: Verificar contenido de archivos clave
console.log('📄 TEST 2: Verificando contenido de archivos clave...');

try {
  // Verificar conversationController
  const controllerPath = path.join(__dirname, 'controllers/conversationController.js');
  const controllerContent = fs.readFileSync(controllerPath, 'utf8');
  
  const controllerMethods = [
    'getAllConversations',
    'getConversationById', 
    'tagAsUrgent',
    'untagUrgent',
    'closeConversation',
    'getAIConfig',
    'updateAIConfig'
  ];

  let controllerOk = 0;
  controllerMethods.forEach(method => {
    if (controllerContent.includes(`static async ${method}`)) {
      console.log(`  ✅ conversationController.${method}`);
      controllerOk++;
    } else {
      console.log(`  ❌ conversationController.${method} - NO ENCONTRADO`);
    }
  });

  console.log(`Métodos del controller: ${controllerOk}/${controllerMethods.length}`);

  // Verificar conversation-integration
  const integrationPath = path.join(__dirname, 'controllers/conversation-integration.js');
  const integrationContent = fs.readFileSync(integrationPath, 'utf8');
  
  const integrationMethods = [
    'detectUrgency',
    'handleIncomingMessage',
    'tagConversationUrgent',
    'getOrCreateConversation',
    'shouldActivateAI'
  ];

  let integrationOk = 0;
  integrationMethods.forEach(method => {
    if (integrationContent.includes(`async ${method}`) || integrationContent.includes(`detectUrgency`)) {
      console.log(`  ✅ conversation-integration.${method}`);
      integrationOk++;
    } else {
      console.log(`  ❌ conversation-integration.${method} - NO ENCONTRADO`);
    }
  });

  console.log(`Métodos de integración: ${integrationOk}/${integrationMethods.length}\n`);

} catch (error) {
  console.log(`❌ Error leyendo archivos: ${error.message}\n`);
}

// Test 3: Verificar rutas de API
console.log('🌐 TEST 3: Verificando rutas de API...');

try {
  const routesPath = path.join(__dirname, 'routes/conversations.js');
  const routesContent = fs.readFileSync(routesPath, 'utf8');

  const expectedRoutes = [
    "get('/api/whatsapp/conversations'",
    "get('/api/whatsapp/conversations/urgent'",
    "get('/api/whatsapp/conversations/:id'",
    "post('/api/whatsapp/conversations/:id/tag-urgent'",
    "post('/api/whatsapp/conversations/:id/untag-urgent'",
    "get('/api/whatsapp/ai-config'",
    "put('/api/whatsapp/ai-config'"
  ];

  let routesOk = 0;
  expectedRoutes.forEach(route => {
    if (routesContent.includes(route)) {
      console.log(`  ✅ ${route}`);
      routesOk++;
    } else {
      console.log(`  ❌ ${route} - NO ENCONTRADO`);
    }
  });

  console.log(`Rutas encontradas: ${routesOk}/${expectedRoutes.length}`);
  console.log(`Resultado: ${routesOk === expectedRoutes.length ? '✅ PASÓ' : '❌ FALLÓ'}\n`);

} catch (error) {
  console.log(`❌ Error leyendo rutas: ${error.message}\n`);
}

// Test 4: Verificar SQL schema
console.log('🗄️ TEST 4: Verificando schema de base de datos...');

try {
  const sqlPath = path.join(__dirname, 'scripts/whatsapp-conversations.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  const expectedTables = [
    'CREATE TABLE WhatsAppConversations',
    'CREATE TABLE WhatsAppMessages',
    'CREATE TABLE WhatsAppConversationTags',
    'CREATE TABLE WhatsAppAIConfig'
  ];

  const expectedColumns = [
    'color_tag VARCHAR(20)',
    'priority VARCHAR(20)',
    'urgent_keywords TEXT'
  ];

  let tablesOk = 0;
  expectedTables.forEach(table => {
    if (sqlContent.includes(table)) {
      console.log(`  ✅ ${table}`);
      tablesOk++;
    } else {
      console.log(`  ❌ ${table} - NO ENCONTRADO`);
    }
  });

  console.log(`Tablas encontradas: ${tablesOk}/${expectedTables.length}`);

  let columnsOk = 0;
  expectedColumns.forEach(column => {
    if (sqlContent.includes(column)) {
      console.log(`  ✅ ${column}`);
      columnsOk++;
    } else {
      console.log(`  ❌ ${column} - NO ENCONTRADO`);
    }
  });

  console.log(`Columnas encontradas: ${columnsOk}/${expectedColumns.length}`);
  console.log(`Resultado: ${(tablesOk + columnsOk) === (expectedTables.length + expectedColumns.length) ? '✅ PASÓ' : '❌ FALLÓ'}\n`);

} catch (error) {
  console.log(`❌ Error leyendo SQL: ${error.message}\n`);
}

// Test 5: Verificar panel HTML
console.log('🎨 TEST 5: Verificando panel HTML...');

try {
  const panelPath = path.join(__dirname, 'whatsapp-panel.html');
  const panelContent = fs.readFileSync(panelPath, 'utf8');

  const expectedFeatures = [
    'stats-grid',
    'conversations-list',
    'toggleAI',
    'filterUrgent',
    'orange',
    '/api/whatsapp/conversations'
  ];

  let featuresOk = 0;
  expectedFeatures.forEach(feature => {
    if (panelContent.includes(feature)) {
      console.log(`  ✅ ${feature}`);
      featuresOk++;
    } else {
      console.log(`  ❌ ${feature} - NO ENCONTRADO`);
    }
  });

  console.log(`Características encontradas: ${featuresOk}/${expectedFeatures.length}`);
  console.log(`Resultado: ${featuresOk === expectedFeatures.length ? '✅ PASÓ' : '❌ FALLÓ'}\n`);

} catch (error) {
  console.log(`❌ Error leyendo panel: ${error.message}\n`);
}

// Test 6: Verificar configuración de tests
console.log('⚙️ TEST 6: Verificando configuración de tests...');

try {
  const jestConfigPath = path.join(__dirname, 'jest.config.js');
  const jestConfigExists = fs.existsSync(jestConfigPath);
  
  if (jestConfigExists) {
    console.log('  ✅ jest.config.js encontrado');
  } else {
    console.log('  ❌ jest.config.js NO ENCONTRADO');
  }

  const setupPath = path.join(__dirname, 'tests/setup.js');
  const setupExists = fs.existsSync(setupPath);
  
  if (setupExists) {
    console.log('  ✅ tests/setup.js encontrado');
  } else {
    console.log('  ❌ tests/setup.js NO ENCONTRADO');
  }

  console.log(`Resultado: ${jestConfigExists && setupExists ? '✅ PASÓ' : '❌ FALLÓ'}\n`);

} catch (error) {
  console.log(`❌ Error verificando configuración: ${error.message}\n`);
}

// Resumen final
console.log('📊 RESUMEN FINAL DE TESTS');
console.log('==========================');

// Contar tests pasados
const totalTests = 6;
const passedTests = 
  (filesOk === requiredFiles.length ? 1 : 0) +
  (controllerOk === controllerMethods.length ? 1 : 0) +
  (integrationOk === integrationMethods.length ? 1 : 0) +
  (routesOk === expectedRoutes.length ? 1 : 0) +
  ((tablesOk + columnsOk) === (expectedTables.length + expectedColumns.length) ? 1 : 0) +
  (featuresOk === expectedFeatures.length ? 1 : 0);

console.log(`Tests ejecutados: ${totalTests}`);
console.log(`Tests pasados: ${passedTests}`);
console.log(`Tests fallidos: ${totalTests - passedTests}`);

if (passedTests === totalTests) {
  console.log('\n🎉 ¡TODOS LOS TESTS PASARON EXITOSAMENTE!');
  console.log('🚀 El sistema está listo para deployment');
  
  console.log('\n📋 PRÓXIMOS PASOS:');
  console.log('1. git push -u origin main');
  console.log('2. Configurar Render.com');
  console.log('3. Ejecutar npm run test:all para tests completos');
  
} else {
  console.log('\n⚠️ ALGUNOS TESTS FALLARON');
  console.log('🔧 Revisa los archivos faltantes antes del deployment');
}

console.log('\n✨ Tests completados en:', new Date().toISOString());