-- ================================================
-- DATOS INICIALES DEL PERSONAL MÉDICO
-- Rubio García Dental - HORARIOS CORREGIDOS
-- ================================================

-- Insertar doctores y personal médico
INSERT INTO DDoctors (DoctorID, FirstName, LastName, Specialty, Phone, Email, IsActive, HireDate, LicenseNumber, Biography, Education, Certifications, Languages, Photo, CreatedAt, UpdatedAt) VALUES

-- Director de la clínica
(3, 'Mario', 'Rubio García', 'Implantología, Cirugía oral', '916410841', 'mario.rubio@rubiogarciadental.com', 1, '2020-01-15', '28007352', 
'Director médico de Rubio García Dental. Especialista en implantología y cirugía oral con más de 10 años de experiencia. Graduado en Odontología por la Universidad Complutense de Madrid.', 
'Grado en Odontología - Universidad Complutense de Madrid (2010)',
'Especialista en Implantología Oral - Universidad de Sevilla, Certificación en Cirugía Oral Avanzada', 
'Español (nativo), Inglés (avanzado)', 
'/images/doctors/mario-rubio.jpg', GETDATE(), GETDATE()),

-- Doctores especialistas
(4, 'Irene', 'García Sanz', 'Endodoncia, Odontología general, Higiene dental, Tratamientos periodontales', '916410842', 'irene.garcia@rubiogarciadental.com', 1, '2021-03-01', '280111085',
'Especialista en endodoncia y odontología general. Experta en tratamientos de conducto, higiene dental y tratamientos periodontales. Deriva todo lo referente a dolores dentales y primeras visitas generales.', 
'Grado en Odontología - Universidad Alfonso X el Sabio (2015)',
'Máster en Endodoncia - Universidad Complutense de Madrid (2018)', 
'Español (nativo), Inglés (intermedio)', 
'/images/doctors/irene-garcia.jpg', GETDATE(), GETDATE()),

(8, 'Virginia', 'Tresgallo Peña', 'Ortodoncia, Ortopedia dentofacial, Higiene dental', '916410843', 'virginia.tresgallo@rubiogarciadental.com', 1, '2019-09-01', '28007397',
'Especialista en ortodoncia y ortopedia dentofacial. Experta en tratamientos con brackets e Invisalign. Realiza también higienes dentales y recibe primeras visitas relativas a maloclusiones.', 
'Grado en Odontología - Universidad de Barcelona (2012)',
'Máster en Ortodoncia - Universidad Complutense de Madrid (2015)', 
'Español (nativo), Inglés (intermedio)', 
'/images/doctors/virginia-tresgallo.jpg', GETDATE(), GETDATE()),

-- Higienista Dental
(12, 'Juan Antonio', 'Manzanedo', 'Higiene Dental, Blanqueamiento, Pruebas tratamientos, Registros estudios', '916410845', 'juan.manzanedo@rubiogarciadental.com', 1, '2023-06-01', 'HI-12345',
'Higienista dental especializado en profilaxis, educación en salud oral y prevención periodontal. Realiza blanqueamientos, pruebas de tratamientos de otros doctores, registros de estudios de ortodoncia e implantología. Viernes mañana: tareas administrativas, entrega de presupuestos y financiaciones.', 
'Técnico Superior en Higiene Bucodental - IES Sanidad (2020)',
'Curso de Especialización en Periodoncia Preventiva, Curso de Blanquemiento Dental', 
'Español (nativo), Inglés (básico)', 
'/images/doctors/juan-manzanedo.jpg', GETDATE(), GETDATE());

-- ================================================
-- HORARIOS DE TRABAJO - RUBIO GARCÍA DENTAL
-- ================================================

-- Horarios de atención de la clínica (configuración general)
INSERT INTO ClinicSettings (SettingKey, SettingValue, Description) VALUES
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
('SPECIALTIES', 'Implantología, Cirugía oral, Endodoncia, Ortodoncia, Higiene dental, Blanqueamiento', 'Especialidades de la clínica');

-- ================================================
-- HORARIOS INDIVIDUALES POR DOCTOR (CORREGIDOS)
-- ================================================

-- Limpiar horarios existentes
DELETE FROM DoctorSchedule;

-- Horarios de Dra. Virginia Tresgallo - LUNES
-- Ortodoncista + Higienes dentales + Primeras maloclusiones
INSERT INTO DoctorSchedule (DoctorID, DayOfWeek, StartTime, EndTime, IsActive, Notes) VALUES
(8, 1, '10:00', '14:00', 1, 'Ortodoncia e Higiene dental - Primeras maloclusiones'),
(8, 1, '16:00', '20:00', 1, 'Ortodoncia e Higiene dental - Primeras maloclusiones');

-- Horarios de Dra. Irene García - MARTES  
-- Endodoncista y General + Higienes + Periodontales + Dolores + Primeras generales
INSERT INTO DoctorSchedule (DoctorID, DayOfWeek, StartTime, EndTime, IsActive, Notes) VALUES
(4, 2, '10:00', '14:00', 1, 'Endodoncia y General + Higiene + Periodontales'),
(4, 2, '16:00', '20:00', 1, 'Endodoncia y General + Higiene + Periodontales');

-- Horarios de Dr. Mario Rubio - MIÉRCOLES
-- Implantología y cirugías + Primeras ausencias dentales
INSERT INTO DoctorSchedule (DoctorID, DayOfWeek, StartTime, EndTime, IsActive, Notes) VALUES
(3, 3, '10:00', '14:00', 1, 'Implantología y Cirugía - Primeras ausencias dentales'),
(3, 3, '16:00', '20:00', 1, 'Implantología y Cirugía - Primeras ausencias dentales');

-- Horarios de Juan Antonio Manzanedo - JUEVES
-- Higienes + Blanqueamiento + Pruebas tratamientos + Registros estudios
INSERT INTO DoctorSchedule (DoctorID, DayOfWeek, StartTime, EndTime, IsActive, Notes) VALUES
(12, 4, '10:00', '14:00', 1, 'Higiene + Blanqueamiento + Pruebas tratamientos + Registros estudios'),
(12, 4, '16:00', '20:00', 1, 'Higiene + Blanqueamiento + Pruebas tratamientos + Registros estudios');

-- Horarios de Juan Antonio Manzanedo - VIERNES (ADMINISTRATIVO)
-- Tareas administrativas, presupuestos, financiaciones
INSERT INTO DoctorSchedule (DoctorID, DayOfWeek, StartTime, EndTime, IsActive, Notes) VALUES
(12, 5, '10:00', '14:00', 1, 'Administrativo - Presupuestos y Financiaciones');

PRINT '✅ Datos del personal médico insertados correctamente en Rubio García Dental';
PRINT '✅ Horarios corregidos según especialidades:';
PRINT '  - Lunes: Virginia (Ortodoncia + Higiene + Maloclusiones)';
PRINT '  - Martes: Irene (Endodoncia + General + Higiene + Periodontal)';
PRINT '  - Miércoles: Mario (Implantología + Cirugía + Ausencias)';
PRINT '  - Jueves: Juan Antonio (Higiene + Blanqueamiento + Pruebas + Registros)';
PRINT '  - Viernes: Juan Antonio (Administrativo - Presupuestos y Financiación)';
PRINT '✅ Juan Antonio Manzanedo configurado como Higienista Dental completo';