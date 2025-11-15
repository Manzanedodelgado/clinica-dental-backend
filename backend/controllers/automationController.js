/**
 * Controlador de Automatización
 * Sistema de Gestión Dental - Rubio García Dental
 */

const { dbConfig, SQL_QUERIES } = require('../config/database');

class AutomationController {
    /**
     * Crear flujo de automatización
     */
    static async createAutomationFlow(req, res) {
        try {
            const {
                appointmentId,
                flowType,
                flowConfig,
                currentStep = 0,
                status = 'active'
            } = req.body;

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

            // Verificar que no existe ya un flujo activo para esta cita
            const existingFlowCheck = await dbConfig.query(`
                SELECT FlowID FROM DAutomationFlows 
                WHERE AppointmentID = @appointmentId AND Status = 'active'
            `, [{ name: 'appointmentId', value: appointmentId }]);

            if (existingFlowCheck.recordset.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: 'Ya existe un flujo activo para esta cita',
                    code: 'FLOW_ALREADY_EXISTS',
                    existingFlowId: existingFlowCheck.recordset[0].FlowID
                });
            }

            // Validar configuración del flujo
            const validationError = AutomationController.validateFlowConfig(flowType, flowConfig);
            if (validationError) {
                return res.status(400).json({
                    success: false,
                    error: validationError,
                    code: 'INVALID_FLOW_CONFIG'
                });
            }

            const result = await dbConfig.query(SQL_QUERIES.CREATE_AUTOMATION_FLOW, [
                { name: 'appointmentId', value: appointmentId },
                { name: 'flowType', value: flowType },
                { name: 'flowConfig', value: JSON.stringify(flowConfig) },
                { name: 'currentStep', value: currentStep },
                { name: 'status', value: status }
            ]);

            const newFlowId = result.recordset[0].FlowID;

            // Log de creación del flujo
            await AutomationController.logAutomationAction(appointmentId, newFlowId, 'flow_created', {
                flowType,
                currentStep,
                status
            });

            res.status(201).json({
                success: true,
                message: 'Flujo de automatización creado exitosamente',
                data: {
                    id: newFlowId,
                    appointmentId,
                    flowType,
                    currentStep,
                    status,
                    flowConfig,
                    createdAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error creando flujo de automatización:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'CREATE_AUTOMATION_FLOW_ERROR'
            });
        }
    }

    /**
     * Obtener flujo específico
     */
    static async getAutomationFlow(req, res) {
        try {
            const { id } = req.params;

            const flowQuery = `
                SELECT 
                    af.*,
                    a.Date,
                    a.Time,
                    a.Treatment,
                    p.FirstName,
                    p.LastName,
                    p.Phone
                FROM DAutomationFlows af
                LEFT JOIN DCitas a ON af.AppointmentID = a.CitaID
                LEFT JOIN DPatients p ON a.PatientID = p.PatientID
                WHERE af.FlowID = @flowId
            `;

            const result = await dbConfig.query(flowQuery, [
                { name: 'flowId', value: id }
            ]);

            if (result.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Flujo de automatización no encontrado',
                    code: 'FLOW_NOT_FOUND'
                });
            }

            const flow = result.recordset[0];

            // Obtener logs del flujo
            const logsQuery = `
                SELECT * FROM DAutomationLogs 
                WHERE FlowID = @flowId 
                ORDER BY CreatedAt DESC
            `;

            const logsResult = await dbConfig.query(logsQuery, [
                { name: 'flowId', value: id }
            ]);

            res.json({
                success: true,
                data: {
                    id: flow.FlowID,
                    appointmentId: flow.AppointmentID,
                    flowType: flow.FlowType,
                    currentStep: flow.CurrentStep,
                    status: flow.Status,
                    flowConfig: JSON.parse(flow.FlowConfig),
                    createdAt: flow.CreatedAt,
                    updatedAt: flow.UpdatedAt,
                    appointment: {
                        date: flow.Date,
                        time: flow.Time,
                        treatment: flow.Treatment,
                        patient: {
                            firstName: flow.FirstName,
                            lastName: flow.LastName,
                            phone: flow.Phone
                        }
                    },
                    logs: logsResult.recordset.map(log => ({
                        id: log.LogID,
                        actionType: log.ActionType,
                        actionData: JSON.parse(log.ActionData || '{}'),
                        success: log.Success,
                        errorMessage: log.ErrorMessage,
                        createdAt: log.CreatedAt
                    }))
                }
            });

        } catch (error) {
            console.error('Error obteniendo flujo de automatización:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'GET_AUTOMATION_FLOW_ERROR'
            });
        }
    }

    /**
     * Procesar respuesta de paso de flujo
     */
    static async processFlowStepResponse(req, res) {
        try {
            const { id, stepId } = req.params;
            const { response, selectedOptions = [], freeText = '', questionnaireResponses = null } = req.body;

            // Verificar que el flujo existe
            const flowCheck = await dbConfig.query(`
                SELECT * FROM DAutomationFlows WHERE FlowID = @flowId AND Status = 'active'
            `, [{ name: 'flowId', value: id }]);

            if (flowCheck.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Flujo de automatización no encontrado o inactivo',
                    code: 'FLOW_NOT_FOUND_OR_INACTIVE'
                });
            }

            const flow = flowCheck.recordset[0];
            const flowConfig = JSON.parse(flow.FlowConfig);

            // Verificar que el paso existe y es el actual
            if (stepId !== flow.CurrentStep.toString()) {
                return res.status(400).json({
                    success: false,
                    error: 'Paso inválido o no es el paso actual',
                    code: 'INVALID_STEP',
                    currentStep: flow.CurrentStep,
                    requestedStep: parseInt(stepId)
                });
            }

            const currentStepConfig = flowConfig.steps[flow.CurrentStep];
            if (!currentStepConfig) {
                return res.status(400).json({
                    success: false,
                    error: 'Configuración de paso no encontrada',
                    code: 'STEP_CONFIG_NOT_FOUND'
                });
            }

            // Procesar respuesta según el tipo de paso
            const processingResult = await AutomationController.processStepResponse(
                flow,
                currentStepConfig,
                response,
                selectedOptions,
                freeText,
                questionnaireResponses
            );

            // Avanzar al siguiente paso o completar flujo
            let nextStep = flow.CurrentStep + 1;
            let newStatus = flow.Status;

            if (nextStep >= flowConfig.steps.length) {
                newStatus = 'completed';
            }

            // Actualizar flujo
            await dbConfig.query(`
                UPDATE DAutomationFlows SET
                    CurrentStep = @currentStep,
                    Status = @status,
                    UpdatedAt = GETDATE()
                WHERE FlowID = @flowId
            `, [
                { name: 'currentStep', value: nextStep },
                { name: 'status', value: newStatus },
                { name: 'flowId', value: id }
            ]);

            // Log de la respuesta procesada
            await AutomationController.logAutomationAction(
                flow.AppointmentID,
                flow.FlowID,
                'step_response_processed',
                {
                    stepId: flow.CurrentStep,
                    response,
                    selectedOptions,
                    processingResult
                }
            );

            res.json({
                success: true,
                message: 'Respuesta procesada exitosamente',
                data: {
                    flowId: parseInt(id),
                    currentStep: nextStep,
                    status: newStatus,
                    processingResult,
                    isCompleted: newStatus === 'completed',
                    nextStep: newStatus === 'active' ? nextStep : null
                }
            });

        } catch (error) {
            console.error('Error procesando respuesta de flujo:', error);
            
            // Log del error
            if (req.params.id) {
                await AutomationController.logAutomationAction(
                    null,
                    parseInt(req.params.id),
                    'step_response_error',
                    { error: error.message, stack: error.stack }
                );
            }

            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'PROCESS_STEP_RESPONSE_ERROR'
            });
        }
    }

    /**
     * Validar configuración del flujo
     */
    static validateFlowConfig(flowType, flowConfig) {
        if (!flowConfig.steps || !Array.isArray(flowConfig.steps) || flowConfig.steps.length === 0) {
            return 'La configuración debe incluir un array de pasos válido';
        }

        for (let i = 0; i < flowConfig.steps.length; i++) {
            const step = flowConfig.steps[i];
            
            if (!step.type) {
                return `Paso ${i + 1}: Tipo de paso es requerido`;
            }

            if (!step.message) {
                return `Paso ${i + 1}: Mensaje es requerido`;
            }

            // Validaciones específicas por tipo
            switch (step.type) {
                case 'single_choice':
                case 'multiple_choice':
                    if (!step.buttons || !Array.isArray(step.buttons) || step.buttons.length === 0) {
                        return `Paso ${i + 1}: Se requieren botones para selección`;
                    }
                    break;

                case 'questionnaire':
                    if (!step.questionnaire || !step.questionnaire.questions) {
                        return `Paso ${i + 1}: Se requiere configuración de cuestionario`;
                    }
                    break;

                case 'document':
                    if (!step.documentId) {
                        return `Paso ${i + 1}: ID de documento es requerido`;
                    }
                    break;

                case 'message':
                    // Validación básica, no requiere elementos adicionales
                    break;

                default:
                    return `Paso ${i + 1}: Tipo de paso no válido: ${step.type}`;
            }
        }

        return null; // Sin errores
    }

    /**
     * Procesar respuesta de paso
     */
    static async processStepResponse(flow, stepConfig, response, selectedOptions, freeText, questionnaireResponses) {
        const flowConfig = JSON.parse(flow.FlowConfig);
        let result = {
            type: stepConfig.type,
            response,
            processed: true,
            actions: [],
            nextStates: []
        };

        try {
            switch (stepConfig.type) {
                case 'single_choice':
                    result.actions.push(await AutomationController.handleSingleChoice(flow, stepConfig, selectedOptions[0]));
                    break;

                case 'multiple_choice':
                    result.actions.push(await AutomationController.handleMultipleChoice(flow, stepConfig, selectedOptions));
                    break;

                case 'questionnaire':
                    result.actions.push(await AutomationController.handleQuestionnaire(flow, stepConfig, questionnaireResponses));
                    result.nextStates.push('questionnaire_completed');
                    break;

                case 'document':
                    result.actions.push(await AutomationController.handleDocument(flow, stepConfig, response));
                    if (response === 'accept') {
                        result.nextStates.push('document_accepted');
                    }
                    break;

                case 'message':
                    result.actions.push('Mensaje enviado exitosamente');
                    break;

                default:
                    result.actions.push('Tipo de paso no reconocido');
            }

            // Procesar ramificaciones si existen
            if (stepConfig.branches) {
                for (const option of selectedOptions) {
                    if (stepConfig.branches[option]) {
                        result.branches = result.branches || [];
                        result.branches.push({
                            option,
                            branch: stepConfig.branches[option]
                        });
                    }
                }
            }

            // Determinar cambios de estado de cita
            if (stepConfig.state_change) {
                result.nextStates.push(stepConfig.state_change);
            }

            return result;

        } catch (error) {
            console.error('Error procesando respuesta de paso:', error);
            result.error = error.message;
            result.processed = false;
            return result;
        }
    }

    /**
     * Manejar selección única
     */
    static async handleSingleChoice(flow, stepConfig, selectedOption) {
        const responseMessage = stepConfig.responses?.[selectedOption] || 'Entendido';

        // Log de la respuesta
        await AutomationController.logAutomationAction(
            flow.AppointmentID,
            flow.FlowID,
            'single_choice_response',
            { selectedOption, responseMessage }
        );

        return `Selección única procesada: ${selectedOption}`;
    }

    /**
     * Manejar selección múltiple
     */
    static async handleMultipleChoice(flow, stepConfig, selectedOptions) {
        const responseMessage = `Opciones seleccionadas: ${selectedOptions.join(', ')}`;

        await AutomationController.logAutomationAction(
            flow.AppointmentID,
            flow.FlowID,
            'multiple_choice_response',
            { selectedOptions, responseMessage }
        );

        return `Selección múltiple procesada: ${selectedOptions.length} opciones`;
    }

    /**
     * Manejar cuestionario
     */
    static async handleQuestionnaire(flow, stepConfig, questionnaireResponses) {
        if (!questionnaireResponses) {
            throw new Error('Respuestas de cuestionario requeridas');
        }

        // Guardar respuestas en base de datos
        await dbConfig.query(`
            INSERT INTO DQuestionnaireResponses (
                PatientID, CitaID, QuestionnaireType, Responses,
                LOPDAccepted, LOPDAcceptedAt, CreatedAt
            )
            VALUES (
                (SELECT PatientID FROM DCitas WHERE CitaID = @appointmentId),
                @appointmentId,
                @questionnaireType,
                @responses,
                @lopdAccepted,
                @lopdAcceptedAt,
                GETDATE()
            )
        `, [
            { name: 'appointmentId', value: flow.AppointmentID },
            { name: 'questionnaireType', value: stepConfig.questionnaire.type || 'custom' },
            { name: 'responses', value: JSON.stringify(questionnaireResponses) },
            { name: 'lopdAccepted', value: stepConfig.requiresLegal || false },
            { name: 'lopdAcceptedAt', value: stepConfig.requiresLegal ? new Date() : null }
        ]);

        await AutomationController.logAutomationAction(
            flow.AppointmentID,
            flow.FlowID,
            'questionnaire_completed',
            { questionnaireType: stepConfig.questionnaire.type, responsesCount: Object.keys(questionnaireResponses).length }
        );

        return `Cuestionario completado: ${Object.keys(questionnaireResponses).length} respuestas`;
    }

    /**
     * Manejar documento
     */
    static async handleDocument(flow, stepConfig, response) {
        // Registrar documento legal si es requerido
        if (stepConfig.requiresLegal) {
            await dbConfig.query(SQL_QUERIES.CREATE_LEGAL_DOCUMENT, [
                { name: 'patientId', value: '(SELECT PatientID FROM DCitas WHERE CitaID = ' + flow.AppointmentID + ')' },
                { name: 'appointmentId', value: flow.AppointmentID },
                { name: 'documentType', value: stepConfig.documentId },
                { name: 'documentContent', value: stepConfig.documentContent || 'Documento del flujo' },
                { name: 'accepted', value: response === 'accept' },
                { name: 'acceptedAt', value: response === 'accept' ? new Date() : null },
                { name: 'ipAddress', value: null },
                { name: 'userAgent', value: null },
                { name: 'version', value: '1.0' }
            ]);

            await AutomationController.logAutomationAction(
                flow.AppointmentID,
                flow.FlowID,
                'document_legal_registered',
                { documentId: stepConfig.documentId, accepted: response === 'accept' }
            );
        }

        await AutomationController.logAutomationAction(
            flow.AppointmentID,
            flow.FlowID,
            'document_processed',
            { documentId: stepConfig.documentId, response }
        );

        return `Documento procesado: ${stepConfig.documentId}`;
    }

    /**
     * Log de acciones de automatización
     */
    static async logAutomationAction(appointmentId, flowId, actionType, actionData) {
        try {
            await dbConfig.query(SQL_QUERIES.CREATE_AUTOMATION_LOG, [
                { name: 'appointmentId', value: appointmentId },
                { name: 'flowId', value: flowId },
                { name: 'actionType', value: actionType },
                { name: 'actionData', value: JSON.stringify(actionData) },
                { name: 'success', value: true },
                { name: 'errorMessage', value: null }
            ]);
        } catch (error) {
            console.error('Error logging automation action:', error);
        }
    }

    /**
     * Obtener estadísticas de automatización
     */
    static async getAutomationStats(req, res) {
        try {
            const { startDate, endDate } = req.query;

            let dateFilter = '';
            const params = [];

            if (startDate && endDate) {
                dateFilter = 'WHERE CreatedAt BETWEEN @startDate AND @endDate';
                params.push({ name: 'startDate', value: startDate });
                params.push({ name: 'endDate', value: endDate });
            }

            // Estadísticas de flujos
            const flowsStatsQuery = `
                SELECT 
                    FlowType,
                    Status,
                    COUNT(*) as count
                FROM DAutomationFlows
                ${dateFilter}
                GROUP BY FlowType, Status
            `;

            const flowsStatsResult = await dbConfig.query(flowsStatsQuery, params);

            // Estadísticas de logs
            const logsStatsQuery = `
                SELECT 
                    ActionType,
                    Success,
                    COUNT(*) as count
                FROM DAutomationLogs
                ${dateFilter}
                GROUP BY ActionType, Success
            `;

            const logsStatsResult = await dbConfig.query(logsStatsQuery, params);

            // Flujos activos por tipo
            const activeFlowsQuery = `
                SELECT 
                    FlowType,
                    COUNT(*) as activeCount
                FROM DAutomationFlows
                WHERE Status = 'active'
                GROUP BY FlowType
            `;

            const activeFlowsResult = await dbConfig.query(activeFlowsQuery);

            res.json({
                success: true,
                data: {
                    flows: flowsStatsResult.recordset,
                    logs: logsStatsResult.recordset,
                    activeFlows: activeFlowsResult.recordset,
                    period: {
                        startDate: startDate || null,
                        endDate: endDate || null
                    }
                }
            });

        } catch (error) {
            console.error('Error obteniendo estadísticas de automatización:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'GET_AUTOMATION_STATS_ERROR'
            });
        }
    }

    /**
     * Obtener flujos activos
     */
    static async getActiveFlows(req, res) {
        try {
            const flowsQuery = `
                SELECT 
                    af.*,
                    a.Date,
                    a.Time,
                    a.Treatment,
                    p.FirstName,
                    p.LastName,
                    p.Phone
                FROM DAutomationFlows af
                LEFT JOIN DCitas a ON af.AppointmentID = a.CitaID
                LEFT JOIN DPatients p ON a.PatientID = p.PatientID
                WHERE af.Status = 'active'
                ORDER BY af.CreatedAt DESC
            `;

            const result = await dbConfig.query(flowsQuery);

            const activeFlows = result.recordset.map(flow => ({
                id: flow.FlowID,
                appointmentId: flow.AppointmentID,
                flowType: flow.FlowType,
                currentStep: flow.CurrentStep,
                createdAt: flow.CreatedAt,
                appointment: {
                    date: flow.Date,
                    time: flow.Time,
                    treatment: flow.Treatment,
                    patient: {
                        firstName: flow.FirstName,
                        lastName: flow.LastName,
                        phone: flow.Phone
                    }
                }
            }));

            res.json({
                success: true,
                data: {
                    activeFlows,
                    count: activeFlows.length
                }
            });

        } catch (error) {
            console.error('Error obteniendo flujos activos:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'GET_ACTIVE_FLOWS_ERROR'
            });
        }
    }
}

module.exports = AutomationController;