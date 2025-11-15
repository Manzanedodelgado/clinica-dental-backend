/**
 * Rutas de Cuestionarios
 * Sistema de Gestión Dental - Rubio García Dental
 */

const express = require('express');
const { dbConfig, SQL_QUERIES } = require('../config/database');
const AuthMiddleware = require('../middleware/auth');
const ValidationMiddleware = require('../middleware/validation');

const router = express.Router();

/**
 * @route   POST /api/questionnaires
 * @desc    Guardar respuestas de cuestionario
 * @access  Private
 */
router.post('/', 
    AuthMiddleware.authenticateToken,
    ValidationMiddleware.validateQuestionnaireResponse(),
    AuthMiddleware.logActivity('create_questionnaire_response'),
    async (req, res) => {
        try {
            const {
                patientId,
                appointmentId,
                questionnaireType,
                responses,
                lopdAccepted,
                lopdAcceptedAt = null
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

            const result = await dbConfig.query(SQL_QUERIES.CREATE_QUESTIONNAIRE_RESPONSE, [
                { name: 'patientId', value: patientId },
                { name: 'appointmentId', value: appointmentId },
                { name: 'questionnaireType', value: questionnaireType },
                { name: 'responses', value: JSON.stringify(responses) },
                { name: 'lopdAccepted', value: lopdAccepted },
                { name: 'lopdAcceptedAt', value: lopdAcceptedAt }
            ]);

            const newResponseId = result.recordset[0].ResponseID;

            res.status(201).json({
                success: true,
                message: 'Respuestas de cuestionario guardadas exitosamente',
                data: {
                    id: newResponseId,
                    patientId,
                    appointmentId,
                    questionnaireType,
                    lopdAccepted,
                    lopdAcceptedAt,
                    createdAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error guardando cuestionario:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'CREATE_QUESTIONNAIRE_ERROR'
            });
        }
    }
);

/**
 * @route   GET /api/questionnaires/appointment/:appointmentId
 * @desc    Obtener cuestionarios de una cita específica
 * @access  Private
 */
router.get('/appointment/:appointmentId', 
    AuthMiddleware.authenticateToken,
    AuthMiddleware.logActivity('get_appointment_questionnaires', { appointmentId: ':appointmentId' }),
    async (req, res) => {
        try {
            const { appointmentId } = req.params;

            const result = await dbConfig.query(SQL_QUERIES.GET_QUESTIONNAIRE_RESPONSES, [
                { name: 'patientId', value: null },
                { name: 'appointmentId', value: appointmentId }
            ]);

            const questionnaires = result.recordset.map(q => ({
                id: q.ResponseID,
                patientId: q.PatientID,
                appointmentId: q.CitaID,
                questionnaireType: q.QuestionnaireType,
                responses: JSON.parse(q.Responses),
                lopdAccepted: q.LOPDAccepted,
                lopdAcceptedAt: q.LOPDAcceptedAt,
                createdAt: q.CreatedAt
            }));

            res.json({
                success: true,
                data: {
                    appointmentId: parseInt(appointmentId),
                    questionnaires,
                    count: questionnaires.length
                }
            });

        } catch (error) {
            console.error('Error obteniendo cuestionarios de la cita:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'GET_APPOINTMENT_QUESTIONNAIRES_ERROR'
            });
        }
    }
);

/**
 * @route   GET /api/questionnaires/patient/:patientId
 * @desc    Obtener cuestionarios de un paciente
 * @access  Private
 */
router.get('/patient/:patientId', 
    AuthMiddleware.authenticateToken,
    ValidationMiddleware.validateQueryParams(),
    AuthMiddleware.logActivity('get_patient_questionnaires', { patientId: ':patientId' }),
    async (req, res) => {
        try {
            const { patientId } = req.params;
            const { questionnaireType } = req.query;

            const query = `
                SELECT * FROM DQuestionnaireResponses
                WHERE PatientID = @patientId
            `;
            
            const params = [{ name: 'patientId', value: patientId }];

            if (questionnaireType) {
                query += ` AND QuestionnaireType = @questionnaireType`;
                params.push({ name: 'questionnaireType', value: questionnaireType });
            }

            query += ` ORDER BY CreatedAt DESC`;

            const result = await dbConfig.query(query, params);

            const questionnaires = result.recordset.map(q => ({
                id: q.ResponseID,
                patientId: q.PatientID,
                appointmentId: q.CitaID,
                questionnaireType: q.QuestionnaireType,
                responses: JSON.parse(q.Responses),
                lopdAccepted: q.LOPDAccepted,
                lopdAcceptedAt: q.LOPDAcceptedAt,
                createdAt: q.CreatedAt
            }));

            res.json({
                success: true,
                data: {
                    patientId: parseInt(patientId),
                    questionnaires,
                    count: questionnaires.length
                }
            });

        } catch (error) {
            console.error('Error obteniendo cuestionarios del paciente:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'GET_PATIENT_QUESTIONNAIRES_ERROR'
            });
        }
    }
);

/**
 * @route   GET /api/questionnaires/first-visit
 * @desc    Obtener cuestionarios de primera visita con cumplimiento LOPD
 * @access  Private
 */
router.get('/first-visit', 
    AuthMiddleware.authenticateToken,
    ValidationMiddleware.validateQueryParams(),
    AuthMiddleware.logActivity('get_first_visit_questionnaires'),
    async (req, res) => {
        try {
            const { startDate, endDate } = req.query;

            let query = `
                SELECT 
                    qr.*,
                    p.FirstName,
                    p.LastName,
                    p.Phone,
                    p.Email,
                    a.Date as AppointmentDate,
                    a.Time as AppointmentTime,
                    a.Treatment
                FROM DQuestionnaireResponses qr
                LEFT JOIN DPatients p ON qr.PatientID = p.PatientID
                LEFT JOIN DCitas a ON qr.CitaID = a.CitaID
                WHERE qr.QuestionnaireType = 'first_visit'
            `;

            const params = [];

            if (startDate && endDate) {
                query += ` AND qr.CreatedAt BETWEEN @startDate AND @endDate`;
                params.push({ name: 'startDate', value: startDate });
                params.push({ name: 'endDate', value: endDate });
            }

            query += ` ORDER BY qr.CreatedAt DESC`;

            const result = await dbConfig.query(query, params);

            const questionnaires = result.recordset.map(q => ({
                id: q.ResponseID,
                patientId: q.PatientID,
                appointmentId: q.CitaID,
                questionnaireType: q.QuestionnaireType,
                responses: JSON.parse(q.Responses),
                lopdAccepted: q.LOPDAccepted,
                lopdAcceptedAt: q.LOPDAcceptedAt,
                createdAt: q.CreatedAt,
                patient: {
                    firstName: q.FirstName,
                    lastName: q.LastName,
                    phone: q.Phone,
                    email: q.Email
                },
                appointment: {
                    date: q.AppointmentDate,
                    time: q.AppointmentTime,
                    treatment: q.Treatment
                }
            }));

            res.json({
                success: true,
                data: {
                    questionnaires,
                    count: questionnaires.length,
                    lopdCompliance: questionnaires.filter(q => q.lopdAccepted).length,
                    complianceRate: questionnaires.length > 0 ? 
                        Math.round((questionnaires.filter(q => q.lopdAccepted).length / questionnaires.length) * 100) : 0
                }
            });

        } catch (error) {
            console.error('Error obteniendo cuestionarios de primera visita:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'GET_FIRST_VISIT_QUESTIONNAIRES_ERROR'
            });
        }
    }
);

/**
 * @route   PUT /api/questionnaires/:id
 * @desc    Actualizar respuestas de cuestionario
 * @access  Private
 */
router.put('/:id', 
    AuthMiddleware.authenticateToken,
    [
        ValidationMiddleware.validateInput({
            responses: ValidationMiddleware.object().required(),
            lopdAccepted: ValidationMiddleware.boolean().optional()
        })
    ],
    AuthMiddleware.logActivity('update_questionnaire', { questionnaireId: ':id' }),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { responses, lopdAccepted = null } = req.body;

            // Verificar que el cuestionario existe
            const existingQuestionnaire = await dbConfig.query(
                'SELECT ResponseID FROM DQuestionnaireResponses WHERE ResponseID = @responseId',
                [{ name: 'responseId', value: id }]
            );

            if (existingQuestionnaire.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Cuestionario no encontrado',
                    code: 'QUESTIONNAIRE_NOT_FOUND'
                });
            }

            let updateQuery = `
                UPDATE DQuestionnaireResponses SET
                    Responses = @responses
            `;
            
            const params = [
                { name: 'responses', value: JSON.stringify(responses) },
                { name: 'responseId', value: id }
            ];

            if (lopdAccepted !== null) {
                updateQuery += `, LOPDAccepted = @lopdAccepted`;
                if (lopdAccepted) {
                    updateQuery += `, LOPDAcceptedAt = GETDATE()`;
                }
                params.push({ name: 'lopdAccepted', value: lopdAccepted });
            }

            updateQuery += ` WHERE ResponseID = @responseId`;

            await dbConfig.query(updateQuery, params);

            // Obtener cuestionario actualizado
            const updatedQuestionnaire = await dbConfig.query(
                'SELECT * FROM DQuestionnaireResponses WHERE ResponseID = @responseId',
                [{ name: 'responseId', value: id }]
            );

            res.json({
                success: true,
                message: 'Cuestionario actualizado exitosamente',
                data: {
                    id: updatedQuestionnaire.recordset[0].ResponseID,
                    questionnaireType: updatedQuestionnaire.recordset[0].QuestionnaireType,
                    responses: JSON.parse(updatedQuestionnaire.recordset[0].Responses),
                    lopdAccepted: updatedQuestionnaire.recordset[0].LOPDAccepted,
                    lopdAcceptedAt: updatedQuestionnaire.recordset[0].LOPDAcceptedAt,
                    createdAt: updatedQuestionnaire.recordset[0].CreatedAt
                }
            });

        } catch (error) {
            console.error('Error actualizando cuestionario:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'UPDATE_QUESTIONNAIRE_ERROR'
            });
        }
    }
);

/**
 * @route   DELETE /api/questionnaires/:id
 * @desc    Eliminar cuestionario (solo administradores)
 * @access  Private (Admin only)
 */
router.delete('/:id', 
    AuthMiddleware.authenticateToken,
    AuthMiddleware.authorizeRoles('Administrador'),
    AuthMiddleware.logActivity('delete_questionnaire', { questionnaireId: ':id' }),
    async (req, res) => {
        try {
            const { id } = req.params;

            const result = await dbConfig.query(
                'DELETE FROM DQuestionnaireResponses WHERE ResponseID = @responseId',
                [{ name: 'responseId', value: id }]
            );

            if (result.rowsAffected[0] === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Cuestionario no encontrado',
                    code: 'QUESTIONNAIRE_NOT_FOUND'
                });
            }

            res.json({
                success: true,
                message: 'Cuestionario eliminado exitosamente'
            });

        } catch (error) {
            console.error('Error eliminando cuestionario:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'DELETE_QUESTIONNAIRE_ERROR'
            });
        }
    }
);

module.exports = router;