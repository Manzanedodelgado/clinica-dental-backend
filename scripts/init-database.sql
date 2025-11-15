-- ================================================
-- ESQUEMA POSTGRESQL PARA RENDER.COM
-- Sistema de Gestión Dental - Rubio García Dental
-- ================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================
-- TABLA DE USUARIOS DEL SISTEMA
-- ================================================
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL DEFAULT 'Recepcionista',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- TABLA DE PACIENTES
-- ================================================
CREATE TABLE IF NOT EXISTS patients (
    patient_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    mobile_phone VARCHAR(20),
    email VARCHAR(255),
    birth_date DATE,
    gender VARCHAR(10),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(10),
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    medical_history TEXT,
    allergies TEXT,
    insurance_info TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- TABLA DE DOCTORES Y PERSONAL MÉDICO
-- ================================================
CREATE TABLE IF NOT EXISTS doctors (
    doctor_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    specialty VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    hire_date DATE,
    license_number VARCHAR(100),
    biography TEXT,
    education TEXT,
    certifications TEXT,
    languages VARCHAR(255),
    photo VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- TABLA DE TRATAMIENTOS
-- ================================================
CREATE TABLE IF NOT EXISTS treatments (
    treatment_id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    default_duration INTEGER DEFAULT 30, -- minutos
    default_price DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    creation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- TABLA DE CITAS/ANOTACIONES
-- ================================================
CREATE TABLE IF NOT EXISTS appointments (
    appointment_id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(patient_id),
    doctor_id INTEGER REFERENCES doctors(doctor_id),
    treatment_id INTEGER REFERENCES treatments(treatment_id),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration INTEGER DEFAULT 30,
    status_id INTEGER NOT NULL DEFAULT 0, -- 0=pendiente, 5=completada, 7=confirmada, 8=cancelada, 9=aceptada
    total_amount DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- CONFIGURACIÓN DE LA CLÍNICA
-- ================================================
CREATE TABLE IF NOT EXISTS clinic_settings (
    setting_id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- HORARIOS DE TRABAJO DE DOCTORES
-- ================================================
CREATE TABLE IF NOT EXISTS doctor_schedule (
    schedule_id SERIAL PRIMARY KEY,
    doctor_id INTEGER REFERENCES doctors(doctor_id),
    day_of_week INTEGER NOT NULL, -- 1=Lunes, 7=Domingo
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT
);

-- ================================================
-- CONVERSACIONES WHATSAPP
-- ================================================
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
    conversation_id SERIAL PRIMARY KEY,
    patient_phone VARCHAR(20) NOT NULL,
    patient_name VARCHAR(200),
    last_message_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    message_count INTEGER NOT NULL DEFAULT 1,
    conversation_started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_message_snippet VARCHAR(500),
    has_urgency_tag BOOLEAN NOT NULL DEFAULT false,
    tag_color VARCHAR(20) DEFAULT 'normal',
    tag_notes VARCHAR(500),
    tagged_by VARCHAR(100),
    tagged_at TIMESTAMP,
    last_read_at TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- MENSAJES WHATSAPP INDIVIDUALES
-- ================================================
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    message_id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES whatsapp_conversations(conversation_id),
    message_text TEXT,
    message_type VARCHAR(50) DEFAULT 'text',
    from_phone VARCHAR(20) NOT NULL,
    from_name VARCHAR(200),
    is_from_patient BOOLEAN NOT NULL DEFAULT true,
    message_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    has_media BOOLEAN NOT NULL DEFAULT false,
    media_url VARCHAR(500),
    media_caption VARCHAR(500),
    ai_processed BOOLEAN NOT NULL DEFAULT false,
    ai_auto_reply_sent BOOLEAN NOT NULL DEFAULT false,
    contains_emergency_keywords BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- CONFIGURACIÓN DEL AGENTE IA
-- ================================================
CREATE TABLE IF NOT EXISTS ai_configuration (
    config_id SERIAL PRIMARY KEY,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    is_active_outside_hours BOOLEAN NOT NULL DEFAULT true,
    working_hours_start TIME NOT NULL DEFAULT '10:00:00',
    working_hours_end TIME NOT NULL DEFAULT '20:00:00',
    working_days VARCHAR(100) NOT NULL DEFAULT '1,2,3,4,5',
    auto_response_enabled BOOLEAN NOT NULL DEFAULT true,
    emergency_keywords TEXT DEFAULT 'dolor,duele,urgen,emergencia,me duele,muy mal,grave,grave',
    auto_response_message TEXT DEFAULT 'Gracias por contactar con Rubio García Dental. Hemos recibido tu mensaje y te responderemos lo antes posible. Si es una emergencia, llama al 664218253.',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- LOG DE ETIQUETAS DE CONVERSACIÓN
-- ================================================
CREATE TABLE IF NOT EXISTS conversation_tags (
    tag_id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES whatsapp_conversations(conversation_id),
    tag_color VARCHAR(20) NOT NULL,
    tag_notes VARCHAR(500),
    tagged_by VARCHAR(100) NOT NULL,
    action_type VARCHAR(20) NOT NULL, -- 'tagged', 'untagged', 'updated'
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ================================================

-- Índices de conversaciones WhatsApp
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone ON whatsapp_conversations(patient_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_last_message ON whatsapp_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_active ON whatsapp_conversations(is_active, has_urgency_tag);

-- Índices de mensajes WhatsApp
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation ON whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(message_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_patient ON whatsapp_messages(from_phone);

-- Índices de citas
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status_id);

-- Índices de doctores
CREATE INDEX IF NOT EXISTS idx_doctors_active ON doctors(is_active);
CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON doctors(specialty);

-- ================================================
-- TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- ================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_treatments_updated_at BEFORE UPDATE ON treatments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clinic_settings_updated_at BEFORE UPDATE ON clinic_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON whatsapp_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_config_updated_at BEFORE UPDATE ON ai_configuration FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- DATOS INICIALES
-- ================================================

-- Configuración inicial de la clínica
INSERT INTO clinic_settings (setting_key, setting_value, description) VALUES
('CLINIC_NAME', 'Rubio García Dental', 'Nombre de la clínica'),
('CLINIC_PHONE', '916410841', 'Teléfono fijo de la clínica'),
('CLINIC_MOBILE', '664218253', 'Móvil/WhatsApp de la clínica'),
('CLINIC_EMAIL', 'info@rubiogarciadental.com', 'Email de contacto'),
('CLINIC_WEBSITE', 'www.rubiogarciadental.com', 'Sitio web oficial'),
('CLINIC_INSTAGRAM', '@rubiogarciadental', 'Instagram oficial'),
('WORKING_HOURS_MONDAY', '10:00-14:00,16:00-20:00', 'Horario lunes'),
('WORKING_HOURS_TUESDAY', '10:00-14:00,16:00-20:00', 'Horario martes'),
('WORKING_HOURS_WEDNESDAY', '10:00-14:00,16:00-20:00', 'Horario miércoles'),
('WORKING_HOURS_THURSDAY', '10:00-14:00,16:00-20:00', 'Horario jueves'),
('WORKING_HOURS_FRIDAY', '10:00-14:00', 'Horario viernes'),
('WORKING_HOURS_SATURDAY', 'closed', 'Horario sábados'),
('WORKING_HOURS_SUNDAY', 'closed', 'Horario domingos'),
('SPECIALTIES', 'Implantología, Cirugía oral, Endodoncia, Ortodoncia, Higiene dental, Blanqueamiento', 'Especialidades de la clínica')
ON CONFLICT (setting_key) DO NOTHING;

-- Personal médico inicial
INSERT INTO doctors (doctor_id, first_name, last_name, specialty, phone, email, is_active, hire_date, license_number, biography, education, certifications, languages, photo) VALUES
(3, 'Mario', 'Rubio García', 'Implantología, Cirugía oral', '916410841', 'mario.rubio@rubiogarciadental.com', true, '2020-01-15', '28007352', 
 'Director médico de Rubio García Dental. Especialista en implantología y cirugía oral con más de 10 años de experiencia. Graduado en Odontología por la Universidad Complutense de Madrid.', 
 'Grado en Odontología - Universidad Complutense de Madrid (2010)',
 'Especialista en Implantología Oral - Universidad de Sevilla, Certificación en Cirugía Oral Avanzada', 
 'Español (nativo), Inglés (avanzado)', 
 '/images/doctors/mario-rubio.jpg'),

(4, 'Irene', 'García Sanz', 'Endodoncia, Odontología general, Higiene dental, Tratamientos periodontales', '916410842', 'irene.garcia@rubiogarciadental.com', true, '2021-03-01', '280111085',
 'Especialista en endodoncia y odontología general. Experta en tratamientos de conducto, higiene dental y tratamientos periodontales. Deriva todo lo referente a dolores dentales y primeras visitas generales.', 
 'Grado en Odontología - Universidad Alfonso X el Sabio (2015)',
 'Máster en Endodoncia - Universidad Complutense de Madrid (2018)', 
 'Español (nativo), Inglés (intermedio)', 
 '/images/doctors/irene-garcia.jpg'),

(8, 'Virginia', 'Tresgallo Peña', 'Ortodoncia, Ortopedia dentofacial, Higiene dental', '916410843', 'virginia.tresgallo@rubiogarciadental.com', true, '2019-09-01', '28007397',
 'Especialista en ortodoncia y ortopedia dentofacial. Experta en tratamientos con brackets e Invisalign. Realiza también higienes dentales y recibe primeras visitas relativas a maloclusiones.', 
 'Grado en Odontología - Universidad de Barcelona (2012)',
 'Máster en Ortodoncia - Universidad Complutense de Madrid (2015)', 
 'Español (nativo), Inglés (intermedio)', 
 '/images/doctors/virginia-tresgallo.jpg'),

(12, 'Juan Antonio', 'Manzanedo', 'Higiene Dental, Blanqueamiento, Pruebas tratamientos, Registros estudios', '916410845', 'juan.manzanedo@rubiogarciadental.com', true, '2023-06-01', 'HI-12345',
 'Higienista dental especializado en profilaxis, educación en salud oral y prevención periodontal. Realiza blanqueamientos, pruebas de tratamientos de otros doctores, registros de estudios de ortodoncia e implantología. Viernes mañana: tareas administrativas, entrega de presupuestos y financiaciones.', 
 'Técnico Superior en Higiene Bucodental - IES Sanidad (2020)',
 'Curso de Especialización en Periodoncia Preventiva, Curso de Blanquemiento Dental', 
 'Español (nativo), Inglés (básico)', 
 '/images/doctors/juan-manzanedo.jpg')
ON CONFLICT (doctor_id) DO NOTHING;

-- Horarios de trabajo
INSERT INTO doctor_schedule (doctor_id, day_of_week, start_time, end_time, is_active, notes) VALUES
-- Lunes: Virginia (Ortodoncia + Higiene + Maloclusiones)
(8, 1, '10:00:00', '14:00:00', true, 'Ortodoncia e Higiene dental - Primeras maloclusiones'),
(8, 1, '16:00:00', '20:00:00', true, 'Ortodoncia e Higiene dental - Primeras maloclusiones'),

-- Martes: Irene (Endodoncia + General + Higiene + Periodontal)
(4, 2, '10:00:00', '14:00:00', true, 'Endodoncia y General + Higiene + Periodontales'),
(4, 2, '16:00:00', '20:00:00', true, 'Endodoncia y General + Higiene + Periodontales'),

-- Miércoles: Mario (Implantología + Cirugía + Ausencias)
(3, 3, '10:00:00', '14:00:00', true, 'Implantología y Cirugía - Primeras ausencias dentales'),
(3, 3, '16:00:00', '20:00:00', true, 'Implantología y Cirugía - Primeras ausencias dentales'),

-- Jueves: Juan Antonio (Higiene + Blanqueamiento + Pruebas + Registros)
(12, 4, '10:00:00', '14:00:00', true, 'Higiene + Blanqueamiento + Pruebas tratamientos + Registros estudios'),
(12, 4, '16:00:00', '20:00:00', true, 'Higiene + Blanqueamiento + Pruebas tratamientos + Registros estudios'),

-- Viernes: Juan Antonio (Administrativo)
(12, 5, '10:00:00', '14:00:00', true, 'Administrativo - Presupuestos y Financiaciones');

-- Configuración inicial de IA
INSERT INTO ai_configuration (is_enabled, is_active_outside_hours) 
VALUES (true, true);

-- ================================================
-- TRIGGERS PARA ACTUALIZAR CONVERSACIONES
-- ================================================

-- Función para actualizar conversación con nuevo mensaje
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE whatsapp_conversations
        SET 
            last_message_at = NEW.message_timestamp,
            message_count = message_count + 1,
            last_message_snippet = LEFT(NEW.message_text, 500)
        WHERE conversation_id = NEW.conversation_id;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_on_message_trigger
    AFTER INSERT ON whatsapp_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_on_message();

-- ================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ================================================

COMMENT ON TABLE whatsapp_conversations IS 'Conversaciones WhatsApp con sistema de codificación de urgencias (color naranja)';
COMMENT ON COLUMN whatsapp_conversations.has_urgency_tag IS 'True para conversaciones marcadas como urgentes (color naranja)';
COMMENT ON COLUMN whatsapp_conversations.tag_color IS 'Color del tag: normal, orange (urgente)';
COMMENT ON TABLE ai_configuration IS 'Configuración del agente IA para respuestas automáticas';
COMMENT ON TABLE conversation_tags IS 'Log de auditoría para acciones de etiquetado de conversaciones';

-- ================================================
-- COMANDOS DE LIMPIEZA Y MANTENIMIENTO
-- ================================================

-- Crear vista para conversaciones urgentes
CREATE OR REPLACE VIEW urgent_conversations AS
SELECT 
    c.conversation_id,
    c.patient_phone,
    c.patient_name,
    c.last_message_at,
    c.message_count,
    c.tag_notes,
    c.tagged_by,
    c.tagged_at
FROM whatsapp_conversations c
WHERE c.has_urgency_tag = true 
  AND c.is_active = true
ORDER BY c.tagged_at DESC;

-- Vista de estadísticas de conversaciones
CREATE OR REPLACE VIEW conversation_stats AS
SELECT 
    COUNT(*) as total_conversations,
    COUNT(CASE WHEN has_urgency_tag THEN 1 END) as urgent_conversations,
    COUNT(CASE WHEN last_message_at >= CURRENT_DATE - INTERVAL '24 hours' THEN 1 END) as last_24h_conversations,
    AVG(message_count) as avg_messages_per_conversation
FROM whatsapp_conversations
WHERE is_active = true;

-- Función para limpieza de datos antiguos
CREATE OR REPLACE FUNCTION cleanup_old_conversations()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    -- Marcar conversaciones inactivas como archivadas (más de 90 días sin actividad)
    UPDATE whatsapp_conversations
    SET is_active = false
    WHERE last_message_at < CURRENT_DATE - INTERVAL '90 days'
      AND is_active = true;
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

PRINT '✅ Esquema PostgreSQL creado correctamente para Rubio García Dental';
PRINT '✅ Sistema de conversaciones WhatsApp con codificación de urgencias implementado';
PRINT '✅ Configuración IA activa por defecto (fuera de horario)';
PRINT '✅ Personal médico y horarios configurados según especificaciones';
PRINT '✅ Índices y triggers optimizados para rendimiento';
PRINT '✅ Funciones de mantenimiento y estadísticas incluidas';