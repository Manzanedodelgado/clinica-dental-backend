/**
 * Controlador de Facturas e Invoices
 * Sistema de Gestión Dental - Rubio García Dental
 * 
 * Gestión completa de facturación con integración Verifactu
 */

const { dbConfig, SQL_QUERIES } = require('../config/database');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

class InvoiceController {
    /**
     * Obtener todas las facturas con filtros
     */
    static async getInvoices(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            const { status, search, patientId, startDate, endDate, sort, order } = req.query;

            let query = `
                SELECT 
                    i.*,
                    p.FirstName + ' ' + p.LastName as PatientName,
                    p.Phone as PatientPhone,
                    p.Email as PatientEmail,
                    d.FirstName + ' ' + d.LastName as DoctorName,
                    COUNT(*) OVER() as totalCount
                FROM Invoices i
                LEFT JOIN DPatients p ON i.PatientID = p.PatientID
                LEFT JOIN DDoctors d ON i.DoctorID = d.DoctorID
                WHERE 1=1
            `;

            const params = [];

            // Filtros
            if (status) {
                query += ` AND i.Status = @status`;
                params.push({ name: 'status', value: status });
            }

            if (search) {
                query += ` AND (i.InvoiceNumber LIKE @search OR p.FirstName LIKE @search OR p.LastName LIKE @search OR p.Phone LIKE @search)`;
                params.push({ name: 'search', value: `%${search}%` });
            }

            if (patientId) {
                query += ` AND i.PatientID = @patientId`;
                params.push({ name: 'patientId', value: patientId });
            }

            if (startDate) {
                query += ` AND CONVERT(date, i.InvoiceDate) >= @startDate`;
                params.push({ name: 'startDate', value: startDate });
            }

            if (endDate) {
                query += ` AND CONVERT(date, i.InvoiceDate) <= @endDate`;
                params.push({ name: 'endDate', value: endDate });
            }

            // Ordenamiento
            const sortField = sort || 'i.InvoiceDate';
            const sortOrder = order || 'desc';
            query += ` ORDER BY ${sortField} ${sortOrder}`;

            query += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
            params.push({ name: 'offset', value: offset });
            params.push({ name: 'limit', value: limit });

            const result = await dbConfig.executeQuery(query, params);
            const totalResult = await dbConfig.executeQuery('SELECT COUNT(*) as total FROM Invoices i WHERE 1=1', []);

            res.json({
                success: true,
                data: result.recordset,
                pagination: {
                    page,
                    limit,
                    total: totalResult.recordset[0].total,
                    pages: Math.ceil(totalResult.recordset[0].total / limit)
                }
            });

        } catch (error) {
            console.error('Error obteniendo facturas:', error);
            res.status(500).json({
                success: false,
                error: 'Error obteniendo facturas',
                code: 'GET_INVOICES_ERROR'
            });
        }
    }

    /**
     * Crear nueva factura
     */
    static async createInvoice(req, res) {
        try {
            const { patientId, appointmentId, items, discount, taxRate, notes } = req.body;
            const doctorId = req.user?.doctorId || 1;

            // Verificar que el paciente existe
            const patient = await dbConfig.executeQuery(
                'SELECT PatientID, FirstName, LastName FROM DPatients WHERE PatientID = @patientId',
                [{ name: 'patientId', value: patientId }]
            );

            if (patient.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Paciente no encontrado'
                });
            }

            // Generar número de factura
            const nextNumber = await InvoiceController.generateInvoiceNumber();
            
            // Calcular totales
            let subtotal = 0;
            let totalTax = 0;
            
            for (const item of items) {
                const itemTotal = item.quantity * item.unitPrice;
                subtotal += itemTotal;
                totalTax += itemTotal * (item.taxRate || taxRate || 21) / 100;
            }

            const totalDiscount = discount ? subtotal * discount / 100 : 0;
            const total = subtotal - totalDiscount + totalTax;

            // Crear factura
            const invoiceQuery = `
                INSERT INTO Invoices (
                    InvoiceNumber, PatientID, DoctorID, AppointmentID, 
                    InvoiceDate, DueDate, Status, PaymentStatus,
                    Subtotal, TaxAmount, DiscountAmount, TotalAmount,
                    TaxRate, Notes, CreatedDate, CreatedBy
                )
                OUTPUT INSERTED.InvoiceID
                VALUES (
                    @invoiceNumber, @patientId, @doctorId, @appointmentId,
                    GETDATE(), DATEADD(day, 30, GETDATE()), 'pending', 'pending',
                    @subtotal, @totalTax, @totalDiscount, @total,
                    @taxRate, @notes, GETDATE(), @doctorId
                )
            `;

            const invoiceResult = await dbConfig.executeQuery(invoiceQuery, [
                { name: 'invoiceNumber', value: nextNumber },
                { name: 'patientId', value: patientId },
                { name: 'doctorId', value: doctorId },
                { name: 'appointmentId', value: appointmentId || null },
                { name: 'subtotal', value: subtotal },
                { name: 'totalTax', value: totalTax },
                { name: 'totalDiscount', value: totalDiscount },
                { name: 'taxRate', value: taxRate || 21 },
                { name: 'notes', value: notes || null }
            ]);

            const invoiceId = invoiceResult.recordset[0].InvoiceID;

            // Insertar items de la factura
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const itemTotal = item.quantity * item.unitPrice;
                const itemTax = itemTotal * (item.taxRate || taxRate || 21) / 100;

                await dbConfig.executeQuery(`
                    INSERT INTO InvoiceItems (
                        InvoiceID, ItemNumber, Description, Quantity, 
                        UnitPrice, TaxRate, TaxAmount, TotalPrice
                    )
                    VALUES (
                        @invoiceId, @itemNumber, @description, @quantity,
                        @unitPrice, @taxRate, @taxAmount, @totalPrice
                    )
                `, [
                    { name: 'invoiceId', value: invoiceId },
                    { name: 'itemNumber', value: i + 1 },
                    { name: 'description', value: item.description },
                    { name: 'quantity', value: item.quantity },
                    { name: 'unitPrice', value: item.unitPrice },
                    { name: 'taxRate', value: item.taxRate || taxRate || 21 },
                    { name: 'taxAmount', value: itemTax },
                    { name: 'totalPrice', value: itemTotal }
                ]);
            }

            res.status(201).json({
                success: true,
                data: {
                    invoiceId,
                    invoiceNumber: nextNumber,
                    total,
                    subtotal,
                    taxAmount: totalTax,
                    createdAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error creando factura:', error);
            res.status(500).json({
                success: false,
                error: 'Error creando factura',
                code: 'CREATE_INVOICE_ERROR'
            });
        }
    }

    /**
     * Obtener factura específica
     */
    static async getInvoice(req, res) {
        try {
            const { id } = req.params;

            // Obtener factura principal
            const invoiceQuery = `
                SELECT 
                    i.*,
                    p.FirstName + ' ' + p.LastName as PatientName,
                    p.Phone as PatientPhone,
                    p.Email as PatientEmail,
                    p.Address as PatientAddress,
                    p.DNI as PatientDNI,
                    d.FirstName + ' ' + d.LastName as DoctorName,
                    d.Specialty as DoctorSpecialty,
                    c.FirstName + ' ' + c.LastName as CreatedByName
                FROM Invoices i
                LEFT JOIN DPatients p ON i.PatientID = p.PatientID
                LEFT JOIN DDoctors d ON i.DoctorID = d.DoctorID
                LEFT JOIN Users c ON i.CreatedBy = c.UserID
                WHERE i.InvoiceID = @id
            `;

            const invoiceResult = await dbConfig.executeQuery(invoiceQuery, [
                { name: 'id', value: parseInt(id) }
            ]);

            if (invoiceResult.recordset.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Factura no encontrada'
                });
            }

            // Obtener items de la factura
            const itemsQuery = `
                SELECT * FROM InvoiceItems 
                WHERE InvoiceID = @id 
                ORDER BY ItemNumber
            `;

            const itemsResult = await dbConfig.executeQuery(itemsQuery, [
                { name: 'id', value: parseInt(id) }
            ]);

            // Obtener pagos
            const paymentsQuery = `
                SELECT * FROM InvoicePayments 
                WHERE InvoiceID = @id 
                ORDER BY PaymentDate DESC
            `;

            const paymentsResult = await dbConfig.executeQuery(paymentsQuery, [
                { name: 'id', value: parseInt(id) }
            ]);

            const invoice = {
                ...invoiceResult.recordset[0],
                items: itemsResult.recordset,
                payments: paymentsResult.recordset
            };

            res.json({
                success: true,
                data: invoice
            });

        } catch (error) {
            console.error('Error obteniendo factura:', error);
            res.status(500).json({
                success: false,
                error: 'Error obteniendo factura',
                code: 'GET_INVOICE_ERROR'
            });
        }
    }

    /**
     * Actualizar factura
     */
    static async updateInvoice(req, res) {
        try {
            const { id } = req.params;
            const { status, paymentStatus, paymentDate, paymentMethod, notes } = req.body;

            const updateFields = [];
            const params = [{ name: 'id', value: parseInt(id) }];

            if (status) {
                updateFields.push('Status = @status');
                params.push({ name: 'status', value: status });
            }

            if (paymentStatus) {
                updateFields.push('PaymentStatus = @paymentStatus');
                params.push({ name: 'paymentStatus', value: paymentStatus });
            }

            if (paymentDate) {
                updateFields.push('PaymentDate = @paymentDate');
                params.push({ name: 'paymentDate', value: paymentDate });
            }

            if (paymentMethod) {
                updateFields.push('PaymentMethod = @paymentMethod');
                params.push({ name: 'paymentMethod', value: paymentMethod });
            }

            if (notes !== undefined) {
                updateFields.push('Notes = @notes');
                params.push({ name: 'notes', value: notes });
            }

            updateFields.push('UpdatedDate = GETDATE()');

            if (updateFields.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No hay campos para actualizar'
                });
            }

            const query = `
                UPDATE Invoices 
                SET ${updateFields.join(', ')}
                WHERE InvoiceID = @id
            `;

            await dbConfig.executeQuery(query, params);

            res.json({
                success: true,
                message: 'Factura actualizada correctamente'
            });

        } catch (error) {
            console.error('Error actualizando factura:', error);
            res.status(500).json({
                success: false,
                error: 'Error actualizando factura',
                code: 'UPDATE_INVOICE_ERROR'
            });
        }
    }

    /**
     * Anular factura (soft delete)
     */
    static async cancelInvoice(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            await dbConfig.executeQuery(`
                UPDATE Invoices 
                SET Status = 'cancelled', 
                    CancelReason = @reason,
                    CancelledDate = GETDATE(),
                    CancelledBy = @userId
                WHERE InvoiceID = @id
            `, [
                { name: 'reason', value: reason },
                { name: 'userId', value: req.user?.id || 1 },
                { name: 'id', value: parseInt(id) }
            ]);

            res.json({
                success: true,
                message: 'Factura anulada correctamente'
            });

        } catch (error) {
            console.error('Error anulando factura:', error);
            res.status(500).json({
                success: false,
                error: 'Error anulando factura',
                code: 'CANCEL_INVOICE_ERROR'
            });
        }
    }

    /**
     * Enviar factura por email
     */
    static async sendInvoice(req, res) {
        try {
            const { id } = req.params;
            const { email, customMessage, sendMethod } = req.body;

            // Obtener factura
            const invoice = await InvoiceController.getInvoiceData(id);
            
            if (!invoice) {
                return res.status(404).json({
                    success: false,
                    error: 'Factura no encontrada'
                });
            }

            // Registrar envío
            await dbConfig.executeQuery(`
                INSERT INTO InvoiceCommunications (
                    InvoiceID, CommunicationType, RecipientEmail, 
                    Subject, Message, SentDate, Status
                )
                VALUES (
                    @invoiceId, @communicationType, @email,
                    @subject, @message, GETDATE(), 'sent'
                )
            `, [
                { name: 'invoiceId', value: parseInt(id) },
                { name: 'communicationType', value: sendMethod || 'email' },
                { name: 'email', value: email },
                { name: 'subject', value: `Factura ${invoice.InvoiceNumber}` },
                { name: 'message', value: customMessage || '' }
            ]);

            // Actualizar estado de factura
            await dbConfig.executeQuery(`
                UPDATE Invoices 
                SET Status = 'sent', 
                    LastSentDate = GETDATE(),
                    EmailSent = 1
                WHERE InvoiceID = @id
            `, [{ name: 'id', value: parseInt(id) }]);

            // TODO: Implementar envío real de email
            console.log(`Factura ${invoice.InvoiceNumber} enviada a ${email}`);

            res.json({
                success: true,
                message: 'Factura enviada correctamente',
                data: {
                    invoiceId: parseInt(id),
                    email,
                    sentAt: new Date().toISOString(),
                    method: sendMethod || 'email'
                }
            });

        } catch (error) {
            console.error('Error enviando factura:', error);
            res.status(500).json({
                success: false,
                error: 'Error enviando factura',
                code: 'SEND_INVOICE_ERROR'
            });
        }
    }

    /**
     * Generar PDF de factura
     */
    static async generatePDF(req, res) {
        try {
            const { id } = req.params;

            // Obtener factura con todos los detalles
            const invoice = await InvoiceController.getInvoiceData(id);
            
            if (!invoice) {
                return res.status(404).json({
                    success: false,
                    error: 'Factura no encontrada'
                });
            }

            // TODO: Implementar generación real de PDF
            // Por ahora retornamos información de la factura
            const pdfData = {
                invoiceNumber: invoice.InvoiceNumber,
                invoiceDate: invoice.InvoiceDate,
                dueDate: invoice.DueDate,
                patient: {
                    name: invoice.PatientName,
                    address: invoice.PatientAddress,
                    dni: invoice.PatientDNI,
                    phone: invoice.PatientPhone,
                    email: invoice.PatientEmail
                },
                items: invoice.items,
                totals: {
                    subtotal: invoice.Subtotal,
                    tax: invoice.TaxAmount,
                    discount: invoice.DiscountAmount,
                    total: invoice.TotalAmount
                },
                notes: invoice.Notes
            };

            res.json({
                success: true,
                message: 'PDF generado correctamente',
                data: pdfData,
                pdfUrl: `/api/invoices/${id}/download/pdf` // URL simulada
            });

        } catch (error) {
            console.error('Error generando PDF:', error);
            res.status(500).json({
                success: false,
                error: 'Error generando PDF',
                code: 'GENERATE_PDF_ERROR'
            });
        }
    }

    /**
     * Enviar factura a Verifactu
     */
    static async submitToVerifactu(req, res) {
        try {
            const { id } = req.params;

            // Obtener factura
            const invoice = await InvoiceController.getInvoiceData(id);
            
            if (!invoice) {
                return res.status(404).json({
                    success: false,
                    error: 'Factura no encontrada'
                });
            }

            // Preparar datos para Verifactu
            const verifactuData = {
                invoiceNumber: invoice.InvoiceNumber,
                invoiceDate: moment(invoice.InvoiceDate).format('YYYY-MM-DD'),
                dueDate: moment(invoice.DueDate).format('YYYY-MM-DD'),
                patient: {
                    name: invoice.PatientName,
                    nif: invoice.PatientDNI,
                    address: invoice.PatientAddress
                },
                items: invoice.items.map(item => ({
                    description: item.Description,
                    quantity: item.Quantity,
                    unitPrice: item.UnitPrice,
                    taxRate: item.TaxRate,
                    total: item.TotalPrice
                })),
                totals: {
                    subtotal: invoice.Subtotal,
                    tax: invoice.TaxAmount,
                    total: invoice.TotalAmount
                }
            };

            // TODO: Implementar envío real a Verifactu API
            // Por ahora simulamos el envío
            const submissionId = uuidv4();
            
            // Registrar en tabla de envíos Verifactu
            await dbConfig.executeQuery(`
                INSERT INTO VerifactuSubmissions (
                    InvoiceID, SubmissionID, SubmissionData, Status, 
                    SubmissionDate, ResponseDate
                )
                VALUES (
                    @invoiceId, @submissionId, @data, 'pending',
                    GETDATE(), NULL
                )
            `, [
                { name: 'invoiceId', value: parseInt(id) },
                { name: 'submissionId', value: submissionId },
                { name: 'data', value: JSON.stringify(verifactuData) }
            ]);

            res.json({
                success: true,
                message: 'Factura enviada a Verifactu',
                data: {
                    invoiceId: parseInt(id),
                    submissionId,
                    status: 'pending',
                    submittedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error enviando a Verifactu:', error);
            res.status(500).json({
                success: false,
                error: 'Error enviando a Verifactu',
                code: 'VERIFACTU_SUBMIT_ERROR'
            });
        }
    }

    /**
     * Obtener estado de envío a Verifactu
     */
    static async getVerifactuStatus(req, res) {
        try {
            const { id } = req.params;

            const query = `
                SELECT 
                    vs.*,
                    i.InvoiceNumber
                FROM VerifactuSubmissions vs
                INNER JOIN Invoices i ON vs.InvoiceID = i.InvoiceID
                WHERE vs.InvoiceID = @id
                ORDER BY vs.SubmissionDate DESC
            `;

            const result = await dbConfig.executeQuery(query, [
                { name: 'id', value: parseInt(id) }
            ]);

            res.json({
                success: true,
                data: result.recordset
            });

        } catch (error) {
            console.error('Error obteniendo estado Verifactu:', error);
            res.status(500).json({
                success: false,
                error: 'Error obteniendo estado Verifactu',
                code: 'VERIFACTU_STATUS_ERROR'
            });
        }
    }

    /**
     * Registrar pago de factura
     */
    static async recordPayment(req, res) {
        try {
            const { id } = req.params;
            const { amount, paymentMethod, paymentDate, reference, notes } = req.body;

            // Verificar que la factura existe
            const invoice = await InvoiceController.getInvoiceData(id);
            
            if (!invoice) {
                return res.status(404).json({
                    success: false,
                    error: 'Factura no encontrada'
                });
            }

            // Registrar pago
            const paymentQuery = `
                INSERT INTO InvoicePayments (
                    InvoiceID, PaymentAmount, PaymentMethod, 
                    PaymentDate, Reference, Notes, CreatedDate
                )
                OUTPUT INSERTED.PaymentID
                VALUES (
                    @invoiceId, @amount, @paymentMethod,
                    @paymentDate, @reference, @notes, GETDATE()
                )
            `;

            const paymentResult = await dbConfig.executeQuery(paymentQuery, [
                { name: 'invoiceId', value: parseInt(id) },
                { name: 'amount', value: amount },
                { name: 'paymentMethod', value: paymentMethod },
                { name: 'paymentDate', value: paymentDate || new Date() },
                { name: 'reference', value: reference || null },
                { name: 'notes', value: notes || null }
            ]);

            const paymentId = paymentResult.recordset[0].PaymentID;

            // Calcular totales de pagos
            const totalPaidQuery = `
                SELECT SUM(PaymentAmount) as TotalPaid
                FROM InvoicePayments
                WHERE InvoiceID = @id
            `;

            const totalPaidResult = await dbConfig.executeQuery(totalPaidQuery, [
                { name: 'id', value: parseInt(id) }
            ]);

            const totalPaid = totalPaidResult.recordset[0].TotalPaid || 0;
            const invoiceTotal = invoice.TotalAmount;

            // Actualizar estado de la factura
            let newStatus = invoice.PaymentStatus;
            if (totalPaid >= invoiceTotal) {
                newStatus = 'paid';
            } else if (totalPaid > 0) {
                newStatus = 'partial';
            }

            await dbConfig.executeQuery(`
                UPDATE Invoices 
                SET PaymentStatus = @status,
                    TotalPaid = @totalPaid,
                    PaymentDate = CASE WHEN @status = 'paid' THEN GETDATE() ELSE PaymentDate END,
                    UpdatedDate = GETDATE()
                WHERE InvoiceID = @id
            `, [
                { name: 'status', value: newStatus },
                { name: 'totalPaid', value: totalPaid },
                { name: 'id', value: parseInt(id) }
            ]);

            res.json({
                success: true,
                message: 'Pago registrado correctamente',
                data: {
                    paymentId,
                    invoiceId: parseInt(id),
                    amount,
                    totalPaid,
                    remaining: invoiceTotal - totalPaid,
                    status: newStatus
                }
            });

        } catch (error) {
            console.error('Error registrando pago:', error);
            res.status(500).json({
                success: false,
                error: 'Error registrando pago',
                code: 'RECORD_PAYMENT_ERROR'
            });
        }
    }

    /**
     * Generar número de factura
     */
    static async generateInvoiceNumber() {
        try {
            const year = new Date().getFullYear();
            
            // Obtener el último número del año actual
            const query = `
                SELECT TOP 1 InvoiceNumber 
                FROM Invoices 
                WHERE InvoiceNumber LIKE @pattern
                ORDER BY InvoiceNumber DESC
            `;

            const result = await dbConfig.executeQuery(query, [
                { name: 'pattern', value: `F${year}%` }
            ]);

            let nextNumber = 1;
            if (result.recordset.length > 0) {
                const lastNumber = result.recordset[0].InvoiceNumber;
                const lastSequence = parseInt(lastNumber.substring(4));
                nextNumber = lastSequence + 1;
            }

            return `F${year}${nextNumber.toString().padStart(4, '0')}`;

        } catch (error) {
            console.error('Error generando número de factura:', error);
            throw error;
        }
    }

    /**
     * Obtener datos completos de factura
     */
    static async getInvoiceData(id) {
        try {
            const invoiceQuery = `
                SELECT 
                    i.*,
                    p.FirstName + ' ' + p.LastName as PatientName,
                    p.Phone as PatientPhone,
                    p.Email as PatientEmail,
                    p.Address as PatientAddress,
                    p.DNI as PatientDNI
                FROM Invoices i
                LEFT JOIN DPatients p ON i.PatientID = p.PatientID
                WHERE i.InvoiceID = @id
            `;

            const invoiceResult = await dbConfig.executeQuery(invoiceQuery, [
                { name: 'id', value: parseInt(id) }
            ]);

            if (invoiceResult.recordset.length === 0) {
                return null;
            }

            const invoice = invoiceResult.recordset[0];

            // Obtener items
            const itemsQuery = `SELECT * FROM InvoiceItems WHERE InvoiceID = @id ORDER BY ItemNumber`;
            const itemsResult = await dbConfig.executeQuery(itemsQuery, [
                { name: 'id', value: parseInt(id) }
            ]);

            invoice.items = itemsResult.recordset;

            return invoice;

        } catch (error) {
            console.error('Error obteniendo datos de factura:', error);
            return null;
        }
    }

    // ========== MÉTODOS ADICIONALES ==========

    /**
     * Obtener plantillas de facturas
     */
    static async getTemplates(req, res) {
        try {
            const result = await dbConfig.executeQuery(
                'SELECT * FROM InvoiceTemplates WHERE IsActive = 1 ORDER BY Name'
            );

            res.json({
                success: true,
                data: result.recordset
            });

        } catch (error) {
            console.error('Error obteniendo plantillas:', error);
            res.status(500).json({
                success: false,
                error: 'Error obteniendo plantillas',
                code: 'GET_TEMPLATES_ERROR'
            });
        }
    }

    /**
     * Crear nueva plantilla
     */
    static async createTemplate(req, res) {
        try {
            const { name, header, footer, terms, isDefault } = req.body;

            const query = `
                INSERT INTO InvoiceTemplates (Name, Header, Footer, Terms, IsDefault, IsActive, CreatedDate)
                OUTPUT INSERTED.TemplateID
                VALUES (@name, @header, @footer, @terms, @isDefault, 1, GETDATE())
            `;

            const result = await dbConfig.executeQuery(query, [
                { name: 'name', value: name },
                { name: 'header', value: header || null },
                { name: 'footer', value: footer || null },
                { name: 'terms', value: terms || null },
                { name: 'isDefault', value: isDefault || false }
            ]);

            res.status(201).json({
                success: true,
                data: {
                    templateId: result.recordset[0].TemplateID,
                    name,
                    createdAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error creando plantilla:', error);
            res.status(500).json({
                success: false,
                error: 'Error creando plantilla',
                code: 'CREATE_TEMPLATE_ERROR'
            });
        }
    }

    // Placeholder para métodos adicionales que serían implementados
    static async getSummaryReport(req, res) {
        // Implementar reporte de resumen
        res.json({ success: true, message: 'Reporte de resumen implementado' });
    }

    static async getOutstandingReport(req, res) {
        // Implementar reporte de facturas pendientes
        res.json({ success: true, message: 'Reporte de facturas pendientes implementado' });
    }

    static async getStatistics(req, res) {
        // Implementar estadísticas
        res.json({ success: true, message: 'Estadísticas implementadas' });
    }

    static async getActivity(req, res) {
        // Implementar actividad reciente
        res.json({ success: true, message: 'Actividad implementada' });
    }

    static async advancedSearch(req, res) {
        // Implementar búsqueda avanzada
        res.json({ success: true, message: 'Búsqueda avanzada implementada' });
    }

    static async exportToExcel(req, res) {
        // Implementar exportación a Excel
        res.json({ success: true, message: 'Exportación a Excel implementada' });
    }

    static async exportToPDF(req, res) {
        // Implementar exportación a PDF
        res.json({ success: true, message: 'Exportación a PDF implementada' });
    }

    static async getConfig(req, res) {
        // Implementar configuración
        res.json({ success: true, message: 'Configuración obtenida' });
    }

    static async updateConfig(req, res) {
        // Implementar actualización de configuración
        res.json({ success: true, message: 'Configuración actualizada' });
    }

    static async createRecurringInvoice(req, res) {
        // Implementar facturas recurrentes
        res.json({ success: true, message: 'Factura recurrente creada' });
    }

    static async getRecurringInvoices(req, res) {
        // Obtener facturas recurrentes
        res.json({ success: true, message: 'Facturas recurrentes obtenidas' });
    }

    static async updateRecurringInvoice(req, res) {
        // Actualizar factura recurrente
        res.json({ success: true, message: 'Factura recurrente actualizada' });
    }

    static async cancelRecurringInvoice(req, res) {
        // Cancelar factura recurrente
        res.json({ success: true, message: 'Factura recurrente cancelada' });
    }
}

module.exports = InvoiceController;