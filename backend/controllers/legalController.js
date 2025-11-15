/**
 * Controlador de Documentos Legales y LOPD
 * Sistema de Gestión Dental - Rubio García Dental
 */

const { dbConfig, SQL_QUERIES } = require('../config/database');

class LegalController {
    /**
     * Crear/registrar documento legal
     */
    static async createLegalDocument(req, res) {
        try {
            const {
                patientId,
                appointmentId = null,
                documentType,
                documentContent,
                accepted,
                acceptedAt = null,
                version = '1.0'
            } = req.body;

            // Verificar que el paciente existe
            const patientCheck = await dbConfig.query(
                'SELECT PatientID FROM DPatients WHERE PatientID = @patientId',
                [{ name: 'patientId', value: patientId }]
            );

            if (patientCheck.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Paciente no encontrado',
                    code: 'PATIENT_NOT_FOUND'
                });
            }

            // Verificar que la cita existe si se proporciona
            if (appointmentId) {
                const appointmentCheck = await dbConfig.query(
                    'SELECT CitaID FROM DCitas WHERE CitaID = @appointmentId',
                    [{ name: 'appointmentId', value: appointmentId }]
                );

                if (appointmentCheck.recordset.length === 0) {
                    return res.status(404).json({
                        success: false,
                        error: 'Cita no encontrada',
                        code: 'APPOINTMENT_NOT_FOUND'
                    });
                }
            }

            // Obtener información del cliente para IP y User-Agent
            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.get('User-Agent');

            const result = await dbConfig.query(SQL_QUERIES.CREATE_LEGAL_DOCUMENT, [
                { name: 'patientId', value: patientId },
                { name: 'appointmentId', value: appointmentId },
                { name: 'documentType', value: documentType },
                { name: 'documentContent', value: documentContent },
                { name: 'accepted', value: accepted },
                { name: 'acceptedAt', value: acceptedAt },
                { name: 'ipAddress', value: ipAddress },
                { name: 'userAgent', value: userAgent },
                { name: 'version', value: version }
            ]);

            const newDocumentId = result.recordset[0].DocumentID;

            res.status(201).json({
                success: true,
                message: 'Documento legal registrado exitosamente',
                data: {
                    id: newDocumentId,
                    patientId,
                    appointmentId,
                    documentType,
                    accepted,
                    acceptedAt,
                    ipAddress,
                    userAgent,
                    version,
                    createdAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error creando documento legal:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'CREATE_LEGAL_DOCUMENT_ERROR'
            });
        }
    }

    /**
     * Marcar documento como aceptado
     */
    static async acceptDocument(req, res) {
        try {
            const { id } = req.params;

            // Verificar que el documento existe
            const documentCheck = await dbConfig.query(`
                SELECT * FROM DLegalDocuments WHERE DocumentID = @documentId
            `, [{ name: 'documentId', value: id }]);

            if (documentCheck.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Documento no encontrado',
                    code: 'DOCUMENT_NOT_FOUND'
                });
            }

            const document = documentCheck.recordset[0];

            // Actualizar documento como aceptado
            await dbConfig.query(`
                UPDATE DLegalDocuments SET
                    Accepted = 1,
                    AcceptedAt = GETDATE(),
                    IPAddress = @ipAddress,
                    UserAgent = @userAgent
                WHERE DocumentID = @documentId
            `, [
                { name: 'documentId', value: id },
                { name: 'ipAddress', value: req.ip || req.connection.remoteAddress },
                { name: 'userAgent', value: req.get('User-Agent') }
            ]);

            res.json({
                success: true,
                message: 'Documento marcado como aceptado',
                data: {
                    id: parseInt(id),
                    accepted: true,
                    acceptedAt: new Date().toISOString(),
                    documentType: document.DocumentType,
                    patientId: document.PatientID
                }
            });

        } catch (error) {
            console.error('Error aceptando documento:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'ACCEPT_DOCUMENT_ERROR'
            });
        }
    }

    /**
     * Obtener documentos legales de un paciente
     */
    static async getPatientDocuments(req, res) {
        try {
            const { patientId } = req.params;
            const { documentType, appointmentId } = req.query;

            // Verificar que el paciente existe
            const patientCheck = await dbConfig.query(
                'SELECT PatientID FROM DPatients WHERE PatientID = @patientId',
                [{ name: 'patientId', value: patientId }]
            );

            if (patientCheck.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Paciente no encontrado',
                    code: 'PATIENT_NOT_FOUND'
                });
            }

            const query = `
                SELECT * FROM DLegalDocuments
                WHERE PatientID = @patientId
            `;
            
            const params = [{ name: 'patientId', value: patientId }];

            if (documentType) {
                query += ` AND DocumentType = @documentType`;
                params.push({ name: 'documentType', value: documentType });
            }

            if (appointmentId) {
                query += ` AND CitaID = @appointmentId`;
                params.push({ name: 'appointmentId', value: appointmentId });
            }

            query += ` ORDER BY CreatedAt DESC`;

            const result = await dbConfig.query(query, params);

            const documents = result.recordset.map(doc => ({
                id: doc.DocumentID,
                patientId: doc.PatientID,
                appointmentId: doc.CitaID,
                documentType: doc.DocumentType,
                documentContent: doc.DocumentContent,
                accepted: doc.Accepted,
                acceptedAt: doc.AcceptedAt,
                ipAddress: doc.IPAddress,
                userAgent: doc.UserAgent,
                version: doc.Version,
                createdAt: doc.CreatedAt
            }));

            res.json({
                success: true,
                data: {
                    patientId: parseInt(patientId),
                    documents,
                    count: documents.length
                }
            });

        } catch (error) {
            console.error('Error obteniendo documentos del paciente:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'GET_PATIENT_DOCUMENTS_ERROR'
            });
        }
    }

    /**
     * Obtener documentos legales de una cita específica
     */
    static async getAppointmentDocuments(req, res) {
        try {
            const { appointmentId } = req.params;

            // Verificar que la cita existe
            const appointmentCheck = await dbConfig.query(
                'SELECT CitaID FROM DCitas WHERE CitaID = @appointmentId',
                [{ name: 'appointmentId', value: appointmentId }]
            );

            if (appointmentCheck.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Cita no encontrada',
                    code: 'APPOINTMENT_NOT_FOUND'
                });
            }

            const result = await dbConfig.query(SQL_QUERIES.GET_LEGAL_DOCUMENTS, [
                { name: 'patientId', value: null },
                { name: 'appointmentId', value: appointmentId },
                { name: 'documentType', value: null }
            ]);

            const documents = result.recordset.map(doc => ({
                id: doc.DocumentID,
                patientId: doc.PatientID,
                appointmentId: doc.CitaID,
                documentType: doc.DocumentType,
                documentContent: doc.DocumentContent,
                accepted: doc.Accepted,
                acceptedAt: doc.AcceptedAt,
                ipAddress: doc.IPAddress,
                userAgent: doc.UserAgent,
                version: doc.Version,
                createdAt: doc.CreatedAt
            }));

            res.json({
                success: true,
                data: {
                    appointmentId: parseInt(appointmentId),
                    documents,
                    count: documents.length
                }
            });

        } catch (error) {
            console.error('Error obteniendo documentos de la cita:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'GET_APPOINTMENT_DOCUMENTS_ERROR'
            });
        }
    }

    /**
     * Verificar cumplimiento LOPD para un paciente
     */
    static async checkLOPDCompliance(req, res) {
        try {
            const { patientId } = req.params;

            // Verificar que el paciente existe
            const patientCheck = await dbConfig.query(
                'SELECT PatientID FROM DPatients WHERE PatientID = @patientId',
                [{ name: 'patientId', value: patientId }]
            );

            if (patientCheck.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Paciente no encontrado',
                    code: 'PATIENT_NOT_FOUND'
                });
            }

            // Obtener documentos LOPD del paciente
            const lopdDocuments = await dbConfig.query(`
                SELECT 
                    DocumentID,
                    DocumentType,
                    Accepted,
                    AcceptedAt,
                    CreatedAt
                FROM DLegalDocuments
                WHERE PatientID = @patientId 
                AND DocumentType = 'lopd_consent'
                ORDER BY CreatedAt DESC
                LIMIT 1
            `, [{ name: 'patientId', value: patientId }]);

            // Obtener cuestionarios de primera visita
            const firstVisitQuestionnaires = await dbConfig.query(`
                SELECT 
                    ResponseID,
                    LOPDAccepted,
                    LOPDAcceptedAt,
                    CreatedAt
                FROM DQuestionnaireResponses
                WHERE PatientID = @patientId 
                AND QuestionnaireType = 'first_visit'
                ORDER BY CreatedAt DESC
                LIMIT 1
            `, [{ name: 'patientId', value: patientId }]);

            const compliance = {
                patientId: parseInt(patientId),
                lopdConsent: {
                    hasDocument: lopdDocuments.recordset.length > 0,
                    isAccepted: lopdDocuments.recordset[0]?.Accepted || false,
                    acceptedAt: lopdDocuments.recordset[0]?.AcceptedAt || null,
                    documentId: lopdDocuments.recordset[0]?.DocumentID || null
                },
                firstVisitLOPD: {
                    hasQuestionnaire: firstVisitQuestionnaires.recordset.length > 0,
                    isAccepted: firstVisitQuestionnaires.recordset[0]?.LOPDAccepted || false,
                    acceptedAt: firstVisitQuestionnaires.recordset[0]?.LOPDAcceptedAt || null,
                    responseId: firstVisitQuestionnaires.recordset[0]?.ResponseID || null
                },
                isCompliant: false,
                complianceDetails: []
            };

            // Determinar cumplimiento
            if (compliance.lopdConsent.isAccepted && compliance.firstVisitLOPD.isAccepted) {
                compliance.isCompliant = true;
                compliance.complianceDetails.push('Consentimiento LOPD y cuestionario de primera visita completados');
            } else if (compliance.lopdConsent.isAccepted) {
                compliance.complianceDetails.push('Consentimiento LOPD completado');
            }

            if (compliance.firstVisitLOPD.isAccepted) {
                compliance.complianceDetails.push('Cuestionario de primera visita con LOPD completado');
            }

            if (!compliance.isCompliant) {
                if (!compliance.lopdConsent.isAccepted) {
                    compliance.complianceDetails.push('FALTA: Consentimiento LOPD');
                }
                if (!compliance.firstVisitLOPD.isAccepted) {
                    compliance.complianceDetails.push('FALTA: Cuestionario de primera visita con LOPD');
                }
            }

            res.json({
                success: true,
                data: compliance
            });

        } catch (error) {
            console.error('Error verificando cumplimiento LOPD:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'LOPD_COMPLIANCE_ERROR'
            });
        }
    }

    /**
     * Obtener plantillas de documentos legales
     */
    static async getLegalTemplates(req, res) {
        try {
            const templates = {
                lopd_consent: {
                    name: 'Consentimiento LOPD',
                    description: 'Consentimiento para tratamiento de datos personales según RGPD y LOPD',
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
                    version: '1.0',
                    required: true
                },
                informed_consent_treatment: {
                    name: 'Consentimiento Informado - Tratamiento',
                    description: 'Consentimiento para tratamiento dental específico',
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
                    version: '1.0',
                    required: true
                },
                first_visit_questionnaire: {
                    name: 'Cuestionario Primera Visita',
                    description: 'Cuestionario médico para primera visita con cumplimiento LOPD',
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
                    version: '1.0',
                    required: true,
                    type: 'questionnaire'
                }
            };

            res.json({
                success: true,
                data: templates
            });

        } catch (error) {
            console.error('Error obteniendo plantillas legales:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'GET_LEGAL_TEMPLATES_ERROR'
            });
        }
    }

    /**
     * Obtener estadísticas de cumplimiento legal
     */
    static async getLegalStats(req, res) {
        try {
            const { startDate, endDate } = req.query;

            let dateFilter = '';
            const params = [];

            if (startDate && endDate) {
                dateFilter = 'WHERE CreatedAt BETWEEN @startDate AND @endDate';
                params.push({ name: 'startDate', value: startDate });
                params.push({ name: 'endDate', value: endDate });
            }

            // Estadísticas de documentos LOPD
            const lopdStatsQuery = `
                SELECT 
                    DocumentType,
                    COUNT(*) as total,
                    SUM(CASE WHEN Accepted = 1 THEN 1 ELSE 0 END) as accepted,
                    SUM(CASE WHEN Accepted = 0 THEN 1 ELSE 0 END) as pending,
                    ROUND(
                        (SUM(CASE WHEN Accepted = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 
                        2
                    ) as acceptanceRate
                FROM DLegalDocuments
                ${dateFilter}
                GROUP BY DocumentType
            `;

            const lopdStatsResult = await dbConfig.query(lopdStatsQuery, params);

            // Estadísticas de cuestionarios con LOPD
            const questionnaireStatsQuery = `
                SELECT 
                    QuestionnaireType,
                    COUNT(*) as total,
                    SUM(CASE WHEN LOPDAccepted = 1 THEN 1 ELSE 0 END) as lopdAccepted,
                    SUM(CASE WHEN LOPDAccepted = 0 THEN 1 ELSE 0 END) as lopdPending,
                    ROUND(
                        (SUM(CASE WHEN LOPDAccepted = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 
                        2
                    ) as lopdAcceptanceRate
                FROM DQuestionnaireResponses
                ${dateFilter}
                GROUP BY QuestionnaireType
            `;

            const questionnaireStatsResult = await dbConfig.query(questionnaireStatsQuery, params);

            res.json({
                success: true,
                data: {
                    legalDocuments: lopdStatsResult.recordset,
                    questionnaires: questionnaireStatsResult.recordset,
                    period: {
                        startDate: startDate || null,
                        endDate: endDate || null
                    }
                }
            });

        } catch (error) {
            console.error('Error obteniendo estadísticas legales:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'GET_LEGAL_STATS_ERROR'
            });
        }
    }
}

module.exports = LegalController;