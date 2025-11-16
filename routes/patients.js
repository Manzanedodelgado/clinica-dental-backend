/**
 * Rutas de Pacientes
 * Sistema de Gestión Dental - Rubio García Dental
 */

const express = require('express');
const { dbConfig, SQL_QUERIES } = require('../config/database');
const AuthMiddleware = require('../middleware/auth');
const ValidationMiddleware = require('../middleware/validation');

const router = express.Router();

/**
 * @route   GET /api/patients
 * @desc    Obtener todos los pacientes con paginación y filtros
 * @access  Private
 */
router.get('/', 
    AuthMiddleware.authenticateToken,
    ValidationMiddleware.validateQueryParams(),
    AuthMiddleware.logActivity('get_patients'),
    async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const offset = (page - 1) * limit;
            const search = req.query.search || null;

            let query = `
                SELECT 
                    p.*,
                    COUNT(*) OVER() as totalCount
                FROM DPatients p
                WHERE 1=1
            `;

            const params = [];

            if (search) {
                query += ` AND (p.FirstName LIKE @search OR p.LastName LIKE @search OR p.Phone LIKE @search OR p.Email LIKE @search)`;
                params.push({ name: 'search', value: `%${search}%` });
            }

            query += ` ORDER BY p.LastName, p.FirstName`;
            query += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
            
            params.push({ name: 'offset', value: offset });
            params.push({ name: 'limit', value: limit });

            const result = await dbConfig.query(query, params);

            if (result.recordset.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        patients: [],
                        pagination: {
                            currentPage: page,
                            totalPages: 0,
                            totalItems: 0,
                            itemsPerPage: limit
                        }
                    }
                });
            }

            const totalCount = result.recordset[0].totalCount;
            const patients = result.recordset.map(patient => ({
                id: patient.PatientID,
                firstName: patient.FirstName,
                lastName: patient.LastName,
                phone: patient.Phone,
                email: patient.Email,
                dateOfBirth: patient.DateOfBirth,
                address: patient.Address,
                createdAt: patient.CreatedAt,
                updatedAt: patient.UpdatedAt
            }));

            res.json({
                success: true,
                data: {
                    patients,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(totalCount / limit),
                        totalItems: totalCount,
                        itemsPerPage: limit
                    }
                }
            });

        } catch (error) {
            console.error('Error obteniendo pacientes:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'GET_PATIENTS_ERROR'
            });
        }
    }
);

/**
 * @route   GET /api/patients/:id
 * @desc    Obtener paciente específico
 * @access  Private
 */
router.get('/:id', 
    AuthMiddleware.authenticateToken,
    AuthMiddleware.logActivity('get_patient', { patientId: ':id' }),
    async (req, res) => {
        try {
            const { id } = req.params;

            const result = await dbConfig.query(SQL_QUERIES.GET_PATIENTS.replace('WHERE (@search IS NULL OR FirstName LIKE \'%\' + @search + \'%\' OR LastName LIKE \'%\' + @search + \'%\' OR Phone LIKE \'%\' + @search + \'%\')', 'WHERE PatientID = @patientId'), [
                { name: 'patientId', value: id }
            ]);

            if (result.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Paciente no encontrado',
                    code: 'PATIENT_NOT_FOUND'
                });
            }

            const patient = result.recordset[0];

            res.json({
                success: true,
                data: {
                    id: patient.PatientID,
                    firstName: patient.FirstName,
                    lastName: patient.LastName,
                    phone: patient.Phone,
                    email: patient.Email,
                    dateOfBirth: patient.DateOfBirth,
                    address: patient.Address,
                    createdAt: patient.CreatedAt,
                    updatedAt: patient.UpdatedAt
                }
            });

        } catch (error) {
            console.error('Error obteniendo paciente:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'GET_PATIENT_ERROR'
            });
        }
    }
);

/**
 * @route   POST /api/patients
 * @desc    Crear nuevo paciente
 * @access  Private
 */
router.post('/', 
    AuthMiddleware.authenticateToken,
    ValidationMiddleware.validatePatientCreation(),
    AuthMiddleware.logActivity('create_patient'),
    async (req, res) => {
        try {
            const { firstName, lastName, phone, email, dateOfBirth, address = null } = req.body;

            // Verificar que no existe otro paciente con el mismo teléfono
            const existingPatient = await dbConfig.query(
                'SELECT PatientID FROM DPatients WHERE Phone = @phone',
                [{ name: 'phone', value: phone }]
            );

            if (existingPatient.recordset.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: 'Ya existe un paciente con ese número de teléfono',
                    code: 'PATIENT_PHONE_EXISTS'
                });
            }

            const result = await dbConfig.query(SQL_QUERIES.CREATE_PATIENT, [
                { name: 'firstName', value: firstName },
                { name: 'lastName', value: lastName },
                { name: 'phone', value: phone },
                { name: 'email', value: email },
                { name: 'dateOfBirth', value: dateOfBirth },
                { name: 'address', value: address }
            ]);

            const newPatientId = result.recordset[0].PatientID;

            res.status(201).json({
                success: true,
                message: 'Paciente creado exitosamente',
                data: {
                    id: newPatientId,
                    firstName,
                    lastName,
                    phone,
                    email,
                    dateOfBirth,
                    address,
                    createdAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error creando paciente:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'CREATE_PATIENT_ERROR'
            });
        }
    }
);

/**
 * @route   PUT /api/patients/:id
 * @desc    Actualizar paciente existente
 * @access  Private
 */
router.put('/:id', 
    AuthMiddleware.authenticateToken,
    (req, res, next) => {
        const Joi = require('joi');
        const schema = Joi.object({
            firstName: Joi.string().max(100).optional(),
            lastName: Joi.string().max(100).optional(),
            phone: Joi.string().pattern(/^[0-9]{9,15}$/).optional(),
            email: Joi.string().email().max(255).optional(),
            dateOfBirth: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
            address: Joi.string().max(500).allow('', null).optional()
        }).min(1);
        
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
    },
    AuthMiddleware.logActivity('update_patient', { patientId: ':id' }),
    async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Verificar que el paciente existe
            const existingPatient = await dbConfig.query(
                'SELECT PatientID FROM DPatients WHERE PatientID = @patientId',
                [{ name: 'patientId', value: id }]
            );

            if (existingPatient.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Paciente no encontrado',
                    code: 'PATIENT_NOT_FOUND'
                });
            }

            // Verificar teléfono único si se está actualizando
            if (updateData.phone) {
                const phoneCheck = await dbConfig.query(
                    'SELECT PatientID FROM DPatients WHERE Phone = @phone AND PatientID != @patientId',
                    [
                        { name: 'phone', value: updateData.phone },
                        { name: 'patientId', value: id }
                    ]
                );

                if (phoneCheck.recordset.length > 0) {
                    return res.status(409).json({
                        success: false,
                        error: 'Ya existe otro paciente con ese número de teléfono',
                        code: 'PATIENT_PHONE_EXISTS'
                    });
                }
            }

            await dbConfig.query(SQL_QUERIES.UPDATE_PATIENT, [
                { name: 'patientId', value: id },
                { name: 'firstName', value: updateData.firstName },
                { name: 'lastName', value: updateData.lastName },
                { name: 'phone', value: updateData.phone },
                { name: 'email', value: updateData.email },
                { name: 'dateOfBirth', value: updateData.dateOfBirth },
                { name: 'address', value: updateData.address }
            ]);

            // Obtener paciente actualizado
            const updatedPatient = await dbConfig.query(
                'SELECT * FROM DPatients WHERE PatientID = @patientId',
                [{ name: 'patientId', value: id }]
            );

            res.json({
                success: true,
                message: 'Paciente actualizado exitosamente',
                data: {
                    id: updatedPatient.recordset[0].PatientID,
                    firstName: updatedPatient.recordset[0].FirstName,
                    lastName: updatedPatient.recordset[0].LastName,
                    phone: updatedPatient.recordset[0].Phone,
                    email: updatedPatient.recordset[0].Email,
                    dateOfBirth: updatedPatient.recordset[0].DateOfBirth,
                    address: updatedPatient.recordset[0].Address,
                    createdAt: updatedPatient.recordset[0].CreatedAt,
                    updatedAt: updatedPatient.recordset[0].UpdatedAt
                }
            });

        } catch (error) {
            console.error('Error actualizando paciente:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'UPDATE_PATIENT_ERROR'
            });
        }
    }
);

/**
 * @route   DELETE /api/patients/:id
 * @desc    Eliminar paciente (solo administradores)
 * @access  Private (Admin only)
 */
router.delete('/:id', 
    AuthMiddleware.authenticateToken,
    AuthMiddleware.authorizeRoles('Administrador'),
    AuthMiddleware.logActivity('delete_patient', { patientId: ':id' }),
    async (req, res) => {
        try {
            const { id } = req.params;

            // Verificar que el paciente existe
            const existingPatient = await dbConfig.query(
                'SELECT PatientID FROM DPatients WHERE PatientID = @patientId',
                [{ name: 'patientId', value: id }]
            );

            if (existingPatient.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Paciente no encontrado',
                    code: 'PATIENT_NOT_FOUND'
                });
            }

            // Verificar si tiene citas asociadas
            const appointmentsCheck = await dbConfig.query(
                'SELECT COUNT(*) as count FROM DCitas WHERE PatientID = @patientId',
                [{ name: 'patientId', value: id }]
            );

            if (appointmentsCheck.recordset[0].count > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No se puede eliminar el paciente porque tiene citas asociadas',
                    code: 'PATIENT_HAS_APPOINTMENTS'
                });
            }

            await dbConfig.query(
                'DELETE FROM DPatients WHERE PatientID = @patientId',
                [{ name: 'patientId', value: id }]
            );

            res.json({
                success: true,
                message: 'Paciente eliminado exitosamente'
            });

        } catch (error) {
            console.error('Error eliminando paciente:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'DELETE_PATIENT_ERROR'
            });
        }
    }
);

/**
 * @route   GET /api/patients/:id/appointments
 * @desc    Obtener citas de un paciente específico
 * @access  Private
 */
router.get('/:id/appointments', 
    AuthMiddleware.authenticateToken,
    ValidationMiddleware.validateQueryParams(),
    AuthMiddleware.logActivity('get_patient_appointments', { patientId: ':id' }),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.query;

            let query = `
                SELECT 
                    a.*,
                    p.FirstName,
                    p.LastName,
                    p.Phone,
                    p.Email
                FROM DCitas a
                LEFT JOIN DPatients p ON a.PatientID = p.PatientID
                WHERE a.PatientID = @patientId
            `;

            const params = [{ name: 'patientId', value: id }];

            if (status) {
                query += ` AND a.Status = @status`;
                params.push({ name: 'status', value: status });
            }

            query += ` ORDER BY a.Date DESC, a.Time ASC`;

            const result = await dbConfig.query(query, params);

            const appointments = result.recordset.map(appointment => ({
                id: appointment.CitaID,
                patientId: appointment.PatientID,
                date: appointment.Date,
                time: appointment.Time,
                duration: appointment.Duration,
                treatment: appointment.Treatment,
                status: appointment.Status,
                notes: appointment.Notes,
                createdAt: appointment.CreatedAt,
                updatedAt: appointment.UpdatedAt
            }));

            res.json({
                success: true,
                data: {
                    patientId: parseInt(id),
                    appointments,
                    count: appointments.length
                }
            });

        } catch (error) {
            console.error('Error obteniendo citas del paciente:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'GET_PATIENT_APPOINTMENTS_ERROR'
            });
        }
    }
);

module.exports = router;