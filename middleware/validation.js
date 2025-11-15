/**
 * Middleware de Validación
 * Sistema de Gestión Dental - Rubio García Dental
 */

const Joi = require('joi');

class ValidationMiddleware {
    /**
     * Validar esquema de creación de cita
     */
    static validateAppointmentCreation() {
        const schema = Joi.object({
            patientId: Joi.number().integer().positive().required(),
            date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
            time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
            duration: Joi.number().integer().min(15).max(480).required(),
            treatment: Joi.string().max(255).required(),
            notes: Joi.string().max(1000).allow('', null)
        });

        return ValidationMiddleware.validate(schema);
    }

    /**
     * Validar esquema de actualización de cita
     */
    static validateAppointmentUpdate() {
        const schema = Joi.object({
            date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
            time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
            duration: Joi.number().integer().min(15).max(480).optional(),
            treatment: Joi.string().max(255).optional(),
            status: Joi.string().valid('Planificada', 'Confirmada', 'Aceptada', 'Cancelada', 'Anula').optional(),
            notes: Joi.string().max(1000).allow('', null).optional()
        }).min(1);

        return ValidationMiddleware.validate(schema);
    }

    /**
     * Validar esquema de creación de paciente
     */
    static validatePatientCreation() {
        const schema = Joi.object({
            firstName: Joi.string().max(100).required(),
            lastName: Joi.string().max(100).required(),
            phone: Joi.string().pattern(/^[0-9]{9,15}$/).required(),
            email: Joi.string().email().max(255).optional(),
            dateOfBirth: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
            address: Joi.string().max(500).allow('', null).optional()
        });

        return ValidationMiddleware.validate(schema);
    }

    /**
     * Validar esquema de respuesta de cuestionario
     */
    static validateQuestionnaireResponse() {
        const schema = Joi.object({
            patientId: Joi.number().integer().positive().required(),
            appointmentId: Joi.number().integer().positive().required(),
            questionnaireType: Joi.string().valid('first_visit', 'medical_history', 'treatment_satisfaction').required(),
            responses: Joi.object().required(),
            lopdAccepted: Joi.boolean().required(),
            lopdAcceptedAt: Joi.date().optional()
        });

        return ValidationMiddleware.validate(schema);
    }

    /**
     * Validar esquema de documento legal
     */
    static validateLegalDocument() {
        const schema = Joi.object({
            patientId: Joi.number().integer().positive().required(),
            appointmentId: Joi.number().integer().positive().optional(),
            documentType: Joi.string().valid(
                'informed_consent_treatment',
                'lopd_consent',
                'privacy_policy',
                'data_processing_agreement',
                'first_visit_questionnaire'
            ).required(),
            documentContent: Joi.string().required(),
            accepted: Joi.boolean().required(),
            acceptedAt: Joi.date().optional(),
            ipAddress: Joi.string().ip().optional(),
            userAgent: Joi.string().max(1000).optional(),
            version: Joi.string().max(50).optional()
        });

        return ValidationMiddleware.validate(schema);
    }

    /**
     * Validar esquema de flujo de automatización
     */
    static validateAutomationFlow() {
        const schema = Joi.object({
            appointmentId: Joi.number().integer().positive().required(),
            flowType: Joi.string().valid('confirmation', 'questionnaire', 'document', 'mixed').required(),
            flowConfig: Joi.object().required(),
            currentStep: Joi.number().integer().min(0).optional(),
            status: Joi.string().valid('active', 'completed', 'cancelled').optional()
        });

        return ValidationMiddleware.validate(schema);
    }

    /**
     * Validar esquema de login
     */
    static validateLogin() {
        const schema = Joi.object({
            username: Joi.string().max(100).required(),
            password: Joi.string().min(6).required()
        });

        return ValidationMiddleware.validate(schema);
    }

    /**
     * Validar esquema de registro de usuario
     */
    static validateUserRegistration() {
        const schema = Joi.object({
            username: Joi.string().alphanum().min(3).max(30).required(),
            email: Joi.string().email().max(255).required(),
            password: Joi.string().min(6).required(),
            firstName: Joi.string().max(100).required(),
            lastName: Joi.string().max(100).required(),
            role: Joi.string().valid('Administrador', 'Dentista', 'Recepcionista', 'Asistente').required()
        });

        return ValidationMiddleware.validate(schema);
    }

    /**
     * Validar parámetros de consulta
     */
    static validateQueryParams() {
        return (req, res, next) => {
            const { page, limit, sort, order, search, date, status } = req.query;
            
            // Validar paginación
            if (page && (!/^\d+$/.test(page) || parseInt(page) < 1)) {
                return res.status(400).json({
                    success: false,
                    error: 'Parámetro "page" debe ser un número entero positivo',
                    code: 'INVALID_PAGE_PARAMETER'
                });
            }

            if (limit && (!/^\d+$/.test(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
                return res.status(400).json({
                    success: false,
                    error: 'Parámetro "limit" debe ser un número entre 1 y 100',
                    code: 'INVALID_LIMIT_PARAMETER'
                });
            }

            // Validar ordenamiento
            if (order && !['asc', 'desc'].includes(order.toLowerCase())) {
                return res.status(400).json({
                    success: false,
                    error: 'Parámetro "order" debe ser "asc" o "desc"',
                    code: 'INVALID_ORDER_PARAMETER'
                });
            }

            // Validar fecha
            if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                return res.status(400).json({
                    success: false,
                    error: 'Parámetro "date" debe tener formato YYYY-MM-DD',
                    code: 'INVALID_DATE_PARAMETER'
                });
            }

            // Validar estado
            if (status && !['Planificada', 'Confirmada', 'Aceptada', 'Cancelada', 'Anula'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: 'Estado inválido',
                    code: 'INVALID_STATUS_PARAMETER'
                });
            }

            next();
        };
    }

    /**
     * Función genérica de validación
     */
    static validate(schema) {
        return (req, res, next) => {
            const { error } = schema.validate(req.body);
            
            if (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos de entrada inválidos',
                    code: 'VALIDATION_ERROR',
                    details: error.details.map(detail => ({
                        field: detail.path.join('.'),
                        message: detail.message,
                        value: detail.context.value
                    }))
                });
            }

            next();
        };
    }

    /**
     * Validar si existe un archivo en la solicitud
     */
    static requireFile(fieldName = 'file') {
        return (req, res, next) => {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: `Archivo "${fieldName}" es requerido`,
                    code: 'FILE_REQUIRED'
                });
            }
            next();
        };
    }

    /**
     * Validar tipo de archivo
     */
    static validateFileType(allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']) {
        return (req, res, next) => {
            if (req.file && !allowedTypes.includes(req.file.mimetype)) {
                return res.status(400).json({
                    success: false,
                    error: `Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}`,
                    code: 'FILE_TYPE_NOT_ALLOWED',
                    received: req.file.mimetype
                });
            }
            next();
        };
    }

    /**
     * Validar tamaño de archivo
     */
    static validateFileSize(maxSizeInMB = 5) {
        return (req, res, next) => {
            if (req.file && req.file.size > maxSizeInMB * 1024 * 1024) {
                return res.status(400).json({
                    success: false,
                    error: `El archivo es demasiado grande. Tamaño máximo: ${maxSizeInMB}MB`,
                    code: 'FILE_TOO_LARGE',
                    received: `${(req.file.size / 1024 / 1024).toFixed(2)}MB`,
                    maximum: `${maxSizeInMB}MB`
                });
            }
            next();
        };
    }
}

module.exports = ValidationMiddleware;