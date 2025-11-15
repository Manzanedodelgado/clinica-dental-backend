// Invoice Management System with Verifactu Compliance
class InvoiceManager {
    constructor() {
        this.invoices = [];
        this.currentInvoice = null;
        this.verifactuEnabled = true;
        this.lastInvoiceNumber = 'F20241215001';
        this.init();
    }

    init() {
        this.loadMockData();
        this.setupEventListeners();
        this.renderInvoicesList();
    }

    setupEventListeners() {
        // New invoice button
        const newInvoiceBtn = document.getElementById('newInvoiceBtn');
        if (newInvoiceBtn) {
            newInvoiceBtn.addEventListener('click', () => this.showNewInvoiceModal());
        }

        // Invoice search and filters
        const invoiceSearch = document.getElementById('invoiceSearch');
        const invoiceStatus = document.getElementById('invoiceStatus');
        
        if (invoiceSearch) {
            invoiceSearch.addEventListener('input', () => this.filterInvoices());
        }
        
        if (invoiceStatus) {
            invoiceStatus.addEventListener('change', () => this.filterInvoices());
        }

        // Invoice actions
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-invoice-action]')) {
                const action = e.target.getAttribute('data-invoice-action');
                const invoiceId = parseInt(e.target.closest('[data-invoice-id]').getAttribute('data-invoice-id'));
                this.handleInvoiceAction(action, invoiceId);
            }
        });

        // Preview invoice
        const previewBtn = document.getElementById('previewInvoice');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.previewInvoice());
        }

        // Download PDF
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-download-pdf]')) {
                const invoiceId = parseInt(e.target.closest('[data-invoice-id]').getAttribute('data-invoice-id'));
                this.downloadPDF(invoiceId);
            }
        });

        // Send via email
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-send-email]')) {
                const invoiceId = parseInt(e.target.closest('[data-invoice-id]').getAttribute('data-invoice-id'));
                this.sendViaEmail(invoiceId);
            }
        });
    }

    loadMockData() {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        this.invoices = [
            {
                id: 1,
                number: 'F20241215001',
                date: '2024-12-15',
                customerName: 'María García López',
                customerNif: '12345678A',
                customerAddress: 'Calle Mayor 123, Madrid',
                items: [
                    { concept: 'Consulta General', quantity: 1, price: 50.00, iva: 21 },
                    { concept: 'Radiografía', quantity: 1, price: 25.00, iva: 21 }
                ],
                subtotal: 75.00,
                iva: 15.75,
                total: 90.75,
                status: 'sent',
                paymentStatus: 'pending',
                hash: this.generateVerifactuHash('F20241215001'),
                qrData: this.generateQRData('F20241215001'),
                createdAt: '2024-12-15T10:30:00',
                sentAt: '2024-12-15T10:35:00'
            },
            {
                id: 2,
                number: 'F20241214002',
                date: '2024-12-14',
                customerName: 'Carlos Ruiz Fernández',
                customerNif: '87654321B',
                customerAddress: 'Av. Libertad 45, Madrid',
                items: [
                    { concept: 'Limpieza Dental', quantity: 1, price: 60.00, iva: 21 },
                    { concept: 'Fluorización', quantity: 1, price: 30.00, iva: 21 }
                ],
                subtotal: 90.00,
                iva: 18.90,
                total: 108.90,
                status: 'paid',
                paymentStatus: 'paid',
                hash: this.generateVerifactuHash('F20241214002'),
                qrData: this.generateQRData('F20241214002'),
                createdAt: '2024-12-14T15:20:00',
                sentAt: '2024-12-14T15:25:00',
                paidAt: '2024-12-15T09:15:00'
            },
            {
                id: 3,
                number: 'F20241213003',
                date: '2024-12-13',
                customerName: 'Ana Martín Sánchez',
                customerNif: '11223344C',
                customerAddress: 'Plaza España 8, Madrid',
                items: [
                    { concept: 'Implante Dental', quantity: 1, price: 1200.00, iva: 21 },
                    { concept: 'Corona', quantity: 1, price: 400.00, iva: 21 }
                ],
                subtotal: 1600.00,
                iva: 336.00,
                total: 1936.00,
                status: 'pending',
                paymentStatus: 'pending',
                hash: this.generateVerifactuHash('F20241213003'),
                qrData: this.generateQRData('F20241213003'),
                createdAt: '2024-12-13T11:45:00'
            },
            {
                id: 4,
                number: 'F20241212004',
                date: '2024-12-12',
                customerName: 'Pedro López Gómez',
                customerNif: '55667788D',
                customerAddress: 'Calle Sol 67, Madrid',
                items: [
                    { concept: 'Ortodoncia - Consulta', quantity: 1, price: 80.00, iva: 21 },
                    { concept: 'Estudio Radiológico', quantity: 1, price: 150.00, iva: 21 }
                ],
                subtotal: 230.00,
                iva: 48.30,
                total: 278.30,
                status: 'sent',
                paymentStatus: 'pending',
                hash: this.generateVerifactuHash('F20241212004'),
                qrData: this.generateQRData('F20241212004'),
                createdAt: '2024-12-12T16:30:00',
                sentAt: '2024-12-12T16:35:00'
            }
        ];
    }

    renderInvoicesList() {
        const container = document.getElementById('invoicesList');
        if (!container) return;

        const filteredInvoices = this.getFilteredInvoices();

        if (filteredInvoices.length === 0) {
            container.innerHTML = `
                <div class="no-invoices">
                    <i class="fas fa-file-invoice-dollar"></i>
                    <h3>No se encontraron facturas</h3>
                    <p>No hay facturas que coincidan con los filtros seleccionados.</p>
                    <button class="btn btn-primary" onclick="invoiceManager.showNewInvoiceModal()">
                        <i class="fas fa-plus"></i> Crear Primera Factura
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="invoice-header-row">
                <div class="invoice-col-number">Número</div>
                <div class="invoice-col-customer">Cliente</div>
                <div class="invoice-col-amount">Importe</div>
                <div class="invoice-col-date">Fecha</div>
                <div class="invoice-col-status">Estado</div>
                <div class="invoice-col-actions">Acciones</div>
            </div>
            ${filteredInvoices.map(invoice => `
                <div class="invoice-row" data-invoice-id="${invoice.id}">
                    <div class="invoice-number">
                        <strong>${invoice.number}</strong>
                        ${invoice.verifactuCompliant ? '<i class="fas fa-shield-alt" title="Verifactu" style="color: #198754; margin-left: 4px;"></i>' : ''}
                    </div>
                    <div class="invoice-customer">
                        <div>${invoice.customerName}</div>
                        <small>${invoice.customerNif}</small>
                    </div>
                    <div class="invoice-amount">
                        <strong>${invoice.total.toFixed(2)}€</strong>
                        <small>IVA: ${invoice.iva.toFixed(2)}€</small>
                    </div>
                    <div class="invoice-date">
                        ${this.formatDate(invoice.date)}
                        ${invoice.sentAt ? `<br><small>Enviada: ${this.formatDateTime(invoice.sentAt)}</small>` : ''}
                    </div>
                    <div class="invoice-status">
                        <span class="invoice-status ${invoice.status}">
                            ${this.getStatusLabel(invoice.status)}
                        </span>
                        <br>
                        <span class="payment-status ${invoice.paymentStatus}">
                            ${this.getPaymentStatusLabel(invoice.paymentStatus)}
                        </span>
                    </div>
                    <div class="invoice-actions">
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-outline" 
                                    data-invoice-action="view" 
                                    data-invoice-id="${invoice.id}"
                                    title="Ver factura">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline" 
                                    data-download-pdf 
                                    data-invoice-id="${invoice.id}"
                                    title="Descargar PDF">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="btn btn-sm btn-outline" 
                                    data-send-email 
                                    data-invoice-id="${invoice.id}"
                                    title="Enviar por email">
                                <i class="fas fa-envelope"></i>
                            </button>
                            <button class="btn btn-sm btn-outline" 
                                    data-invoice-action="edit" 
                                    data-invoice-id="${invoice.id}"
                                    title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            ${invoice.status === 'pending' ? `
                                <button class="btn btn-sm btn-primary" 
                                        data-invoice-action="send" 
                                        data-invoice-id="${invoice.id}"
                                        title="Enviar">
                                    <i class="fas fa-paper-plane"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `).join('')}
        `;
    }

    getFilteredInvoices() {
        const searchTerm = document.getElementById('invoiceSearch')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('invoiceStatus')?.value || '';

        return this.invoices.filter(invoice => {
            const matchesSearch = !searchTerm || 
                invoice.number.toLowerCase().includes(searchTerm) ||
                invoice.customerName.toLowerCase().includes(searchTerm) ||
                invoice.customerNif.toLowerCase().includes(searchTerm);

            const matchesStatus = !statusFilter || invoice.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }

    filterInvoices() {
        this.renderInvoicesList();
    }

    showNewInvoiceModal() {
        if (window.dentalApp) {
            window.dentalApp.openModal('invoiceModal');
            this.generateNextInvoiceNumber();
        }
    }

    generateNextInvoiceNumber() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        
        // Extract sequence number from last invoice
        const lastSequence = parseInt(this.lastInvoiceNumber.slice(-3));
        const nextSequence = String(lastSequence + 1).padStart(3, '0');
        
        const nextNumber = `F${year}${month}${day}${nextSequence}`;
        this.lastInvoiceNumber = nextNumber;

        const invoiceNumberInput = document.querySelector('#invoiceForm input[name="invoiceNumber"]');
        if (invoiceNumberInput) {
            invoiceNumberInput.value = nextNumber;
        }
    }

    handleInvoiceAction(action, invoiceId) {
        const invoice = this.invoices.find(inv => inv.id === invoiceId);
        if (!invoice) return;

        switch (action) {
            case 'view':
                this.viewInvoice(invoice);
                break;
            case 'edit':
                this.editInvoice(invoice);
                break;
            case 'send':
                this.sendInvoice(invoice);
                break;
            case 'duplicate':
                this.duplicateInvoice(invoice);
                break;
            case 'cancel':
                this.cancelInvoice(invoice);
                break;
            default:
                console.log('Unknown action:', action);
        }
    }

    viewInvoice(invoice) {
        // Open invoice in preview mode
        this.currentInvoice = invoice;
        this.previewInvoice();
    }

    editInvoice(invoice) {
        // Populate form with invoice data
        const form = document.getElementById('invoiceForm');
        if (form) {
            form.querySelector('input[name="invoiceNumber"]').value = invoice.number;
            form.querySelector('input[name="customerName"]').value = invoice.customerName;
            form.querySelector('input[name="customerAddress"]').value = invoice.customerAddress;
            form.querySelector('input[name="customerNif"]').value = invoice.customerNif;

            // Clear existing items
            const tbody = document.getElementById('invoiceItems');
            tbody.innerHTML = '';

            // Add invoice items
            invoice.items.forEach((item, index) => {
                if (index > 0) this.addInvoiceItem();
                
                const lastRow = tbody.querySelector('tr:last-child');
                lastRow.querySelector('input[name="concept[]"]').value = item.concept;
                lastRow.querySelector('input[name="quantity[]"]').value = item.quantity;
                lastRow.querySelector('input[name="price[]"]').value = item.price;
                lastRow.querySelector('select[name="iva[]"]').value = item.iva;
            });

            this.calculateInvoiceTotals();
        }

        if (window.dentalApp) {
            window.dentalApp.openModal('invoiceModal');
        }
    }

    sendInvoice(invoice) {
        invoice.status = 'sent';
        invoice.sentAt = new Date().toISOString();
        
        // Generate Verifactu hash if not exists
        if (!invoice.hash) {
            invoice.hash = this.generateVerifactuHash(invoice.number);
            invoice.qrData = this.generateQRData(invoice.number);
        }

        this.renderInvoicesList();
        
        if (window.dentalApp) {
            window.dentalApp.showNotification(`Factura ${invoice.number} enviada exitosamente`, 'success');
        }
    }

    duplicateInvoice(invoice) {
        const newInvoice = {
            ...invoice,
            id: Math.max(...this.invoices.map(inv => inv.id), 0) + 1,
            number: this.generateNextInvoiceNumber(),
            date: new Date().toISOString().split('T')[0],
            status: 'pending',
            paymentStatus: 'pending',
            createdAt: new Date().toISOString(),
            sentAt: null,
            hash: null,
            qrData: null
        };

        this.invoices.push(newInvoice);
        this.renderInvoicesList();
        
        if (window.dentalApp) {
            window.dentalApp.showNotification(`Factura ${newInvoice.number} duplicada`, 'success');
        }
    }

    cancelInvoice(invoice) {
        if (confirm(`¿Estás seguro de que quieres cancelar la factura ${invoice.number}?`)) {
            invoice.status = 'cancelled';
            this.renderInvoicesList();
            
            if (window.dentalApp) {
                window.dentalApp.showNotification(`Factura ${invoice.number} cancelada`, 'info');
            }
        }
    }

    previewInvoice() {
        const invoiceData = this.collectInvoiceData();
        if (!invoiceData) return;

        // Create preview window
        const previewWindow = window.open('', '_blank', 'width=800,height=600');
        previewWindow.document.write(this.generateInvoicePreview(invoiceData));
        previewWindow.document.close();
    }

    downloadPDF(invoiceId) {
        const invoice = this.invoices.find(inv => inv.id === invoiceId);
        if (!invoice) return;

        // In a real implementation, this would generate a PDF
        // For now, we'll create a printable HTML version
        const printWindow = window.open('', '_blank');
        printWindow.document.write(this.generateInvoicePreview(invoice));
        printWindow.document.close();
        
        // Auto print after a delay
        setTimeout(() => {
            printWindow.print();
        }, 1000);
    }

    sendViaEmail(invoiceId) {
        const invoice = this.invoices.find(inv => inv.id === invoiceId);
        if (!invoice) return;

        const email = prompt('Dirección de email para enviar la factura:', invoice.customerEmail || '');
        if (email) {
            // In a real implementation, this would send the email
            if (window.dentalApp) {
                window.dentalApp.showNotification(`Factura enviada a ${email}`, 'success');
            }
        }
    }

    generateVerifactuHash(invoiceNumber) {
        // Simplified hash generation for demo purposes
        // In reality, this would use proper cryptographic hashing
        const data = `${invoiceNumber}${Date.now()}${Math.random()}`;
        let hash = 0;
        
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return Math.abs(hash).toString(16).padStart(32, '0');
    }

    generateQRData(invoiceNumber) {
        // Simplified QR data generation for demo purposes
        // In reality, this would follow AEAT specifications
        return {
            url: `https://www7.aeat.es/wlpl/SSII-FACT/veri_FAC_V1.0.html?num=${invoiceNumber}`,
            data: `VERI|${invoiceNumber}|${Date.now()}|EUR`
        };
    }

    collectInvoiceData() {
        const form = document.getElementById('invoiceForm');
        if (!form) return null;

        const formData = new FormData(form);
        const invoiceNumber = formData.get('invoiceNumber');
        const customerName = formData.get('customerName');
        const customerAddress = formData.get('customerAddress');
        const customerNif = formData.get('customerNif');

        // Collect items
        const concepts = formData.getAll('concept[]');
        const quantities = formData.getAll('quantity[]');
        const prices = formData.getAll('price[]');
        const ivas = formData.getAll('iva[]');

        const items = concepts.map((concept, index) => ({
            concept: concept || `Concepto ${index + 1}`,
            quantity: parseFloat(quantities[index]) || 1,
            price: parseFloat(prices[index]) || 0,
            iva: parseFloat(ivas[index]) || 21
        })).filter(item => item.concept && item.quantity > 0 && item.price >= 0);

        if (items.length === 0) {
            alert('Debe incluir al menos un concepto en la factura');
            return null;
        }

        // Calculate totals
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const iva = items.reduce((sum, item) => sum + (item.quantity * item.price * item.iva / 100), 0);
        const total = subtotal + iva;

        return {
            number: invoiceNumber,
            customerName: customerName || 'Cliente',
            customerAddress: customerAddress || '',
            customerNif: customerNif || '',
            items: items,
            subtotal: subtotal,
            iva: iva,
            total: total,
            date: new Date().toISOString().split('T')[0],
            verifactuCompliant: this.verifactuEnabled
        };
    }

    generateInvoicePreview(invoiceData) {
        const clinicInfo = {
            name: 'Rubio García Dental',
            address: 'Calle Example, 123, 28001 Madrid',
            phone: '+34 912 345 678',
            email: 'info@rubiogarciadental.com',
            nif: '12345678A'
        };

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Factura ${invoiceData.number}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                    .invoice { max-width: 800px; margin: 0 auto; background: white; }
                    .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
                    .clinic-info { text-align: left; }
                    .invoice-title { text-align: right; }
                    .clinic-info h1 { color: #0F74A8; margin-bottom: 10px; }
                    .invoice-title h1 { font-size: 28px; margin-bottom: 10px; }
                    .customer-info { margin-bottom: 30px; }
                    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                    .items-table th { background-color: #f5f5f5; font-weight: bold; }
                    .totals { margin-left: auto; width: 300px; }
                    .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
                    .total-final { border-top: 2px solid #333; font-weight: bold; font-size: 18px; }
                    .verifactu-section { background: #E7F1F6; padding: 20px; margin-top: 30px; border-radius: 8px; }
                    .qr-code { width: 80px; height: 80px; background: #0F74A8; color: white; display: inline-block; text-align: center; line-height: 80px; margin-right: 20px; }
                    .verifactu-text { display: inline-block; vertical-align: top; max-width: 200px; }
                </style>
            </head>
            <body>
                <div class="invoice">
                    <div class="header">
                        <div class="clinic-info">
                            <h1>${clinicInfo.name}</h1>
                            <p><strong>Dirección:</strong> ${clinicInfo.address}</p>
                            <p><strong>Teléfono:</strong> ${clinicInfo.phone}</p>
                            <p><strong>Email:</strong> ${clinicInfo.email}</p>
                            <p><strong>NIF:</strong> ${clinicInfo.nif}</p>
                        </div>
                        <div class="invoice-title">
                            <h1>FACTURA</h1>
                            <p><strong>Número:</strong> ${invoiceData.number}</p>
                            <p><strong>Fecha:</strong> ${this.formatDate(invoiceData.date)}</p>
                        </div>
                    </div>
                    
                    <div class="customer-info">
                        <h3>DATOS DEL CLIENTE</h3>
                        <p><strong>Nombre:</strong> ${invoiceData.customerName}</p>
                        <p><strong>NIF/CIF:</strong> ${invoiceData.customerNif}</p>
                        <p><strong>Dirección:</strong> ${invoiceData.customerAddress}</p>
                    </div>
                    
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Concepto</th>
                                <th>Cantidad</th>
                                <th>Precio Unit.</th>
                                <th>IVA %</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoiceData.items.map(item => `
                                <tr>
                                    <td>${item.concept}</td>
                                    <td>${item.quantity}</td>
                                    <td>${item.price.toFixed(2)}€</td>
                                    <td>${item.iva}%</td>
                                    <td>${(item.quantity * item.price * (1 + item.iva/100)).toFixed(2)}€</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div class="totals">
                        <div class="total-row">
                            <span>Subtotal:</span>
                            <span>${invoiceData.subtotal.toFixed(2)}€</span>
                        </div>
                        <div class="total-row">
                            <span>IVA Total:</span>
                            <span>${invoiceData.iva.toFixed(2)}€</span>
                        </div>
                        <div class="total-row total-final">
                            <span>TOTAL:</span>
                            <span>${invoiceData.total.toFixed(2)}€</span>
                        </div>
                    </div>
                    
                    ${invoiceData.verifactuCompliant ? `
                        <div class="verifactu-section">
                            <div class="qr-code">QR</div>
                            <div class="verifactu-text">
                                <p><strong>Factura verificable en la sede electrónica de la AEAT</strong></p>
                                <p>Código Hash: ${this.generateVerifactuHash(invoiceData.number)}</p>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <script>
                    window.print();
                </script>
            </body>
            </html>
        `;

        return html;
    }

    getStatusLabel(status) {
        const labels = {
            'pending': 'Pendiente',
            'sent': 'Enviada',
            'paid': 'Pagada',
            'cancelled': 'Cancelada',
            'overdue': 'Vencida'
        };
        return labels[status] || status;
    }

    getPaymentStatusLabel(status) {
        const labels = {
            'pending': 'Pago Pendiente',
            'paid': 'Pagada',
            'partial': 'Pago Parcial',
            'overdue': 'Vencida'
        };
        return labels[status] || status;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES');
    }

    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('es-ES');
    }

    // Public methods
    createInvoice(invoiceData) {
        const newInvoice = {
            id: Math.max(...this.invoices.map(inv => inv.id), 0) + 1,
            number: invoiceData.number,
            date: invoiceData.date,
            customerName: invoiceData.customerName,
            customerAddress: invoiceData.customerAddress,
            customerNif: invoiceData.customerNif,
            items: invoiceData.items,
            subtotal: invoiceData.subtotal,
            iva: invoiceData.iva,
            total: invoiceData.total,
            status: 'pending',
            paymentStatus: 'pending',
            createdAt: new Date().toISOString(),
            verifactuCompliant: this.verifactuEnabled
        };

        this.invoices.push(newInvoice);
        this.renderInvoicesList();
        
        return newInvoice;
    }

    getInvoicesByStatus(status) {
        return this.invoices.filter(invoice => invoice.status === status);
    }

    getOverdueInvoices() {
        const today = new Date();
        return this.invoices.filter(invoice => 
            invoice.status !== 'paid' && 
            invoice.status !== 'cancelled' &&
            new Date(invoice.date) < today
        );
    }

    getStatistics() {
        const total = this.invoices.length;
        const pending = this.invoices.filter(inv => inv.status === 'pending').length;
        const sent = this.invoices.filter(inv => inv.status === 'sent').length;
        const paid = this.invoices.filter(inv => inv.status === 'paid').length;
        const totalAmount = this.invoices.reduce((sum, inv) => sum + inv.total, 0);
        const paidAmount = this.invoices.filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + inv.total, 0);

        return {
            total,
            pending,
            sent,
            paid,
            totalAmount,
            paidAmount,
            overdueCount: this.getOverdueInvoices().length
        };
    }
}

// Initialize Invoice Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.invoiceManager = new InvoiceManager();
});