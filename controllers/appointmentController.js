/**
 * Controlador de Citas
 * Sistema de Gestión Dental - Rubio García Dental
 */

const { dbConfig, SQL_QUERIES } = require('../config/database');

class AppointmentController {
    /**
     * Obtener todas las citas con paginación y filtros
     */
    static async getAppointments(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const offset = (page - 1) * limit;
            const search = req.query.search || null;
            const status = req.query.status || null;
            const date = req.query.date || null;
            const sort = req.query.sort || 'date';
            const order = req.query.order || 'desc';

            // Construir consulta con filtros
            let query = `
                SELECT 
                    a.*,
                    p.FirstName,
                    p.LastName,
                    p.Phone,
                    p.Email,
                    p.DateOfBirth,
                    COUNT(*) OVER() as totalCount
                FROM DCitas a
                LEFT JOIN DPatients p ON a.PatientID = p.PatientID
                WHERE 1=1
            `;

            const params = [];

            // Agregar filtros
            if (search) {
                query += ` AND (p.FirstName LIKE @search OR p.LastName LIKE @search OR p.Phone LIKE @search OR a.Treatment LIKE @search)`;
                params.push({ name: 'search', value: `%${search}%` });
            }

            if (status) {
                query += ` AND a.Status = @status`;
                params.push({ name: 'status', value: status });
            }

            if (date) {
                query += ` AND a.Date = @date`;
                params.push({ name: 'date', value: date });
            }

            // Agregar ordenamiento
            const validSortFields = ['date', 'time', 'status', 'treatment', 'patientName'];
            const validOrder = ['asc', 'desc'];
            
            if (validSortFields.includes(sort) && validOrder.includes(order.toLowerCase())) {
                if (sort === 'patientName') {
                    query += ` ORDER BY p.LastName ${order.toUpperCase()}, p.FirstName ${order.toUpperCase()}`;
                } else {
                    query += ` ORDER BY a.${sort.charAt(0).toUpperCase() + sort.slice(1)} ${order.toUpperCase()}`;
                }
            } else {
                query += ` ORDER BY a.Date DESC, a.Time ASC`;
            }

            // Agregar paginación
            query += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
            params.push({ name: 'offset', value: offset });
            params.push({ name: 'limit', value: limit });

            const result = await dbConfig.query(query, params);

            if (result.recordset.length === 0) {
                return res.json({
                    success: true,
                    data: {
                        appointments: [],
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
                updatedAt: appointment.UpdatedAt,
                patient: {
                    firstName: appointment.FirstName,
                    lastName: appointment.LastName,
                    phone: appointment.Phone,
                    email: appointment.Email,
                    dateOfBirth: appointment.DateOfBirth
                }
            }));

            res.json({
                success: true,
                data: {
                    appointments,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(totalCount / limit),
                        totalItems: totalCount,
                        itemsPerPage: limit
                    }
                }
            });

        } catch (error) {
            console.error('Error obteniendo citas:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'GET_APPOINTMENTS_ERROR'
            });
        }
    }

    /**
     * Obtener cita específica por ID
     */
    static async getAppointmentById(req, res) {
        try {
            const { id } = req.params;

            const result = await dbConfig.query(SQL_QUERIES.GET_APPOINTMENT_BY_ID, [
                { name: 'appointmentId', value: id }
            ]);

            if (result.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Cita no encontrada',
                    code: 'APPOINTMENT_NOT_FOUND'
                });
            }

            const appointment = result.recordset[0];

            res.json({
                success: true,
                data: {
                    id: appointment.CitaID,
                    patientId: appointment.PatientID,
                    date: appointment.Date,
                    time: appointment.Time,
                    duration: appointment.Duration,
                    treatment: appointment.Treatment,
                    status: appointment.Status,
                    notes: appointment.Notes,
                    createdAt: appointment.CreatedAt,
                    updatedAt: appointment.UpdatedAt,
                    patient: {
                        firstName: appointment.FirstName,
                        lastName: appointment.LastName,
                        phone: appointment.Phone,
                        email: appointment.Email,
                        dateOfBirth: appointment.DateOfBirth
                    }
                }
            });

        } catch (error) {
            console.error('Error obteniendo cita:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'GET_APPOINTMENT_ERROR'
            });
        }
    }

    /**
     * Crear nueva cita
     */
    static async createAppointment(req, res) {
        try {
            const {
                patientId,
                date,
                time,
                duration,
                treatment,
                status = 'Planificada',
                notes = null
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

            // Verificar conflictos de horario (mismo día y hora)
            const conflictCheck = await dbConfig.query(`
                SELECT CitaID FROM DCitas 
                WHERE Date = @date AND Time = @time AND Status NOT IN ('Cancelada', 'Anula')
            `, [
                { name: 'date', value: date },
                { name: 'time', value: time }
            ]);

            if (conflictCheck.recordset.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: 'Ya existe una cita programada para esa fecha y hora',
                    code: 'APPOINTMENT_CONFLICT'
                });
            }

            const result = await dbConfig.query(SQL_QUERIES.CREATE_APPOINTMENT, [
                { name: 'patientId', value: patientId },
                { name: 'date', value: date },
                { name: 'time', value: time },
                { name: 'duration', value: duration },
                { name: 'treatment', value: treatment },
                { name: 'status', value: status },
                { name: 'notes', value: notes }
            ]);

            const newAppointmentId = result.recordset[0].CitaID;

            // Obtener la cita creada
            const newAppointment = await dbConfig.query(SQL_QUERIES.GET_APPOINTMENT_BY_ID, [
                { name: 'appointmentId', value: newAppointmentId }
            ]);

            res.status(201).json({
                success: true,
                message: 'Cita creada exitosamente',
                data: {
                    id: newAppointment.recordset[0].CitaID,
                    patientId: newAppointment.recordset[0].PatientID,
                    date: newAppointment.recordset[0].Date,
                    time: newAppointment.recordset[0].Time,
                    duration: newAppointment.recordset[0].Duration,
                    treatment: newAppointment.recordset[0].Treatment,
                    status: newAppointment.recordset[0].Status,
                    notes: newAppointment.recordset[0].Notes,
                    createdAt: newAppointment.recordset[0].CreatedAt,
                    updatedAt: newAppointment.recordset[0].UpdatedAt
                }
            });

        } catch (error) {
            console.error('Error creando cita:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'CREATE_APPOINTMENT_ERROR'
            });
        }
    }

    /**
     * Actualizar cita existente
     */
    static async updateAppointment(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Verificar que la cita existe
            const existingAppointment = await dbConfig.query(SQL_QUERIES.GET_APPOINTMENT_BY_ID, [
                { name: 'appointmentId', value: id }
            ]);

            if (existingAppointment.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Cita no encontrada',
                    code: 'APPOINTMENT_NOT_FOUND'
                });
            }

            // Si se está cambiando fecha y hora, verificar conflictos
            if (updateData.date && updateData.time) {
                const conflictCheck = await dbConfig.query(`
                    SELECT CitaID FROM DCitas 
                    WHERE Date = @date AND Time = @time AND CitaID != @appointmentId 
                    AND Status NOT IN ('Cancelada', 'Anula')
                `, [
                    { name: 'date', value: updateData.date },
                    { name: 'time', value: updateData.time },
                    { name: 'appointmentId', value: id }
                ]);

                if (conflictCheck.recordset.length > 0) {
                    return res.status(409).json({
                        success: false,
                        error: 'Ya existe una cita programada para esa fecha y hora',
                        code: 'APPOINTMENT_CONFLICT'
                    });
                }
            }

            // Actualizar cita
            await dbConfig.query(SQL_QUERIES.UPDATE_APPOINTMENT, [
                { name: 'appointmentId', value: id },
                { name: 'date', value: updateData.date },
                { name: 'time', value: updateData.time },
                { name: 'duration', value: updateData.duration },
                { name: 'treatment', value: updateData.treatment },
                { name: 'status', value: updateData.status },
                { name: 'notes', value: updateData.notes }
            ]);

            // Obtener cita actualizada
            const updatedAppointment = await dbConfig.query(SQL_QUERIES.GET_APPOINTMENT_BY_ID, [
                { name: 'appointmentId', value: id }
            ]);

            res.json({
                success: true,
                message: 'Cita actualizada exitosamente',
                data: {
                    id: updatedAppointment.recordset[0].CitaID,
                    patientId: updatedAppointment.recordset[0].PatientID,
                    date: updatedAppointment.recordset[0].Date,
                    time: updatedAppointment.recordset[0].Time,
                    duration: updatedAppointment.recordset[0].Duration,
                    treatment: updatedAppointment.recordset[0].Treatment,
                    status: updatedAppointment.recordset[0].Status,
                    notes: updatedAppointment.recordset[0].Notes,
                    createdAt: updatedAppointment.recordset[0].CreatedAt,
                    updatedAt: updatedAppointment.recordset[0].UpdatedAt
                }
            });

        } catch (error) {
            console.error('Error actualizando cita:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'UPDATE_APPOINTMENT_ERROR'
            });
        }
    }

    /**
     * Actualizar solo el estado de la cita
     */
    static async updateAppointmentStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, reason = null } = req.body;

            // Validar estados permitidos
            const validStatuses = ['Planificada', 'Confirmada', 'Aceptada', 'Cancelada', 'Anula'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: 'Estado de cita inválido',
                    code: 'INVALID_STATUS',
                    validStatuses
                });
            }

            // Verificar que la cita existe
            const existingAppointment = await dbConfig.query(SQL_QUERIES.GET_APPOINTMENT_BY_ID, [
                { name: 'appointmentId', value: id }
            ]);

            if (existingAppointment.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Cita no encontrada',
                    code: 'APPOINTMENT_NOT_FOUND'
                });
            }

            // Actualizar estado
            await dbConfig.query(SQL_QUERIES.UPDATE_APPOINTMENT_STATUS, [
                { name: 'appointmentId', value: id },
                { name: 'status', value: status }
            ]);

            // Log del cambio de estado si hay razón
            if (reason) {
                await dbConfig.query(`
                    INSERT INTO DAppointmentStatusChanges (AppointmentID, OldStatus, NewStatus, Reason, ChangedBy, ChangedAt)
                    VALUES (@appointmentId, @oldStatus, @newStatus, @reason, @changedBy, GETDATE())
                `, [
                    { name: 'appointmentId', value: id },
                    { name: 'oldStatus', value: existingAppointment.recordset[0].Status },
                    { name: 'newStatus', value: status },
                    { name: 'reason', value: reason },
                    { name: 'changedBy', value: req.user.UserID }
                ]);
            }

            // Obtener cita actualizada
            const updatedAppointment = await dbConfig.query(SQL_QUERIES.GET_APPOINTMENT_BY_ID, [
                { name: 'appointmentId', value: id }
            ]);

            res.json({
                success: true,
                message: 'Estado de cita actualizado exitosamente',
                data: {
                    id: updatedAppointment.recordset[0].CitaID,
                    status: updatedAppointment.recordset[0].Status,
                    updatedAt: updatedAppointment.recordset[0].UpdatedAt
                }
            });

        } catch (error) {
            console.error('Error actualizando estado de cita:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'UPDATE_STATUS_ERROR'
            });
        }
    }

    /**
     * Eliminar cita
     */
    static async deleteAppointment(req, res) {
        try {
            const { id } = req.params;

            // Verificar que la cita existe
            const existingAppointment = await dbConfig.query(SQL_QUERIES.GET_APPOINTMENT_BY_ID, [
                { name: 'appointmentId', value: id }
            ]);

            if (existingAppointment.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Cita no encontrada',
                    code: 'APPOINTMENT_NOT_FOUND'
                });
            }

            // Verificar si la cita puede ser eliminada (no debe tener registros relacionados)
            const relatedRecords = await dbConfig.query(`
                SELECT COUNT(*) as count FROM (
                    SELECT AppointmentID FROM DAutomationFlows WHERE AppointmentID = @appointmentId
                    UNION ALL
                    SELECT AppointmentID FROM DLegalDocuments WHERE CitaID = @appointmentId
                    UNION ALL
                    SELECT AppointmentID FROM DQuestionnaireResponses WHERE CitaID = @appointmentId
                    UNION ALL
                    SELECT AppointmentID FROM DAutomationLogs WHERE AppointmentID = @appointmentId
                ) related
            `, [{ name: 'appointmentId', value: id }]);

            if (relatedRecords.recordset[0].count > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No se puede eliminar la cita porque tiene registros relacionados',
                    code: 'APPOINTMENT_HAS_RELATED_RECORDS'
                });
            }

            await dbConfig.query(SQL_QUERIES.DELETE_APPOINTMENT, [
                { name: 'appointmentId', value: id }
            ]);

            res.json({
                success: true,
                message: 'Cita eliminada exitosamente'
            });

        } catch (error) {
            console.error('Error eliminando cita:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'DELETE_APPOINTMENT_ERROR'
            });
        }
    }

    /**
     * Obtener citas pendientes para automatización (24h antes)
     */
    static async getPendingAutomations(req, res) {
        try {
            const result = await dbConfig.query(SQL_QUERIES.GET_PENDING_AUTOMATIONS);

            const pendingAutomations = result.recordset.map(appointment => ({
                id: appointment.CitaID,
                patientId: appointment.PatientID,
                date: appointment.Date,
                time: appointment.Time,
                duration: appointment.Duration,
                treatment: appointment.Treatment,
                status: appointment.Status,
                patient: {
                    firstName: appointment.FirstName,
                    lastName: appointment.LastName,
                    phone: appointment.Phone,
                    email: appointment.Email
                }
            }));

            res.json({
                success: true,
                data: {
                    pendingAutomations,
                    count: pendingAutomations.length
                }
            });

        } catch (error) {
            console.error('Error obteniendo automatizaciones pendientes:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'GET_PENDING_AUTOMATIONS_ERROR'
            });
        }
    }

    /**
     * Obtener estadísticas de citas
     */
    static async getAppointmentStats(req, res) {
        try {
            const { startDate, endDate } = req.query;

            let dateFilter = '';
            const params = [];

            if (startDate && endDate) {
                dateFilter = 'WHERE Date BETWEEN @startDate AND @endDate';
                params.push({ name: 'startDate', value: startDate });
                params.push({ name: 'endDate', value: endDate });
            }

            // Estadísticas generales
            const statsQuery = `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN Status = 'Planificada' THEN 1 ELSE 0 END) as planificadas,
                    SUM(CASE WHEN Status = 'Confirmada' THEN 1 ELSE 0 END) as confirmadas,
                    SUM(CASE WHEN Status = 'Aceptada' THEN 1 ELSE 0 END) as aceptadas,
                    SUM(CASE WHEN Status = 'Cancelada' THEN 1 ELSE 0 END) as canceladas,
                    SUM(CASE WHEN Status = 'Anula' THEN 1 ELSE 0 END) as anuladas
                FROM DCitas 
                ${dateFilter}
            `;

            const statsResult = await dbConfig.query(statsQuery, params);
            const stats = statsResult.recordset[0];

            // Citas por día (últimos 7 días)
            const dailyQuery = `
                SELECT 
                    Date,
                    COUNT(*) as total,
                    SUM(CASE WHEN Status = 'Confirmada' THEN 1 ELSE 0 END) as confirmadas,
                    SUM(CASE WHEN Status = 'Cancelada' THEN 1 ELSE 0 END) as canceladas
                FROM DCitas
                WHERE Date >= DATEADD(DAY, -7, CAST(GETDATE() AS DATE))
                GROUP BY Date
                ORDER BY Date DESC
            `;

            const dailyResult = await dbConfig.query(dailyQuery);

            // Tratamientos más comunes
            const treatmentQuery = `
                SELECT TOP 5
                    Treatment,
                    COUNT(*) as total
                FROM DCitas
                ${dateFilter.replace('WHERE', 'WHERE')}
                GROUP BY Treatment
                ORDER BY COUNT(*) DESC
            `;

            const treatmentResult = await dbConfig.query(treatmentQuery, params);

            res.json({
                success: true,
                data: {
                    summary: {
                        total: stats.total,
                        planificadas: stats.planificadas,
                        confirmadas: stats.confirmadas,
                        aceptadas: stats.aceptadas,
                        canceladas: stats.canceladas,
                        anuladas: stats.anuladas,
                        confirmacionRate: stats.total > 0 ? 
                            Math.round((stats.confirmadas / stats.total) * 100) : 0
                    },
                    daily: dailyResult.recordset,
                    topTreatments: treatmentResult.recordset
                }
            });

        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                code: 'GET_STATS_ERROR'
            });
        }
    }
}

module.exports = AppointmentController;